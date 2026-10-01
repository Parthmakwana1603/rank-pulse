// Renders a report document to PDF, CSV or XLSX.
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

export interface ReportTable {
  columns: string[];
  rows: (string | number | null)[][];
}

export interface ReportSection {
  title: string;
  note?: string;
  tables: ReportTable[];
}

export interface ReportDoc {
  title: string;
  subtitle: string;
  sections: ReportSection[];
}

export const mimeTypes = {
  pdf: 'application/pdf',
  csv: 'text/csv',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
} as const;

const cellText = (v: string | number | null) => (v === null || v === undefined ? '—' : String(v));

// ── CSV ────────────────────────────────────────────────────────────────────

function csvCell(v: string | number | null) {
  let s = v === null || v === undefined ? '' : String(v);
  // Neutralise spreadsheet formulas (CSV injection) in user-provided text.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function renderCsv(doc: ReportDoc): Buffer {
  const lines = [csvCell(doc.title), csvCell(doc.subtitle), ''];
  for (const section of doc.sections) {
    lines.push(csvCell(section.title));
    if (section.note) lines.push(csvCell(section.note));
    for (const table of section.tables) {
      lines.push(table.columns.map(csvCell).join(','));
      for (const row of table.rows) lines.push(row.map(csvCell).join(','));
      lines.push('');
    }
    if (section.tables.length === 0) lines.push('');
  }
  // UTF-8 byte-order mark so Excel opens the file with the right encoding.
  return Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(lines.join('\r\n'), 'utf8')]);
}

// ── XLSX ───────────────────────────────────────────────────────────────────

export async function renderXlsx(doc: ReportDoc): Promise<Buffer> {
  const book = new ExcelJS.Workbook();
  book.creator = 'RankPulse';
  const summary = book.addWorksheet('Summary');
  summary.addRow([doc.title]).font = { bold: true, size: 14 };
  summary.addRow([doc.subtitle]);
  for (const section of doc.sections) {
    const sheet = book.addWorksheet(section.title.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31));
    if (section.note) sheet.addRow([section.note]).font = { italic: true };
    for (const table of section.tables) {
      sheet.addRow(table.columns).font = { bold: true };
      for (const row of table.rows) sheet.addRow(row.map((v) => (v === null ? '' : v)));
      sheet.addRow([]);
    }
    sheet.columns.forEach((c) => (c.width = 22));
  }
  return Buffer.from(await book.xlsx.writeBuffer());
}

// ── PDF ────────────────────────────────────────────────────────────────────

export function renderPdf(doc: ReportDoc): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const pdf = new PDFDocument({ size: 'A4', margin: 48, info: { Title: doc.title, Author: 'RankPulse' } });
    const chunks: Buffer[] = [];
    pdf.on('data', (c: Buffer) => chunks.push(c));
    pdf.on('end', () => resolve(Buffer.concat(chunks)));
    pdf.on('error', reject);

    const left = pdf.page.margins.left;
    const width = pdf.page.width - pdf.page.margins.left - pdf.page.margins.right;
    const bottom = () => pdf.page.height - pdf.page.margins.bottom;

    pdf.fontSize(20).font('Helvetica-Bold').text(doc.title);
    pdf.moveDown(0.2).fontSize(10).font('Helvetica').fillColor('#555555').text(doc.subtitle).fillColor('#000000');

    for (const section of doc.sections) {
      if (pdf.y > bottom() - 80) pdf.addPage();
      pdf.moveDown(1.2).fontSize(14).font('Helvetica-Bold').text(section.title, left);
      if (section.note) pdf.moveDown(0.3).fontSize(9).font('Helvetica-Oblique').fillColor('#555555').text(section.note, left, pdf.y, { width }).fillColor('#000000');

      for (const table of section.tables) {
        pdf.moveDown(0.5);
        const colWidth = width / table.columns.length;
        const drawRow = (cells: string[], bold: boolean) => {
          if (pdf.y > bottom() - 20) pdf.addPage();
          const y = pdf.y;
          pdf.fontSize(8.5).font(bold ? 'Helvetica-Bold' : 'Helvetica');
          cells.forEach((cell, i) => pdf.text(cell, left + i * colWidth, y, { width: colWidth - 6, ellipsis: true, lineBreak: false }));
          pdf.x = left;
          pdf.y = y + 14;
        };
        drawRow(table.columns, true);
        pdf.moveTo(left, pdf.y - 3).lineTo(left + width, pdf.y - 3).strokeColor('#cccccc').stroke();
        for (const row of table.rows) drawRow(row.map(cellText), false);
      }
    }
    pdf.end();
  });
}

export async function render(doc: ReportDoc, format: keyof typeof mimeTypes): Promise<Buffer> {
  if (format === 'csv') return renderCsv(doc);
  if (format === 'xlsx') return renderXlsx(doc);
  return renderPdf(doc);
}
