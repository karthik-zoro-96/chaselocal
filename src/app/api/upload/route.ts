import { NextResponse } from 'next/server';
import os from 'node:os';
import { PDFParse } from 'pdf-parse';
import { createWorker } from 'tesseract.js';

const IMAGE_TYPES = ['image/jpeg', 'image/png'];

async function readPdf(buffer: Buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    return (await parser.getText()).text || '';
  } finally {
    await parser.destroy();
  }
}

async function readImage(buffer: Buffer) {
  const worker = await createWorker('eng', undefined, { cachePath: os.tmpdir() });
  try {
    return (await worker.recognize(buffer)).data.text || '';
  } finally {
    await worker.terminate();
  }
}

export async function POST(req: Request) {
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

    const extractRes = await fetch(new URL('/api/extract', req.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    const extractData = await extractRes.json();
    if (!extractRes.ok) {
      return NextResponse.json(extractData, { status: extractRes.status });
    }

    return NextResponse.json(extractData);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to process invoice' }, { status: 500 });
  }
}
