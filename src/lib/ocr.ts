export async function readImageText(image: File) {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng');
  try {
    return (await worker.recognize(image)).data.text || '';
  } finally {
    await worker.terminate();
  }
}
