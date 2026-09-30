export interface RankedRow {
  candidate_name: string;
  score: number;
  why_fit: string;
  risk_flag: string;
  evidence: string;
}

const esc = (v: string | number) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(rows: RankedRow[]): string {
  const header = ["candidate_name", "score", "why_fit", "risk_flag", "evidence"];
  const body = rows.map((r) =>
    header.map((h) => esc((r as unknown as Record<string, string | number>)[h])).join(","),
  );
  return [header.join(","), ...body].join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
