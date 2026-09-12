import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const outDir = join(process.cwd(), "public", "sample-docs");
mkdirSync(outDir, { recursive: true });

function esc(s) {
  return s.replace(/([()\\])/g, "\\$1");
}

function makePdf(title, lines) {
  const ops = [`BT /F1 16 Tf 72 720 Td (${esc(title)}) Tj ET`];
  let y = 690;
  for (const line of lines) {
    ops.push(`BT /F1 11 Tf 72 ${y} Td (${esc(line)}) Tj ET`);
    y -= 18;
  }
  const content = ops.join("\n");

  const objects = {};
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = "<< /Type /Pages /Kids [3 0 R] /Count 1 >>";
  objects[3] =
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>";
  objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[5] = `<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}\nendstream`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let i = 1; i <= 5; i++) {
    offsets[i] = Buffer.byteLength(pdf, "utf8");
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += "xref\n0 6\n0000000000 65535 f \n";
  for (let i = 1; i <= 5; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
}

const BODY = [
  "This is a placeholder PDF generated for the Seeger Weiss MCO dashboard prototype.",
  "It does not represent a real court filing.",
  "",
  "Seeger Weiss LLP - synthetic demo data only.",
];

const docs = {
  order: "SAMPLE ORDER (Synthetic Demo Document)",
  motion: "SAMPLE MOTION (Synthetic Demo Document)",
  notice: "SAMPLE NOTICE (Synthetic Demo Document)",
  report: "SAMPLE REPORT (Synthetic Demo Document)",
  cmo: "SAMPLE CASE MANAGEMENT ORDER (Synthetic Demo Document)",
  exhibit: "SAMPLE EXHIBIT (Synthetic Demo Document)",
};

for (const [tag, title] of Object.entries(docs)) {
  const pdf = makePdf(title, BODY);
  writeFileSync(join(outDir, `${tag}.pdf`), Buffer.from(pdf, "latin1"));
  console.log(`wrote ${tag}.pdf (${pdf.length} bytes)`);
}
