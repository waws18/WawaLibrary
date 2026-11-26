import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Edit3,
  Plus,
  Search,
  Trash2,
  UserPlus,
} from 'lucide-react';
import type { ActivityEvent, Book, LoanTransaction, Member } from '../types/library';
import { formatDateId, formatRupiah, formatTimeId } from '../utils/formatters';

interface AdminDashboardViewProps {
  books: Book[];
  members: Member[];
  loans: LoanTransaction[];
  activities: ActivityEvent[];
  onAddBook: () => void;
  onEditBook: (book: Book) => void;
  onDeleteBook: (bookId: string) => Promise<void>;
  onToggleMemberStatus: (memberId: string, nextStatus: 'Aktif' | 'Ditangguhkan') => Promise<void>;
  onOpenNewMemberModal: () => void;
}

export function AdminDashboardView({
  books,
  members,
  loans,
  activities,
  onAddBook,
  onEditBook,
  onDeleteBook,
  onToggleMemberStatus,
  onOpenNewMemberModal,
}: AdminDashboardViewProps) {
  const [activityFilter, setActivityFilter] = useState<'semua' | 'sirkulasi' | 'katalog' | 'laporan'>(
    'semua'
  );
  const [collectionSearch, setCollectionSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const totalCopies = books.reduce((s, b) => s + b.totalCopies, 0);
  const availableCopies = books.reduce((s, b) => s + b.availableCopies, 0);
  const activeLoans = loans.filter((l) => !l.returnedAt);
  const overdueLoans = activeLoans.filter((l) => l.status === 'Terlambat');
  const totalFines = loans.reduce((s, l) => s + l.fineAmount, 0);
  const utilizationRate =
    totalCopies > 0 ? Math.round(((totalCopies - availableCopies) / totalCopies) * 100) : 0;

  // Weekly borrowing trend chart data computed from actual loans + recent 7 days
  const weeklyTrend = useMemo(() => {
    const days: Array<{ label: string; isoDate: string; borrows: number; returns: number }> = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(Date.now() - i * 86400000);
      const isoDate = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
      const borrows = loans.filter((l) => l.borrowedAt.slice(0, 10) === isoDate).length;
      const returns = loans.filter((l) => l.returnedAt?.slice(0, 10) === isoDate).length;
      days.push({ label, isoDate, borrows, returns });
    }
    return days;
  }, [loans]);

  const maxTrendVal = Math.max(3, ...weeklyTrend.map((d) => Math.max(d.borrows, d.returns)));

  // Category breakdown by total borrow count
  const categoryStats = useMemo(() => {
    const map = new Map<string, { borrows: number; titles: number }>();
    for (const book of books) {
      const prev = map.get(book.category) || { borrows: 0, titles: 0 };
      map.set(book.category, {
        borrows: prev.borrows + book.borrowCount,
        titles: prev.titles + 1,
      });
    }
    const list = Array.from(map.entries())
      .map(([category, val]) => ({ category, ...val }))
      .sort((a, b) => b.borrows - a.borrows);
    const maxBorrows = Math.max(1, ...list.map((c) => c.borrows));
    return { list, maxBorrows };
  }, [books]);

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      if (activityFilter === 'sirkulasi') {
        return ['BORROW', 'RETURN', 'RENEW', 'RESERVE', 'ROOM_BOOKING'].includes(act.type);
      }
      if (activityFilter === 'katalog') {
        return ['CATALOG_ADD', 'CATALOG_EDIT', 'MEMBER_UPDATE'].includes(act.type);
      }
      if (activityFilter === 'laporan') {
        return act.type === 'REPORT';
      }
      return true;
    });
  }, [activities, activityFilter]);

  const filteredBooks = useMemo(() => {
    const q = collectionSearch.trim().toLowerCase();
    if (!q) return books;
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q) ||
        b.shelfCode.toLowerCase().includes(q)
    );
  }, [books, collectionSearch]);

  const regularMembers = members.filter((m) => m.role === 'member');

  return (
    <div className="space-y-8">
      {/* Admin Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-teal-700 dark:text-teal-400">
            Dasbor Admin Pustakawan · Pemantauan Real-Time &amp; Manajemen Koleksi
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-slate-900 dark:text-slate-100">
            Pusat Kendali Wonu&apos;s Library
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Pantau aliran transaksi masuk secara langsung, statistik peminjaman, stok rak, dan
            keanggotaan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onOpenNewMemberModal}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <UserPlus className="h-4 w-4 text-teal-700 dark:text-teal-400" aria-hidden="true" />
            Daftar Anggota Baru
          </button>
          <button
            type="button"
            onClick={onAddBook}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Tambah Koleksi Buku
          </button>
        </div>
      </div>

      {/* 4-Column Admin KPIs */}
      <div className="grid grid-cols-2 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white sm:grid-cols-4 sm:divide-x sm:divide-y-0 dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Utilisasi Koleksi
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold text-slate-900 tabular-nums dark:text-slate-100">
            {utilizationRate}%
          </p>
          <p className="mt-0.5 text-xs text-slate-500 tabular-nums dark:text-slate-400">
            {totalCopies - availableCopies} dari {totalCopies} eksemplar dipinjam
          </p>
        </div>
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Transaksi Aktif
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold text-teal-700 tabular-nums dark:text-teal-400">
            {activeLoans.length}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 tabular-nums dark:text-slate-400">
            {loans.length} total sirkulasi tercatat
          </p>
        </div>
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Peminjaman Terlambat
          </p>
          <p
            className={`mt-1 font-mono text-2xl font-semibold tabular-nums ${
              overdueLoans.length > 0
                ? 'text-red-700 dark:text-red-400'
                : 'text-emerald-700 dark:text-emerald-400'
            }`}
          >
            {overdueLoans.length}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {overdueLoans.length > 0 ? 'Perlu tindak lanjut pengingat' : 'Semua tepat waktu'}
          </p>
        </div>
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Total Denda Tercatat
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold text-slate-900 tabular-nums dark:text-slate-100">
            {formatRupiah(totalFines)}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Tarif standar Rp 2.000 / hari
          </p>
        </div>
      </div>

      {/* Statistics & Real-Time Activity Stream */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Charts Column */}
        <div className="space-y-6 lg:col-span-7">
          {/* 7-Day Circulation Trend Chart */}
          <section
            aria-labelledby="heading-tren-peminjaman"
            className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2
                  id="heading-tren-peminjaman"
                  className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100"
                >
                  Statistik Sirkulasi 7 Hari Terakhir
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Perbandingan jumlah peminjaman baru dan pengembalian harian.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-xs bg-teal-700 dark:bg-teal-500" />
                  Pinjam
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-xs bg-slate-400 dark:bg-slate-500" />
                  Kembali
                </span>
              </div>
            </div>

            <div className="mt-6">
              <svg
                viewBox="0 0 560 190"
                className="h-48 w-full overflow-visible"
                role="img"
                aria-label="Grafik batang statistik peminjaman dan pengembalian 7 hari terakhir"
              >
                {[0, 0.5, 1].map((ratio, idx) => {
                  const y = 145 - ratio * 120;
                  const val = Math.round(ratio * maxTrendVal);
                  return (
                    <g key={idx}>
                      <line
                        x1="28"
                        x2="548"
                        y1={y}
                        y2={y}
                        stroke="currentColor"
                        className="text-slate-200 dark:text-slate-800"
                        strokeDasharray="3 3"
                      />
                      <text
                        x="20"
                        y={y + 4}
                        textAnchor="end"
                        className="fill-slate-400 font-mono text-[10px]"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}

                {weeklyTrend.map((day, idx) => {
                  const groupX = 48 + idx * 72;
                  const borrowH = (day.borrows / maxTrendVal) * 120;
                  const returnH = (day.returns / maxTrendVal) * 120;
                  return (
                    <g key={day.isoDate}>
                      <rect
                        x={groupX}
                        y={145 - borrowH}
                        width="18"
                        height={Math.max(2, borrowH)}
                        rx="3"
                        className="fill-teal-700 dark:fill-teal-500"
                      />
                      <rect
                        x={groupX + 22}
                        y={145 - returnH}
                        width="18"
                        height={Math.max(2, returnH)}
                        rx="3"
                        className="fill-slate-300 dark:fill-slate-600"
                      />
                      {day.borrows > 0 && (
                        <text
                          x={groupX + 9}
                          y={139 - borrowH}
                          textAnchor="middle"
                          className="fill-slate-700 font-mono text-[10px] font-semibold dark:fill-slate-300"
                        >
                          {day.borrows}
                        </text>
                      )}
                      <text
                        x={groupX + 20}
                        y="168"
                        textAnchor="middle"
                        className="fill-slate-500 text-[10px] dark:fill-slate-400"
                      >
                        {day.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </section>

          {/* Category Popularity Breakdown */}
          <section
            aria-labelledby="heading-distribusi-kategori"
            className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <h2
                id="heading-distribusi-kategori"
                className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100"
              >
                Minat Baca per Kategori Koleksi
              </h2>
              <BarChart3 className="h-4 w-4 text-teal-700 dark:text-teal-400" aria-hidden="true" />
            </div>

            <div className="mt-4 space-y-3">
              {categoryStats.list.map((item) => {
                const widthPct = Math.round((item.borrows / categoryStats.maxBorrows) * 100);
                return (
                  <div key={item.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {item.category}
                      </span>
                      <span className="font-mono text-slate-500 tabular-nums dark:text-slate-400">
                        {item.borrows} pinjam · {item.titles} judul
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-teal-700 dark:bg-teal-500"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Real-Time Transaction Feed */}
        <section
          aria-labelledby="heading-live-feed"
          className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2
                id="heading-live-feed"
                className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100"
              >
                Log Transaksi Real-Time
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pembaruan otomatis setiap ada aktivitas sirkulasi atau katalog.
              </p>
            </div>
          </div>

          <div
            className="mt-4 flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-950"
            role="group"
            aria-label="Filter log aktivitas"
          >
            {(
              [
                { id: 'semua', label: 'Semua' },
                { id: 'sirkulasi', label: 'Sirkulasi' },
                { id: 'katalog', label: 'Katalog' },
                { id: 'laporan', label: 'Laporan' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActivityFilter(f.id)}
                className={`min-h-[32px] flex-1 rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                  activityFilter === f.id
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="mt-4 max-h-[440px] divide-y divide-slate-100 overflow-y-auto pr-1 dark:divide-slate-800">
            {filteredActivities.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                Belum ada aktivitas pada filter ini.
              </p>
            ) : (
              filteredActivities.slice(0, 16).map((act) => (
                <div key={act.id} className="py-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {act.title}
                    </p>
                    <span className="font-mono text-[11px] text-slate-500 whitespace-nowrap tabular-nums dark:text-slate-400">
                      {formatTimeId(act.timestamp)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                    {act.description}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{act.actorName}</span>
                    {act.amountLabel && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono font-medium text-teal-700 dark:text-teal-400">
                          {act.amountLabel}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Collection Management CRUD Table */}
      <section aria-labelledby="heading-manajemen-koleksi" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2
              id="heading-manajemen-koleksi"
              className="font-display text-2xl font-semibold text-slate-900 dark:text-slate-100"
            >
              Manajemen Koleksi Buku
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tambah judul baru, sesuaikan jumlah stok rak, atau perbarui metadata katalog.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <label htmlFor="admin-book-search" className="sr-only">
                Cari koleksi buku
              </label>
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="admin-book-search"
                type="search"
                value={collectionSearch}
                onChange={(e) => setCollectionSearch(e.target.value)}
                placeholder="Filter judul / ISBN / rak..."
                className="min-h-[40px] w-full rounded-lg border border-slate-200 bg-white py-1.5 pr-3 pl-9 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            <button
              type="button"
              onClick={onAddBook}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white whitespace-nowrap hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Buku Baru
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                <th className="px-4 py-3">Judul &amp; Penulis</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Rak</th>
                <th className="px-4 py-3 text-right">Stok Tersedia</th>
                <th className="px-4 py-3 text-right">Total Pinjam</th>
                <th className="px-4 py-3 text-right">Kelola</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredBooks.map((book) => {
                const isConfirming = confirmDeleteId === book.id;
                const activeCount = loans.filter(
                  (l) => l.bookId === book.id && !l.returnedAt
                ).length;

                return (
                  <tr
                    key={book.id}
                    className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{book.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {book.author} · <span className="font-mono">{book.isbn}</span>
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                      {book.category}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                      {book.shelfCode}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">
                      <span
                        className={
                          book.availableCopies === 0
                            ? 'font-semibold text-amber-700 dark:text-amber-400'
                            : 'text-slate-900 dark:text-slate-100'
                        }
                      >
                        {book.availableCopies} / {book.totalCopies}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-slate-600 tabular-nums dark:text-slate-400">
                      {book.borrowCount}x
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isConfirming ? (
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              await onDeleteBook(book.id);
                              setConfirmDeleteId(null);
                            }}
                            className="min-h-[32px] rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700"
                          >
                            Ya, Hapus
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="min-h-[32px] rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onEditBook(book)}
                            aria-label={`Edit ${book.title}`}
                            className="inline-flex min-h-[34px] items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={activeCount > 0}
                            title={
                              activeCount > 0
                                ? 'Masih ada peminjaman aktif'
                                : `Hapus ${book.title}`
                            }
                            onClick={() => setConfirmDeleteId(book.id)}
                            className="inline-flex min-h-[34px] items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-35 dark:border-slate-700 dark:text-red-400 dark:hover:bg-red-950/40"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            Hapus
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Member Directory & Status Control */}
      <section aria-labelledby="heading-direktori-anggota" className="space-y-4">
        <h2
          id="heading-direktori-anggota"
          className="font-display text-2xl font-semibold text-slate-900 dark:text-slate-100"
        >
          Direktori Anggota Perpustakaan
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                <th className="px-4 py-3">ID Anggota</th>
                <th className="px-4 py-3">Nama &amp; Email</th>
                <th className="px-4 py-3">Tingkat</th>
                <th className="px-4 py-3">Terdaftar</th>
                <th className="px-4 py-3 text-right">Pinjaman Aktif</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {regularMembers.map((member) => {
                const mActive = loans.filter(
                  (l) => l.memberId === member.id && !l.returnedAt
                ).length;
                const mOverdue = loans.some(
                  (l) => l.memberId === member.id && l.status === 'Terlambat' && !l.returnedAt
                );

                return (
                  <tr
                    key={member.id}
                    className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                      {member.memberCode}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {member.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{member.email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700 dark:text-slate-300">
                      {member.tier} (Maks {member.maxLoans})
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500 tabular-nums dark:text-slate-400">
                      {formatDateId(member.joinedAt)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">
                      <span className={mOverdue ? 'font-semibold text-red-700 dark:text-red-400' : ''}>
                        {mActive}
                      </span>
                      {mOverdue && (
                        <AlertTriangle
                          className="ml-1 inline h-3.5 w-3.5 text-red-600"
                          aria-label="Memiliki pinjaman terlambat"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium">
                      <span
                        className={
                          member.status === 'Aktif'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-red-700 dark:text-red-400'
                        }
                      >
                        {member.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          onToggleMemberStatus(
                            member.id,
                            member.status === 'Aktif' ? 'Ditangguhkan' : 'Aktif'
                          )
                        }
                        className="min-h-[32px] rounded-md border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        {member.status === 'Aktif' ? 'Tangguhkan' : 'Aktifkan'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
