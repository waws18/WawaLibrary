import { useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Play,
  Printer,
} from 'lucide-react';
import type { AutomatedReport, ReportScheduleConfig, ReportType } from '../types/library';
import { downloadReportCsv, formatDateTimeId, formatRupiah } from '../utils/formatters';

interface ReportsViewProps {
  reports: AutomatedReport[];
  schedule: ReportScheduleConfig;
  onGenerateReport: (type: ReportType, trigger?: 'Manual' | 'Otomatis Terjadwal') => Promise<void>;
  onUpdateSchedule: (patch: Partial<ReportScheduleConfig>) => Promise<void>;
}

export function ReportsView({
  reports,
  schedule,
  onGenerateReport,
  onUpdateSchedule,
}: ReportsViewProps) {
  const [selectedReportId, setSelectedReportId] = useState<string>(reports[0]?.id || '');
  const [generatingType, setGeneratingType] = useState<string | null>(null);

  const activeReport =
    reports.find((r) => r.id === selectedReportId) || reports[0] || null;

  const handleGenerate = async (type: ReportType) => {
    setGeneratingType(type);
    try {
      await onGenerateReport(type, 'Manual');
    } finally {
      setGeneratingType(null);
    }
  };

  const handleRunScheduledBatch = async () => {
    setGeneratingType('batch');
    try {
      if (schedule.includeCirculation) {
        await onGenerateReport('Sirkulasi Harian', 'Otomatis Terjadwal');
      }
      if (schedule.includeInventory) {
        await onGenerateReport('Kesehatan Koleksi', 'Otomatis Terjadwal');
      }
      if (schedule.includeFines) {
        await onGenerateReport('Kepatuhan & Denda', 'Otomatis Terjadwal');
      }
    } finally {
      setGeneratingType(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="no-print flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-teal-700 dark:text-teal-400">
            Sistem Pelaporan Otomatis · Arsip &amp; Ekspor Data
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-slate-900 dark:text-slate-100">
            Pelaporan Otomatis &amp; Audit Sirkulasi
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Atur jadwal penerbitan laporan berkala atau buat ringkasan sirkulasi, kesehatan koleksi,
            dan kepatuhan denda secara instan.
          </p>
        </div>

        <button
          type="button"
          disabled={generatingType !== null}
          onClick={handleRunScheduledBatch}
          className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50 dark:bg-teal-600 dark:hover:bg-teal-500"
        >
          <Play className="h-4 w-4" aria-hidden="true" />
          {generatingType === 'batch' ? 'Menerbitkan...' : 'Jalankan Paket Jadwal Sekarang'}
        </button>
      </div>

      {/* Automation Schedule Configuration */}
      <section
        aria-labelledby="heading-jadwal-otomasi"
        className="no-print rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div>
            <h2
              id="heading-jadwal-otomasi"
              className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100"
            >
              Konfigurasi Penjadwalan Otomatis
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Laporan akan disusun secara otomatis dari data transaksi terbaru sesuai frekuensi
              yang dipilih.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={schedule.enabled}
            onClick={() => onUpdateSchedule({ enabled: !schedule.enabled })}
            className={`inline-flex min-h-[38px] items-center gap-2 rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              schedule.enabled
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            {schedule.enabled ? 'Otomasi Aktif' : 'Otomasi Nonaktif'}
          </button>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-12">
          <div className="space-y-2 lg:col-span-4">
            <label
              htmlFor="schedule-freq"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Frekuensi Penerbitan
            </label>
            <select
              id="schedule-freq"
              value={schedule.frequency}
              onChange={(e) =>
                onUpdateSchedule({
                  frequency: e.target.value as ReportScheduleConfig['frequency'],
                })
              }
              className="min-h-[40px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="Harian">Harian (Setiap 24 Jam)</option>
              <option value="Mingguan">Mingguan (Setiap 7 Hari)</option>
              <option value="Bulanan">Bulanan (Setiap 30 Hari)</option>
            </select>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              <CalendarClock className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
              Jadwal berikutnya:{' '}
              <span className="font-mono">{formatDateTimeId(schedule.nextRunAt)}</span>
            </p>
          </div>

          <div className="space-y-2 lg:col-span-4">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Cakupan Laporan Terjadwal
            </p>
            <div className="space-y-2 pt-1 text-sm">
              <label className="flex cursor-pointer items-center gap-2.5 text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={schedule.includeCirculation}
                  onChange={(e) =>
                    onUpdateSchedule({ includeCirculation: e.target.checked })
                  }
                  className="h-4 w-4 rounded accent-teal-700"
                />
                <span>Laporan Sirkulasi Harian</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2.5 text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={schedule.includeInventory}
                  onChange={(e) =>
                    onUpdateSchedule({ includeInventory: e.target.checked })
                  }
                  className="h-4 w-4 rounded accent-teal-700"
                />
                <span>Laporan Kesehatan Koleksi</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2.5 text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={schedule.includeFines}
                  onChange={(e) =>
                    onUpdateSchedule({ includeFines: e.target.checked })
                  }
                  className="h-4 w-4 rounded accent-teal-700"
                />
                <span>Laporan Kepatuhan &amp; Denda</span>
              </label>
            </div>
          </div>

          <div className="space-y-2 lg:col-span-4">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Terbitkan Laporan Tunggal Instan
            </p>
            <div className="flex flex-col gap-2 pt-1">
              {(
                ['Sirkulasi Harian', 'Kesehatan Koleksi', 'Kepatuhan & Denda'] as ReportType[]
              ).map((rType) => (
                <button
                  key={rType}
                  type="button"
                  disabled={generatingType !== null}
                  onClick={() => handleGenerate(rType)}
                  className="flex min-h-[38px] items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <span>{rType}</span>
                  <span className="text-teal-700 dark:text-teal-400">
                    {generatingType === rType ? 'Membuat...' : 'Buat Sekarang'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Archive Sidebar + Report Document Preview */}
      <div className="grid gap-6 lg:grid-cols-12">
        <aside
          aria-label="Arsip laporan terbit"
          className="no-print rounded-xl border border-slate-200 bg-white p-5 lg:col-span-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
              Arsip Laporan ({reports.length})
            </h2>
            <FileSpreadsheet className="h-4 w-4 text-teal-700 dark:text-teal-400" aria-hidden="true" />
          </div>

          <div className="mt-3 max-h-[520px] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
            {reports.map((rpt) => {
              const isSelected = activeReport?.id === rpt.id;
              return (
                <button
                  key={rpt.id}
                  type="button"
                  onClick={() => setSelectedReportId(rpt.id)}
                  className={`block w-full rounded-lg px-3 py-3 text-left transition-colors ${
                    isSelected
                      ? 'bg-teal-50 dark:bg-teal-950/50'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-teal-800 dark:text-teal-300">
                      {rpt.reportCode}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {rpt.trigger}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                    {rpt.type}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-slate-500 tabular-nums dark:text-slate-400">
                    {formatDateTimeId(rpt.generatedAt)}
                  </p>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Report Viewer Document */}
        <section
          aria-label="Pratinjau isi laporan"
          className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-8 dark:border-slate-800 dark:bg-slate-900"
        >
          {!activeReport ? (
            <p className="py-16 text-center text-sm text-slate-500">
              Pilih atau buat laporan untuk melihat rincian data.
            </p>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
                <div>
                  <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                    {activeReport.reportCode} · {activeReport.trigger} ·{' '}
                    {formatDateTimeId(activeReport.generatedAt)}
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    {activeReport.title}
                  </h2>
                </div>

                <div className="no-print flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadReportCsv(activeReport)}
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    Unduh CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                    Cetak / PDF
                  </button>
                </div>
              </div>

              {/* Snapshot Summary Strip */}
              <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-5 sm:grid-cols-4 dark:border-slate-800">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total Sirkulasi</p>
                  <p className="mt-0.5 font-mono text-lg font-semibold text-slate-900 tabular-nums dark:text-slate-100">
                    {activeReport.summary.totalLoans}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Pinjaman Aktif</p>
                  <p className="mt-0.5 font-mono text-lg font-semibold text-teal-700 tabular-nums dark:text-teal-400">
                    {activeReport.summary.activeLoans}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Utilisasi Koleksi</p>
                  <p className="mt-0.5 font-mono text-lg font-semibold text-slate-900 tabular-nums dark:text-slate-100">
                    {activeReport.summary.utilizationRate}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Akumulasi Denda</p>
                  <p className="mt-0.5 font-mono text-lg font-semibold text-slate-900 tabular-nums dark:text-slate-100">
                    {formatRupiah(activeReport.summary.totalFines)}
                  </p>
                </div>
              </div>

              {/* Report Detail Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:text-slate-400">
                      <th className="py-2.5 pr-4">Item / Judul</th>
                      <th className="py-2.5 pr-4">Kategori / Pihak</th>
                      <th className="py-2.5 pr-4 text-right">Metrik 1</th>
                      <th className="py-2.5 pr-4 text-right">Metrik 2</th>
                      <th className="py-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {activeReport.rows.map((row, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 pr-4 font-medium text-slate-900 dark:text-slate-100">
                          {row.label}
                        </td>
                        <td className="py-2.5 pr-4 text-xs text-slate-600 dark:text-slate-400">
                          {row.category}
                        </td>
                        <td className="py-2.5 pr-4 text-right font-mono text-xs text-slate-700 tabular-nums dark:text-slate-300">
                          {row.metricA}
                        </td>
                        <td className="py-2.5 pr-4 text-right font-mono text-xs text-slate-700 tabular-nums dark:text-slate-300">
                          {row.metricB}
                        </td>
                        <td className="py-2.5 text-right text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {row.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
