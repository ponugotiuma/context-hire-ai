// Client-side PDF text extraction. pdfjs-dist references DOMMatrix at module
// init, so we MUST lazy-import it (and its worker) inside the function — never
// at module top, or SSR crashes.
export async function extractPdfText(file: File): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("extractPdfText can only run in the browser");
  }
  const pdfjs = await import("pdfjs-dist");
  // @ts-ignore - vite ?url import
  const workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  const out: string[] = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const tc = await page.getTextContent();
    const items = (tc.items as Array<{ str: string; transform: number[] }>)
      .filter((i) => "str" in i)
      .map((i) => ({ str: i.str, x: i.transform[4], y: i.transform[5] }));
    items.sort((a, b) => (b.y - a.y) * 1000 + (a.x - b.x));
    let lastY: number | null = null;
    let line = "";
    const lines: string[] = [];
    for (const it of items) {
      if (lastY === null || Math.abs(it.y - lastY) < 3) {
        line += (line ? " " : "") + it.str;
      } else {
        if (line.trim()) lines.push(line.trim());
        line = it.str;
      }
      lastY = it.y;
    }
    if (line.trim()) lines.push(line.trim());
    out.push(lines.join("\n"));
  }
  return out.join("\n\n").replace(/\s+\n/g, "\n").trim();
}
