import { NextResponse } from 'next/server';
import os from 'node:os';
import { extractFields } from '@/lib/extract';
import { ModelError } from '@/lib/model';
import { rateLimit } from '@/lib/rate-limit';

const IMAGE_TYPES = ['image/jpeg', 'image/png'];
const MAX_BYTES = 10 * 1024 * 1024;

async function readPdf(buffer: Buffer) {
  // The worker module sets up pdf.js for serverless and must load before pdf-parse.
  await import('pdf-parse/worker');
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: buffer });
  try {
    return (await parser.getText()).text || '';
  } finally {
    await parser.destroy();
  }
}

async function readImage(buffer: Buffer) {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng', undefined, { cachePath: os.tmpdir() });
  try {
    return (await worker.recognize(buffer)).data.text || '';
  } finally {
    await worker.terminate();
  }
}

export async function POST(req: Request) {
  const limited = rateLimit(req);
  if (limited) return limited;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const isPdf = file.type === 'application/pdf';
    const isImage = IMAGE_TYPES.includes(file.type);
    if (!isPdf && !isImage) {
      return NextResponse.json(
        { error: 'Unsupported file type. Upload a PDF, JPG, or PNG.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File is too large. The limit is 10 MB.' }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const text = isPdf ? await readPdf(buffer) : await readImage(buffer);

    if (text.trim().length < 10) {
      return NextResponse.json(
        {
          error: isPdf
            ? 'Could not read text from this PDF. Try a text-based invoice or enter details manually.'
            : 'Could not read text from this image. Try a clearer photo or enter details manually.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ extracted: await extractFields(text) });
  } catch (error) {
    console.error(error);
    const message = error instanceof ModelError ? error.message : 'Failed to process invoice';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
