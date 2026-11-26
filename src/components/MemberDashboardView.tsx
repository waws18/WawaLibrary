import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bookmark,
  BookOpen,
  CheckCircle2,
  Clock,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import type {
  ActivityEvent,
  Book,
  LoanTransaction,
  Member,
  Reservation,
  RoomBooking,
} from '../types/library';
import { formatDateId, formatRupiah, formatTimeId, getDaysDelta } from '../utils/formatters';
import { BookCoverArt } from './BookCoverArt';

interface MemberDashboardViewProps {
  members: Member[];
  activeMember: Member;
  books: Book[];
  loans: LoanTransaction[];
  reservations: Reservation[];
  roomBookings: RoomBooking[];
  activities: ActivityEvent[];
  onReturnLoan: (loanId: string) => Promise<void>;
  onRenewLoan: (loanId: string) => Promise<void>;
  onUpdateProgress: (loanId: string, progress: number) => Promise<void>;
  onReadPreview: (book: Book) => void;
  onBorrowBook: (book: Book) => void;
  onOpenMemberCard: () => void;
}

export function MemberDashboardView({
  members,
  activeMember,
  books,
  loans,
  reservations,
  roomBookings,
  activities,
  onReturnLoan,
  onRenewLoan,
  onUpdateProgress,
  onReadPreview,
  onBorrowBook,
  onOpenMemberCard,
}: MemberDashboardViewProps) {
  const memberCandidates = members.filter((m) => m.role === 'member');
  const [inspectedMemberId, setInspectedMemberId] = useState<string>(
    activeMember.role === 'member' ? activeMember.id : memberCandidates[0]?.id || activeMember.id
  );

  const currentMember = useMemo(() => {
    if (activeMember.role === 'member') return activeMember;
    return members.find((m) => m.id === inspectedMemberId) || memberCandidates[0] || activeMember;
  }, [activeMember, members, inspectedMemberId, memberCandidates]);

  const myLoans = useMemo(
    () => loans.filter((l) => l.memberId === currentMember.id),
    [loans, currentMember.id]
  );
  const myActiveLoans = myLoans.filter((l) => !l.returnedAt);
  const myReturnedLoans = myLoans.filter((l) => Boolean(l.returnedAt));
  const myTotalFine = myActiveLoans.reduce((sum, l) => sum + l.fineAmount, 0);
  const mySavedBooks = books.filter((b) => currentMember.savedBookIds.includes(b.id));
  const myReservations = reservations.filter(
    (r) => r.memberId === currentMember.id && (r.status === 'Menunggu' || r.status === 'Siap Diambil')
  );
  const myRooms = roomBookings.filter(
    (b) => b.memberId === currentMember.id && b.status === 'Terkonfirmasi'
  );

  const myActivities = useMemo(() => {
    return activities.filter(
      (a) =>
        a.actorName === currentMember.name ||
        a.description.toLowerCase().includes(currentMember.name.toLowerCase())
    );
  }, [activities, currentMember.name]);

  // Personalized recommendations from categories not yet finished or popular picks
  const recommendations = useMemo(() => {
    const activeIds = new Set(myActiveLoans.map((l) => l.bookId));
    return books.filter((b) => !activeIds.has(b.id) && b.availableCopies > 0).slice(0, 3);
  }, [books, myActiveLoans]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-teal-700 dark:text-teal-400">
            Dasbor Anggota · {currentMember.memberCode} · Keanggotaan {currentMember.tier}
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-slate-900 dark:text-slate-100">
            Selamat Datang, {currentMember.name}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Pantau status peminjaman aktif, progres bacaan, jadwal ruang studi, dan aktivitas
            transaksi Anda secara real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {activeMember.role === 'admin' && (
            <div className="flex items-center gap-2">
              <label htmlFor="inspect-member" className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Pratinjau Anggota:
              </label>
              <select
                id="inspect-member"
                value={currentMember.id}
                onChange={(e) => setInspectedMemberId(e.target.value)}
                className="min-h-[40px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                {memberCandidates.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.memberCode})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={onOpenMemberCard}
            className="min-h-[40px] rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Lihat Kartu Anggota Digital
          </button>
        </div>
      </div>

      {/* Member KPI Grid */}
      <div className="grid grid-cols-2 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white sm:grid-cols-4 sm:divide-x sm:divide-y-0 dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Pinjaman Aktif</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-slate-900 tabular-nums dark:text-slate-100">
            {myActiveLoans.length} / {currentMember.maxLoans}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Kuota peminjaman</p>
        </div>
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Selesai Dibaca</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-teal-700 tabular-nums dark:text-teal-400">
            {myReturnedLoans.length}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Riwayat pengembalian</p>
        </div>
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Daftar Tersimpan
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold text-slate-900 tabular-nums dark:text-slate-100">
            {mySavedBooks.length}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Bookmark koleksi</p>
        </div>
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Denda Berjalan</p>
          <p
            className={`mt-1 font-mono text-2xl font-semibold tabular-nums ${
              myTotalFine > 0
                ? 'text-red-700 dark:text-red-400'
                : 'text-emerald-700 dark:text-emerald-400'
            }`}
          >
            {formatRupiah(myTotalFine)}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {myTotalFine > 0 ? 'Segera kembalikan buku' : 'Bebas keterlambatan'}
          </p>
        </div>
      </div>

      {/* Main Split: Active Loans + Real-Time Feed */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Active Loans with Interactive Progress Tracker */}
        <section
          aria-labelledby="heading-pinjaman-saya"
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between">
            <h2
              id="heading-pinjaman-saya"
              className="font-display text-xl font-semibold text-slate-900 dark:text-slate-100"
            >
              Buku yang Sedang Dipinjam
            </h2>
            <span className="font-mono text-xs text-slate-500 tabular-nums dark:text-slate-400">
              {myActiveLoans.length} aktif
            </span>
          </div>

          {myActiveLoans.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
              <BookOpen className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
              <p className="mt-3 text-sm font-medium text-slate-800 dark:text-slate-200">
                Belum ada buku yang sedang dipinjam
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Pilih buku dari rekomendasi di bawah atau jelajahi katalog utama.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {myActiveLoans.map((loan) => {
                const book = books.find((b) => b.id === loan.bookId);
                const daysLeft = getDaysDelta(loan.dueAt);
                const isOverdue = loan.status === 'Terlambat';

                return (
                  <div key={loan.id} className="flex flex-col gap-4 py-4 sm:flex-row sm:items-start">
                    {book && (
                      <BookCoverArt
                        src={book.coverImage}
                        title={book.title}
                        author={book.author}
                        tone={book.coverTone}
                        className="aspect-[3/4] w-20 shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                            {loan.loanCode} · Tenggat {formatDateId(loan.dueAt)}
                          </p>
                          <h3 className="mt-0.5 font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
                            {loan.bookTitle}
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {loan.bookAuthor}
                          </p>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold ${
                            isOverdue
                              ? 'text-red-700 dark:text-red-400'
                              : 'text-emerald-700 dark:text-emerald-400'
                          }`}
                        >
                          {isOverdue ? (
                            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                          {isOverdue
                            ? `Terlambat ${Math.abs(daysLeft)} hari (${formatRupiah(loan.fineAmount)})`
                            : `Sisa ${daysLeft} hari`}
                        </span>
                      </div>

                      {/* Reading Progress Slider */}
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-xs">
                          <label
                            htmlFor={`progress-${loan.id}`}
                            className="font-medium text-slate-600 dark:text-slate-400"
                          >
                            Progres Membaca
                          </label>
                          <span className="font-mono font-semibold text-teal-700 tabular-nums dark:text-teal-400">
                            {loan.readingProgress}%
                          </span>
                        </div>
                        <input
                          id={`progress-${loan.id}`}
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          value={loan.readingProgress}
                          onChange={(e) => onUpdateProgress(loan.id, Number(e.target.value))}
                          className="h-2 w-full cursor-pointer accent-teal-700 dark:accent-teal-500"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {book && (
                          <button
                            type="button"
                            onClick={() => onReadPreview(book)}
                            className="min-h-[36px] rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            Baca Pratinjau
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onRenewLoan(loan.id)}
                          disabled={isOverdue || loan.renewals >= 2}
                          className="inline-flex min-h-[36px] items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                          Perpanjang +7 Hari
                        </button>
                        <button
                          type="button"
                          onClick={() => onReturnLoan(loan.id)}
                          className="inline-flex min-h-[36px] items-center gap-1 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                        >
                          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                          Kembalikan Buku
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right Column: Personal Real-Time Activity & Upcoming Bookings */}
        <div className="space-y-6 lg:col-span-5">
          <section
            aria-labelledby="heading-aktivitas-member"
            className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <h2
                id="heading-aktivitas-member"
                className="font-display text-xl font-semibold text-slate-900 dark:text-slate-100"
              >
                Aktivitas Transaksi Real-Time
              </h2>
              <span className="font-mono text-xs text-slate-500 tabular-nums dark:text-slate-400">
                Langsung
              </span>
            </div>

            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {(myActivities.length > 0 ? myActivities : activities).slice(0, 6).map((act) => (
                <div key={act.id} className="py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {act.title}
                    </p>
                    <span className="font-mono text-[11px] text-slate-500 tabular-nums dark:text-slate-400">
                      {formatTimeId(act.timestamp)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                    {act.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section
            aria-labelledby="heading-jadwal-saya"
            className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
          >
            <h2
              id="heading-jadwal-saya"
              className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100"
            >
              Reservasi Buku &amp; Ruang Baca Saya
            </h2>
            <div className="mt-3 space-y-3 text-sm">
              {myReservations.length === 0 && myRooms.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Belum ada reservasi antrean buku maupun pemesanan meja studi aktif.
                </p>
              ) : (
                <>
                  {myReservations.map((res) => (
                    <div
                      key={res.id}
                      className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800"
                    >
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {res.bookTitle}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Antrean Reservasi · {formatDateId(res.createdAt)}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 dark:text-teal-400">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        {res.status}
                      </span>
                    </div>
                  ))}
                  {myRooms.map((rm) => (
                    <div
                      key={rm.id}
                      className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800"
                    >
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {rm.roomName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {rm.date} · {rm.timeSlot}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        {rm.status}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Saved Books & Recommendations */}
      <section aria-labelledby="heading-simpan-rekomendasi" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2
            id="heading-simpan-rekomendasi"
            className="font-display text-2xl font-semibold text-slate-900 dark:text-slate-100"
          >
            {mySavedBooks.length > 0 ? 'Daftar Bacaan Tersimpan' : 'Rekomendasi Tersedia untuk Anda'}
          </h2>
          <Bookmark className="h-5 w-5 text-teal-700 dark:text-teal-400" aria-hidden="true" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(mySavedBooks.length > 0 ? mySavedBooks : recommendations).map((book) => (
            <div
              key={book.id}
              className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <BookCoverArt
                src={book.coverImage}
                title={book.title}
                author={book.author}
                tone={book.coverTone}
                className="aspect-[3/4] w-20 shrink-0"
              />
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {book.category} · {book.shelfCode}
                  </p>
                  <h3 className="mt-1 font-display text-base font-semibold text-slate-900 line-clamp-2 dark:text-slate-100">
                    {book.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{book.author}</p>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={book.availableCopies <= 0}
                    onClick={() => onBorrowBook(book)}
                    className="min-h-[34px] rounded-md bg-teal-700 px-3 py-1 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-40 dark:bg-teal-600"
                  >
                    {book.availableCopies > 0 ? 'Pinjam' : 'Habis'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onReadPreview(book)}
                    className="min-h-[34px] rounded-md border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Pratinjau
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
