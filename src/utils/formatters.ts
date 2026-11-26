import type { AutomatedReport } from '../types/library';

export function formatDateId(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTimeId(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTimeId(iso: string): string {
  return new Date(iso).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

export function getDaysDelta(targetIso: string): number {
  const diff = new Date(targetIso).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

export function downloadReportCsv(report: AutomatedReport): void {
  const escapeCell = (val: string | number) => {
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLines = [
    ['Kode Laporan', report.reportCode],
    ['Judul', report.title],
    ['Jenis', report.type],
    ['Pemicu', report.trigger],
    ['Tanggal Terbit', formatDateTimeId(report.generatedAt)],
    ['Total Pinjaman', report.summary.totalLoans],
    ['Pinjaman Aktif', report.summary.activeLoans],
    ['Terlambat', report.summary.overdueLoans],
    ['Utilisasi Koleksi', `${report.summary.utilizationRate}%`],
    ['Total Denda', formatRupiah(report.summary.totalFines)],
    [],
    ['Item / Judul', 'Kategori / Anggota', 'Metrik Utama', 'Metrik Sekunder', 'Status'],
  ];

  const dataLines = report.rows.map((r) => [
    r.label,
    r.category,
    r.metricA,
    r.metricB,
    r.status,
  ]);

  const csvContent =
    '\uFEFF' +
    [...headerLines, ...dataLines]
      .map((row) => row.map(escapeCell).join(','))
      .join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${report.reportCode.toLowerCase()}-wonu-library.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
