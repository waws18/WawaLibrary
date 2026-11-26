import { useState } from 'react';
import { BookOpen, Check, Copy, X } from 'lucide-react';
import type { Book, BookCategory, BookFormat, Member } from '../types/library';
import { BookCoverArt } from './BookCoverArt';
import { formatDateId } from '../utils/formatters';

/* ------------------------------------------------------------------ */
/* 1. Digital Preview & Accessible Reader Modal                        */
/* ------------------------------------------------------------------ */
interface BookReaderModalProps {
  book: Book | null;
  onClose: () => void;
  onBorrow: (book: Book) => void;
  onReserve: (book: Book) => void;
}

export function BookReaderModal({ book, onClose, onBorrow, onReserve }: BookReaderModalProps) {
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');

  if (!book) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reader-modal-title"
    >
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {book.category} · {book.format} · <span className="font-mono">{book.isbn}</span>
            </p>
            <h2
              id="reader-modal-title"
              className="mt-1 font-display text-2xl font-semibold text-slate-900 dark:text-slate-100"
            >
              {book.title}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {book.author} — {book.publisher} ({book.year})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pratinjau buku"
            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid gap-6 sm:grid-cols-12">
          <div className="sm:col-span-4">
            <BookCoverArt
              src={book.coverImage}
              title={book.title}
              author={book.author}
              tone={book.coverTone}
              className="aspect-[3/4] w-full"
            />
            <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <p>
                Kode Rak: <strong className="font-mono text-slate-900 dark:text-slate-100">{book.shelfCode}</strong>
              </p>
              <p>
                Tebal: <strong className="font-mono text-slate-900 dark:text-slate-100">{book.pages}</strong> halaman
              </p>
              <p>
                Ketersediaan:{' '}
                <strong className="font-mono text-teal-700 dark:text-teal-400">
                  {book.availableCopies} / {book.totalCopies} eksemplar
                </strong>
              </p>
            </div>
          </div>

          <div className="space-y-5 sm:col-span-8">
            <div>
              <h3 className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">
                Sinopsis Singkat
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {book.synopsis}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 dark:text-teal-400">
                  <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                  Pratinjau Bacaan Digital
                </span>
                <div className="flex items-center gap-1" role="group" aria-label="Ukuran teks bacaan">
                  {(['sm', 'base', 'lg'] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setFontSize(sz)}
                      className={`min-h-[28px] rounded px-2 py-0.5 text-xs font-medium ${
                        fontSize === sz
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                          : 'text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800'
                      }`}
                    >
                      {sz === 'sm' ? 'A-' : sz === 'base' ? 'A' : 'A+'}
                    </button>
                  ))}
                </div>
              </div>
              <div
                className={`whitespace-pre-line leading-relaxed text-slate-800 dark:text-slate-200 ${
                  fontSize === 'sm' ? 'text-xs' : fontSize === 'lg' ? 'text-base' : 'text-sm'
                }`}
              >
                {book.excerpt}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Tutup
          </button>
          {book.availableCopies > 0 ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onBorrow(book);
              }}
              className="min-h-[40px] rounded-lg bg-teal-700 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
            >
              Pinjam Buku Ini
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                onReserve(book);
              }}
              className="min-h-[40px] rounded-lg border border-amber-300 bg-amber-50 px-5 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
            >
              Masuk Antrean Reservasi
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Quick Borrow Modal                                               */
/* ------------------------------------------------------------------ */
interface BorrowModalProps {
  book: Book | null;
  books: Book[];
  members: Member[];
  activeMember: Member;
  onClose: () => void;
  onConfirmBorrow: (bookId: string, memberId: string, durationDays: number) => Promise<void>;
}

export function BorrowModal({
  book,
  books,
  members,
  activeMember,
  onClose,
  onConfirmBorrow,
}: BorrowModalProps) {
  const availableBooks = books.filter((b) => b.availableCopies > 0);
  const [selectedBookId, setSelectedBookId] = useState(book?.id || availableBooks[0]?.id || '');
  const [memberId, setMemberId] = useState(
    activeMember.role === 'member'
      ? activeMember.id
      : members.find((m) => m.role === 'member')?.id || activeMember.id
  );
  const [durationDays, setDurationDays] = useState(14);
  const [submitting, setSubmitting] = useState(false);

  const chosenBook = books.find((b) => b.id === (book?.id || selectedBookId)) || availableBooks[0];
  const dueDateLabel = new Date(Date.now() + durationDays * 86400000).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chosenBook) return;
    setSubmitting(true);
    try {
      await onConfirmBorrow(chosenBook.id, memberId, durationDays);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="borrow-modal-title"
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
          <h2
            id="borrow-modal-title"
            className="font-display text-xl font-semibold text-slate-900 dark:text-slate-100"
          >
            Konfirmasi Peminjaman Buku
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog peminjaman"
            className="inline-flex min-h-[38px] min-w-[38px] items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="modal-book-select"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Judul Buku
            </label>
            <select
              id="modal-book-select"
              value={chosenBook?.id || ''}
              onChange={(e) => setSelectedBookId(e.target.value)}
              disabled={Boolean(book)}
              className="mt-1.5 min-h-[42px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              {availableBooks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} (Sisa {b.availableCopies})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="modal-member-select"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Akun Peminjam
            </label>
            <select
              id="modal-member-select"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="mt-1.5 min-h-[42px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              {members
                .filter((m) => m.status === 'Aktif')
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.memberCode})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="modal-duration-select"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Lama Peminjaman
            </label>
            <select
              id="modal-duration-select"
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              className="mt-1.5 min-h-[42px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value={7}>7 Hari</option>
              <option value={14}>14 Hari (Disarankan)</option>
              <option value={21}>21 Hari</option>
            </select>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
            <p>
              Tanggal Jatuh Tempo:{' '}
              <strong className="font-mono text-slate-900 dark:text-slate-100">
                {dueDateLabel}
              </strong>
            </p>
            <p className="mt-1">Keterlambatan pengembalian dikenakan tarif Rp 2.000 per hari.</p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || !chosenBook}
              className="min-h-[40px] rounded-lg bg-teal-700 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50 dark:bg-teal-600"
            >
              {submitting ? 'Menyimpan...' : 'Pinjam Sekarang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Add / Edit Book Collection Modal (Admin)                         */
/* ------------------------------------------------------------------ */
interface BookFormModalProps {
  initialBook: Book | null;
  onClose: () => void;
  onSave: (payload: Partial<Book>, existingId?: string) => Promise<void>;
}

const BOOK_CATEGORIES: BookCategory[] = [
  'Fiksi Sastra',
  'Sains & Teknologi',
  'Arsitektur & Desain',
  'Filsafat & Sejarah',
  'Pengembangan Diri',
  'Referensi Akademik',
];

export function BookFormModal({ initialBook, onClose, onSave }: BookFormModalProps) {
  const [title, setTitle] = useState(initialBook?.title || '');
  const [author, setAuthor] = useState(initialBook?.author || '');
  const [publisher, setPublisher] = useState(initialBook?.publisher || 'Wonu Press');
  const [isbn, setIsbn] = useState(initialBook?.isbn || '');
  const [year, setYear] = useState(initialBook?.year || new Date().getFullYear());
  const [category, setCategory] = useState<BookCategory>(initialBook?.category || 'Fiksi Sastra');
  const [shelfCode, setShelfCode] = useState(initialBook?.shelfCode || 'RAK-A12');
  const [totalCopies, setTotalCopies] = useState(initialBook?.totalCopies || 4);
  const [format, setFormat] = useState<BookFormat>(initialBook?.format || 'Cetak & E-Book');
  const [synopsis, setSynopsis] = useState(initialBook?.synopsis || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;
    setSaving(true);
    try {
      await onSave(
        {
          title,
          author,
          publisher,
          isbn,
          year,
          category,
          shelfCode,
          totalCopies,
          format,
          synopsis,
        },
        initialBook?.id
      );
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="book-form-title"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
          <h2
            id="book-form-title"
            className="font-display text-xl font-semibold text-slate-900 dark:text-slate-100"
          >
            {initialBook ? 'Edit Metadata & Stok Koleksi' : 'Tambah Koleksi Buku Baru'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup form koleksi"
            className="inline-flex min-h-[38px] min-w-[38px] items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="bf-title" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Judul Buku *
            </label>
            <input
              id="bf-title"
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Arsip Cahaya dan Arsitektur Tropis"
              className="mt-1.5 min-h-[40px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <div>
            <label htmlFor="bf-author" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Penulis *
            </label>
            <input
              id="bf-author"
              required
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="mt-1.5 min-h-[40px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <div>
            <label htmlFor="bf-publisher" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Penerbit
            </label>
            <input
              id="bf-publisher"
              type="text"
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
              className="mt-1.5 min-h-[40px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <div>
            <label htmlFor="bf-category" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Kategori
            </label>
            <select
              id="bf-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as BookCategory)}
              className="mt-1.5 min-h-[40px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              {BOOK_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="bf-format" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Format Tersedia
            </label>
            <select
              id="bf-format"
              value={format}
              onChange={(e) => setFormat(e.target.value as BookFormat)}
              className="mt-1.5 min-h-[40px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="Cetak & E-Book">Cetak &amp; E-Book</option>
              <option value="Buku Cetak">Buku Cetak</option>
              <option value="E-Book Digital">E-Book Digital</option>
            </select>
          </div>

          <div>
            <label htmlFor="bf-isbn" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              ISBN
            </label>
            <input
              id="bf-isbn"
              type="text"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              placeholder="978-623-..."
              className="mt-1.5 min-h-[40px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label htmlFor="bf-shelf" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Rak
              </label>
              <input
                id="bf-shelf"
                type="text"
                value={shelfCode}
                onChange={(e) => setShelfCode(e.target.value)}
                className="mt-1.5 min-h-[40px] w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="bf-year" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tahun
              </label>
              <input
                id="bf-year"
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="mt-1.5 min-h-[40px] w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="bf-copies" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Stok
              </label>
              <input
                id="bf-copies"
                type="number"
                min={1}
                value={totalCopies}
                onChange={(e) => setTotalCopies(Number(e.target.value))}
                className="mt-1.5 min-h-[40px] w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="bf-synopsis" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Sinopsis Buku
            </label>
            <textarea
              id="bf-synopsis"
              rows={3}
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              placeholder="Ringkasan singkat isi buku..."
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 sm:col-span-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-[40px] rounded-lg bg-teal-700 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50 dark:bg-teal-600"
            >
              {saving ? 'Menyimpan...' : initialBook ? 'Simpan Perubahan' : 'Tambahkan ke Katalog'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Digital Member Card & Registration Modal                         */
/* ------------------------------------------------------------------ */
interface MemberCardModalProps {
  activeMember: Member;
  onClose: () => void;
  onCreateMember: (payload: {
    name: string;
    email: string;
    tier: 'Reguler' | 'Peneliti';
  }) => Promise<void>;
}

export function MemberCardModal({
  activeMember,
  onClose,
  onCreateMember,
}: MemberCardModalProps) {
  const [tab, setTab] = useState<'card' | 'register'>('card');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [tier, setTier] = useState<'Reguler' | 'Peneliti'>('Reguler');
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(activeMember.memberCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSubmitting(true);
    try {
      await onCreateMember({ name, email, tier });
      setName('');
      setEmail('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="member-card-title"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
          <h2
            id="member-card-title"
            className="font-display text-xl font-semibold text-slate-900 dark:text-slate-100"
          >
            Keanggotaan Wonu&apos;s Library
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog keanggotaan"
            className="inline-flex min-h-[38px] min-w-[38px] items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex rounded-lg bg-slate-100 p-1 dark:bg-slate-950">
          <button
            type="button"
            onClick={() => setTab('card')}
            className={`min-h-[34px] flex-1 rounded-md text-xs font-semibold transition-colors ${
              tab === 'card'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Kartu Anggota Digital
          </button>
          <button
            type="button"
            onClick={() => setTab('register')}
            className={`min-h-[34px] flex-1 rounded-md text-xs font-semibold transition-colors ${
              tab === 'register'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Daftar Anggota Baru
          </button>
        </div>

        {tab === 'card' ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-white dark:border-slate-700 dark:bg-slate-950">
              <div className="flex items-center justify-between">
                <span className="font-display text-base font-semibold">Wonu&apos;s Library</span>
                <span className="font-mono text-xs text-teal-400">{activeMember.tier}</span>
              </div>
              <p className="mt-5 font-display text-2xl font-semibold">{activeMember.name}</p>
              <p className="text-xs text-slate-400">{activeMember.email}</p>

              <div className="mt-6 flex items-end justify-between border-t border-slate-800 pt-3">
                <div>
                  <p className="text-[11px] text-slate-400">Nomor Kartu</p>
                  <p className="font-mono text-sm font-semibold tracking-wider text-white">
                    {activeMember.memberCode}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-slate-400">Terdaftar</p>
                  <p className="font-mono text-xs text-slate-200">
                    {formatDateId(activeMember.joinedAt)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kuota aktif: maksimal {activeMember.maxLoans} buku bersamaan.
              </p>
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Tersalin' : 'Salin ID'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="mt-5 space-y-4">
            <div>
              <label htmlFor="reg-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Nama Lengkap *
              </label>
              <input
                id="reg-name"
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama lengkap anggota"
                className="mt-1.5 min-h-[40px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email *
              </label>
              <input
                id="reg-email"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@domain.id"
                className="mt-1.5 min-h-[40px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div>
              <label htmlFor="reg-tier" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Jenis Keanggotaan
              </label>
              <select
                id="reg-tier"
                value={tier}
                onChange={(e) => setTier(e.target.value as 'Reguler' | 'Peneliti')}
                className="mt-1.5 min-h-[40px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="Reguler">Reguler (Maks 3 buku)</option>
                <option value="Peneliti">Peneliti (Maks 5 buku)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="min-h-[42px] w-full rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50 dark:bg-teal-600"
            >
              {submitting ? 'Mendaftarkan...' : 'Buat Kartu Anggota Baru'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
