import { NextResponse } from 'next/server';
import { MAX_PDF_BYTES } from '@/lib/api';
import { extractFields } from '@/lib/extract';
import { ModelError } from '@/lib/model';
import { rateLimit } from '@/lib/rate-limit';

const MAX_TEXT = 20_000;

class UnreadablePdfError extends Error {}

async function readPdf(buffer: Buffer) {
  // The worker module sets up pdf.js for serverless and must load before pdf-parse.
  await import('pdf-parse/worker');
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: buffer });
  try {
    return (await parser.getText()).text || '';
  } catch (error) {
    const name = error instanceof Error ? error.name : '';
    if (name === 'PasswordException') {
      throw new UnreadablePdfError('This PDF is password-protected. Remove the password or enter details manually.');
    }
    if (name === 'InvalidPDFException') {
      throw new UnreadablePdfError('This PDF looks damaged and could not be opened. Try exporting it again.');
    }
    throw error;
  } finally {
    await parser.destroy();
  }
}

// Accepts either a PDF file, or text that the browser already read from a photo.
export async function POST(req: Request) {
  const limited = rateLimit(req);
  if (limited) return limited;

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const ocrText = formData.get('text');

    let text: string;
    if (typeof ocrText === 'string') {
      if (ocrText.length > MAX_TEXT) {
        return NextResponse.json({ error: 'Too much text in this image.' }, { status: 413 });
      }
      text = ocrText;
    } else if (file instanceof File) {
      if (file.type !== 'application/pdf') {
        return NextResponse.json(
          { error: 'Unsupported file type. Upload a PDF, JPG, or PNG.' },
          { status: 400 }
        );
      }
      if (file.size > MAX_PDF_BYTES) {
        return NextResponse.json({ error: 'That file is too large. The limit is 4 MB.' }, { status: 413 });
      }
      text = await readPdf(Buffer.from(await file.arrayBuffer()));
    } else {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (text.trim().length < 10) {
      return NextResponse.json(
        {
          error:
            typeof ocrText === 'string'
              ? 'Could not read text from this image. Try a clearer photo or enter details manually.'
              : 'Could not read text from this PDF. Try a text-based invoice or enter details manually.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ extracted: await extractFields(text) });
  } catch (error) {
    if (error instanceof UnreadablePdfError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error(error);
    const message = error instanceof ModelError ? error.message : 'Failed to process invoice';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
