import { useMemo, useState } from 'react';
import {
  Bookmark,
  BookOpen,
  CheckCircle2,
  Clock,
  LayoutGrid,
  List,
  Search,
  Sparkles,
} from 'lucide-react';
import type { Book, BookCategory, LoanTransaction, Member } from '../types/library';
import { BookCoverArt } from './BookCoverArt';

interface CatalogViewProps {
  books: Book[];
  loans: LoanTransaction[];
  members: Member[];
  activeMember: Member;
  onBorrowBook: (book: Book) => void;
  onReserveBook: (book: Book) => void;
  onReadPreview: (book: Book) => void;
  onToggleSaveBook: (bookId: string) => void;
  onNavigateCirculation: () => void;
}

const CATEGORIES: Array<'Semua' | BookCategory> = [
  'Semua',
  'Fiksi Sastra',
  'Sains & Teknologi',
  'Arsitektur & Desain',
  'Filsafat & Sejarah',
  'Pengembangan Diri',
  'Referensi Akademik',
];

export function CatalogView({
  books,
  loans,
  members,
  activeMember,
  onBorrowBook,
  onReserveBook,
  onReadPreview,
  onToggleSaveBook,
  onNavigateCirculation,
}: CatalogViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'Semua' | BookCategory>('Semua');
  const [availabilityFilter, setAvailabilityFilter] = useState<
    'semua' | 'tersedia' | 'tersimpan' | 'ebook'
  >('semua');
  const [sortBy, setSortBy] = useState<'populer' | 'terbaru' | 'judul'>('populer');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const totalCopies = books.reduce((sum, b) => sum + b.totalCopies, 0);
  const availableCopies = books.reduce((sum, b) => sum + b.availableCopies, 0);
  const activeLoansCount = loans.filter((l) => !l.returnedAt).length;
  const activeMembersCount = members.filter((m) => m.role === 'member' && m.status === 'Aktif').length;

  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return books
      .filter((book) => {
        if (selectedCategory !== 'Semua' && book.category !== selectedCategory) return false;
        if (availabilityFilter === 'tersedia' && book.availableCopies <= 0) return false;
        if (
          availabilityFilter === 'tersimpan' &&
          !activeMember.savedBookIds.includes(book.id)
        ) {
          return false;
        }
        if (availabilityFilter === 'ebook' && book.format === 'Buku Cetak') return false;
        if (!q) return true;
        return (
          book.title.toLowerCase().includes(q) ||
          book.author.toLowerCase().includes(q) ||
          book.isbn.toLowerCase().includes(q) ||
          book.shelfCode.toLowerCase().includes(q) ||
          book.category.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'populer') return b.borrowCount - a.borrowCount;
        if (sortBy === 'terbaru') return b.year - a.year;
        return a.title.localeCompare(b.title, 'id');
      });
  }, [books, searchQuery, selectedCategory, availabilityFilter, sortBy, activeMember.savedBookIds]);

  const scrollToCatalog = () => {
    document.getElementById('katalog-koleksi')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-10">
      {/* Editorial Hero Section */}
      <section
        aria-label="Pengantar Wonu's Library"
        className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="grid items-stretch lg:grid-cols-12">
          <div className="flex flex-col justify-between p-6 sm:p-8 lg:col-span-6 lg:p-10">
            <div className="space-y-4">
              <p className="text-xs font-semibold tracking-wide text-teal-700 dark:text-teal-400">
                Perpustakaan Digital Terpadu · Akses Terbuka &amp; Sirkulasi Real-Time
              </p>
              <h1 className="font-display text-balance text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl dark:text-slate-100">
                Ruang Baca Modern &amp; Manajemen Koleksi Terhubung
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
                Temukan ribuan halaman referensi pilihan, pinjam koleksi cetak maupun pratinjau
                digital, pesan meja baca sunyi, dan pantau transaksi sirkulasi secara langsung di
                Wonu&apos;s Library.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={scrollToCatalog}
                className="min-h-[44px] rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white whitespace-nowrap transition-colors hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
              >
                Jelajahi Katalog Buku
              </button>
              <button
                type="button"
                onClick={onNavigateCirculation}
                className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 whitespace-nowrap transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Layanan Peminjaman &amp; Ruang Baca
              </button>
            </div>
          </div>

          <div className="relative min-h-[260px] lg:col-span-6 lg:min-h-[380px]">
            <img
              src="/src/assets/images/wonu_library_interior_1795659629617.jpg"
              alt="Interior ruang baca utama Wonu's Library dengan rak kayu oak dan meja studi"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/25 to-transparent"
            />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white">
              <p className="text-xs font-medium text-slate-200">
                Layanan Aktif Hari Ini · 08:00 – 21:00 WIB
              </p>
              <p className="mt-1 font-display text-lg font-medium text-white">
                Sirkulasi Mandiri, Pratinjau Naskah Digital &amp; Reservasi Ruang Studi
              </p>
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column KPI Strip Below Hero */}
        <div className="grid grid-cols-2 divide-y divide-slate-200 border-t border-slate-200 sm:grid-cols-4 sm:divide-x sm:divide-y-0 dark:divide-slate-800 dark:border-slate-800">
          <div className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Judul Koleksi</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-slate-900 tabular-nums dark:text-slate-100">
              {books.length}
            </p>
            <p className="mt-0.5 text-xs text-slate-500 tabular-nums dark:text-slate-400">
              {totalCopies} total eksemplar
            </p>
          </div>
          <div className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Siap Dipinjam
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold text-teal-700 tabular-nums dark:text-teal-400">
              {availableCopies}
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Eksemplar tersedia di rak
            </p>
          </div>
          <div className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Sirkulasi Berjalan
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold text-slate-900 tabular-nums dark:text-slate-100">
              {activeLoansCount}
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Transaksi peminjaman aktif
            </p>
          </div>
          <div className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Anggota Aktif</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-slate-900 tabular-nums dark:text-slate-100">
              {activeMembersCount}
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Pembaca &amp; peneliti terdaftar
            </p>
          </div>
        </div>
      </section>

      {/* Catalog Filter & Search Controls */}
      <section id="katalog-koleksi" aria-labelledby="heading-katalog" className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2
              id="heading-katalog"
              className="font-display text-2xl font-semibold text-slate-900 dark:text-slate-100"
            >
              Katalog Koleksi Buku
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Menampilkan {filteredBooks.length} dari {books.length} judul terkurasi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:w-72 sm:flex-none">
              <label htmlFor="catalog-search" className="sr-only">
                Cari judul, penulis, ISBN, atau kode rak
              </label>
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="catalog-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari judul, penulis, ISBN, rak..."
                className="min-h-[42px] w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <label htmlFor="catalog-sort" className="sr-only">
              Urutkan katalog
            </label>
            <select
              id="catalog-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'populer' | 'terbaru' | 'judul')}
              className="min-h-[42px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="populer">Paling Sering Dipinjam</option>
              <option value="terbaru">Terbitan Terbaru</option>
              <option value="judul">Judul A–Z</option>
            </select>

            <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label="Tampilan kisi"
                aria-pressed={viewMode === 'grid'}
                className={`inline-flex min-h-[34px] min-w-[34px] items-center justify-center rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                aria-label="Tampilan tabel"
                aria-pressed={viewMode === 'table'}
                className={`inline-flex min-h-[34px] min-w-[34px] items-center justify-center rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category & Status Filter Buttons */}
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 lg:flex-row lg:items-center lg:justify-between dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter kategori">
            {CATEGORIES.map((category) => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`min-h-[38px] rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-teal-700 text-white dark:bg-teal-600'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>

          <div
            className="flex items-center gap-1 self-start rounded-lg bg-slate-100 p-1 dark:bg-slate-900"
            role="group"
            aria-label="Filter ketersediaan"
          >
            {(
              [
                { id: 'semua', label: 'Semua' },
                { id: 'tersedia', label: 'Tersedia' },
                { id: 'ebook', label: 'E-Book' },
                { id: 'tersimpan', label: `Tersimpan (${activeMember.savedBookIds.length})` },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setAvailabilityFilter(opt.id)}
                className={`min-h-[34px] rounded-md px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                  availabilityFilter === opt.id
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {filteredBooks.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <BookOpen className="mx-auto h-10 w-10 text-slate-400" aria-hidden="true" />
            <h3 className="mt-4 font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
              Tidak ada koleksi yang cocok
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Coba ubah kata kunci pencarian atau setel ulang filter kategori buku.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Semua');
                setAvailabilityFilter('semua');
              }}
              className="mt-5 min-h-[40px] rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Reset Filter Katalog
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Editorial Book Grid */
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filteredBooks.map((book) => {
              const isSaved = activeMember.savedBookIds.includes(book.id);
              const isAvailable = book.availableCopies > 0;
              const alreadyBorrowed = loans.some(
                (l) => l.bookId === book.id && l.memberId === activeMember.id && !l.returnedAt
              );

              return (
                <article
                  key={book.id}
                  className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                >
                  <div>
                    <div className="relative">
                      <BookCoverArt
                        src={book.coverImage}
                        title={book.title}
                        author={book.author}
                        tone={book.coverTone}
                        className="aspect-[3/4] w-full"
                      />
                      <button
                        type="button"
                        onClick={() => onToggleSaveBook(book.id)}
                        aria-label={
                          isSaved
                            ? `Hapus ${book.title} dari daftar bacaan tersimpan`
                            : `Simpan ${book.title} ke daftar bacaan`
                        }
                        aria-pressed={isSaved}
                        className="absolute top-2.5 right-2.5 inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-slate-200/80 bg-white/95 text-slate-700 transition-colors hover:text-teal-700 dark:border-slate-700 dark:bg-slate-950/90 dark:text-slate-200 dark:hover:text-teal-400"
                      >
                        <Bookmark
                          className={`h-4 w-4 ${isSaved ? 'fill-teal-700 text-teal-700 dark:fill-teal-400 dark:text-teal-400' : ''}`}
                        />
                      </button>
                    </div>

                    {/* Clean unboxed metadata with dot separators (Zero-pill discipline) */}
                    <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <span>{book.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{book.year}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{book.shelfCode}</span>
                    </div>

                    <h3 className="mt-1.5 font-display text-lg font-semibold leading-snug text-slate-900 line-clamp-2 dark:text-slate-100">
                      {book.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600 line-clamp-1 dark:text-slate-400">
                      {book.author}
                    </p>
                  </div>

                  <div className="mt-4 space-y-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={`inline-flex items-center gap-1.5 font-medium ${
                          isAvailable
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {isAvailable ? (
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        <span className="tabular-nums">
                          {isAvailable
                            ? `${book.availableCopies} dari ${book.totalCopies} tersedia`
                            : 'Stok habis · Antrean'}
                        </span>
                      </span>
                      <span className="font-mono text-slate-500 tabular-nums dark:text-slate-400">
                        {book.borrowCount}x
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {alreadyBorrowed ? (
                        <button
                          type="button"
                          disabled
                          className="min-h-[40px] rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500 whitespace-nowrap dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400"
                        >
                          Sedang Dipinjam
                        </button>
                      ) : isAvailable ? (
                        <button
                          type="button"
                          onClick={() => onBorrowBook(book)}
                          className="min-h-[40px] rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white whitespace-nowrap transition-colors hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
                        >
                          Pinjam Buku
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onReserveBook(book)}
                          className="min-h-[40px] rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 whitespace-nowrap transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300 dark:hover:bg-amber-950"
                        >
                          Reservasi
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onReadPreview(book)}
                        className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 whitespace-nowrap transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400" aria-hidden="true" />
                        Pratinjau
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* High-Density Catalog Table View */
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                  <th className="px-4 py-3">Judul &amp; Penulis</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Kode Rak</th>
                  <th className="px-4 py-3">Format</th>
                  <th className="px-4 py-3 text-right">Stok</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredBooks.map((book) => {
                  const isAvailable = book.availableCopies > 0;
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
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                        {book.format}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">
                        <span
                          className={
                            isAvailable
                              ? 'font-semibold text-emerald-700 dark:text-emerald-400'
                              : 'font-semibold text-amber-700 dark:text-amber-400'
                          }
                        >
                          {book.availableCopies}/{book.totalCopies}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onReadPreview(book)}
                            className="min-h-[34px] rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            Pratinjau
                          </button>
                          {isAvailable ? (
                            <button
                              type="button"
                              onClick={() => onBorrowBook(book)}
                              className="min-h-[34px] rounded-md bg-teal-700 px-3 py-1 text-xs font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
                            >
                              Pinjam
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onReserveBook(book)}
                              className="min-h-[34px] rounded-md border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                            >
                              Reservasi
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
