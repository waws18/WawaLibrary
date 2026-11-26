import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import type {
  Book,
  LibrarySnapshot,
  ReportScheduleConfig,
  ReportType,
} from './types/library';
import { TopBar, type ActiveTab } from './components/TopBar';
import { WorkspaceBar } from './components/WorkspaceBar';
import { CatalogView } from './components/CatalogView';
import { CirculationView } from './components/CirculationView';
import { MemberDashboardView } from './components/MemberDashboardView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { ReportsView } from './components/ReportsView';
import {
  BookFormModal,
  BookReaderModal,
  BorrowModal,
  MemberCardModal,
} from './components/Modals';

interface ToastMessage {
  id: number;
  kind: 'success' | 'error';
  text: string;
}

export default function App() {
  const [snapshot, setSnapshot] = useState<LibrarySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [streamConnected, setStreamConnected] = useState(false);

  const [activeTab, setActiveTab] = useState<ActiveTab>('catalog');
  const [activeMemberId, setActiveMemberId] = useState<string>('mem-01');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [largeText, setLargeText] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Modal states
  const [previewBook, setPreviewBook] = useState<Book | null>(null);
  const [borrowTargetBook, setBorrowTargetBook] = useState<Book | null | undefined>(undefined);
  const [bookFormTarget, setBookFormTarget] = useState<Book | null | undefined>(undefined);
  const [memberCardOpen, setMemberCardOpen] = useState(false);

  const showToast = useCallback((kind: 'success' | 'error', text: string) => {
    const id = Date.now();
    setToast({ id, kind, text });
    setTimeout(() => {
      setToast((curr) => (curr?.id === id ? null : curr));
    }, 4500);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    document.documentElement.classList.toggle('a11y-large', largeText);
  }, [largeText]);

  const fetchInitialState = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/state');
      if (!res.ok) throw new Error('Gagal memuat data perpustakaan.');
      const data = (await res.json()) as LibrarySnapshot;
      setSnapshot(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchInitialState();

    const evtSource = new EventSource('/api/stream');
    evtSource.onopen = () => setStreamConnected(true);
    evtSource.onerror = () => setStreamConnected(false);
    evtSource.addEventListener('snapshot', (ev) => {
      try {
        const nextData = JSON.parse((ev as MessageEvent).data) as LibrarySnapshot;
        setSnapshot(nextData);
        setStreamConnected(true);
      } catch {
        // Ignore malformed SSE message
      }
    });

    return () => {
      evtSource.close();
    };
  }, [fetchInitialState]);

  const activeMember = useMemo(() => {
    if (!snapshot) return null;
    return (
      snapshot.members.find((m) => m.id === activeMemberId) ||
      snapshot.members[0] ||
      null
    );
  }, [snapshot, activeMemberId]);

  const apiMutate = useCallback(
    async (
      url: string,
      method: 'POST' | 'PATCH' | 'DELETE',
      body?: Record<string, unknown>,
      successMsg?: string
    ) => {
      try {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: body ? JSON.stringify(body) : undefined,
        });
        const data = (await res.json()) as { snapshot?: LibrarySnapshot; error?: string };
        if (!res.ok) {
          throw new Error(data.error || 'Permintaan gagal diproses.');
        }
        if (data.snapshot) {
          setSnapshot(data.snapshot);
        }
        if (successMsg) {
          showToast('success', successMsg);
        }
        return data;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Terjadi kesalahan jaringan.';
        showToast('error', msg);
        throw err;
      }
    },
    [showToast]
  );

  const handleCreateLoan = async (bookId: string, memberId: string, durationDays: number) => {
    await apiMutate(
      '/api/loans',
      'POST',
      { bookId, memberId, durationDays },
      'Peminjaman buku berhasil dicatat.'
    );
  };

  const handleReturnLoan = async (loanId: string) => {
    await apiMutate(
      `/api/loans/${loanId}/return`,
      'POST',
      undefined,
      'Buku telah dikembalikan dan stok diperbarui.'
    );
  };

  const handleRenewLoan = async (loanId: string) => {
    await apiMutate(
      `/api/loans/${loanId}/renew`,
      'POST',
      undefined,
      'Masa pinjam diperpanjang 7 hari.'
    );
  };

  const handleUpdateProgress = async (loanId: string, progress: number) => {
    await apiMutate(`/api/loans/${loanId}/progress`, 'PATCH', {
      readingProgress: progress,
    });
  };

  const handleReserveBook = async (book: Book) => {
    if (!activeMember) return;
    await apiMutate(
      '/api/reservations',
      'POST',
      { bookId: book.id, memberId: activeMember.id },
      `Antrean reservasi untuk "${book.title}" berhasil dibuat.`
    );
  };

  const handleCancelReservation = async (reservationId: string) => {
    await apiMutate(
      `/api/reservations/${reservationId}`,
      'PATCH',
      { status: 'Dibatalkan' },
      'Reservasi dibatalkan.'
    );
  };

  const handleToggleSaveBook = async (bookId: string) => {
    if (!activeMember) return;
    await apiMutate(`/api/members/${activeMember.id}`, 'PATCH', {
      toggleSaveBookId: bookId,
    });
  };

  const handleSaveBook = async (payload: Partial<Book>, existingId?: string) => {
    if (existingId) {
      await apiMutate(
        `/api/books/${existingId}`,
        'PATCH',
        payload as Record<string, unknown>,
        'Data koleksi buku diperbarui.'
      );
    } else {
      await apiMutate(
        '/api/books',
        'POST',
        payload as Record<string, unknown>,
        'Koleksi buku baru berhasil ditambahkan.'
      );
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    await apiMutate(`/api/books/${bookId}`, 'DELETE', undefined, 'Buku dihapus dari katalog.');
  };

  const handleCreateMember = async (payload: {
    name: string;
    email: string;
    tier: 'Reguler' | 'Peneliti';
  }) => {
    const res = (await apiMutate(
      '/api/members',
      'POST',
      payload,
      `Anggota ${payload.name} berhasil didaftarkan.`
    )) as { member?: { id: string } };
    if (res?.member?.id) {
      setActiveMemberId(res.member.id);
    }
  };

  const handleToggleMemberStatus = async (
    memberId: string,
    nextStatus: 'Aktif' | 'Ditangguhkan'
  ) => {
    await apiMutate(
      `/api/members/${memberId}`,
      'PATCH',
      { status: nextStatus },
      `Status anggota diubah menjadi ${nextStatus}.`
    );
  };

  const handleCreateRoomBooking = async (payload: {
    roomName: string;
    memberId: string;
    date: string;
    timeSlot: string;
    purpose: string;
  }) => {
    await apiMutate(
      '/api/rooms',
      'POST',
      payload,
      `Ruang ${payload.roomName} berhasil dipesan.`
    );
  };

  const handleCancelRoomBooking = async (bookingId: string) => {
    await apiMutate(
      `/api/rooms/${bookingId}`,
      'PATCH',
      { status: 'Dibatalkan' },
      'Pemesanan ruang dibatalkan.'
    );
  };

  const handleGenerateReport = async (
    type: ReportType,
    trigger: 'Manual' | 'Otomatis Terjadwal' = 'Manual'
  ) => {
    await apiMutate(
      '/api/reports/generate',
      'POST',
      { type, trigger },
      `Laporan ${type} berhasil diterbitkan.`
    );
  };

  const handleUpdateSchedule = async (patch: Partial<ReportScheduleConfig>) => {
    await apiMutate(
      '/api/reports/schedule',
      'PATCH',
      patch as Record<string, unknown>,
      'Pengaturan jadwal laporan otomatis disimpan.'
    );
  };

  const handleChangeActiveMember = (memberId: string) => {
    setActiveMemberId(memberId);
    const picked = snapshot?.members.find((m) => m.id === memberId);
    if (picked?.role === 'admin' && activeTab === 'member') {
      setActiveTab('admin');
    } else if (picked?.role === 'member' && activeTab === 'admin') {
      setActiveTab('member');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-teal-700 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Lewati ke konten utama
      </a>

      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        role={activeMember?.role || 'member'}
        onPrimaryAction={() => {
          if (activeMember?.role === 'admin') {
            setBookFormTarget(null);
          } else {
            setBorrowTargetBook(null);
          }
        }}
      />

      {snapshot && activeMember && (
        <WorkspaceBar
          members={snapshot.members}
          activeMember={activeMember}
          onChangeActiveMember={handleChangeActiveMember}
          onOpenMemberCard={() => setMemberCardOpen(true)}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode((prev) => !prev)}
          largeText={largeText}
          onToggleLargeText={() => setLargeText((prev) => !prev)}
          streamConnected={streamConnected}
        />
      )}

      {/* Toast Feedback */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="no-print fixed right-4 bottom-4 z-50 flex max-w-md items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          {toast.kind === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
          )}
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{toast.text}</p>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Tutup notifikasi"
            className="ml-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <main
        id="main-content"
        className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-8 sm:px-6 lg:px-8"
      >
        {loading ? (
          <div className="space-y-6" aria-busy="true" aria-label="Memuat data perpustakaan">
            <div className="h-72 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-80 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800"
                />
              ))}
            </div>
          </div>
        ) : loadError || !snapshot || !activeMember ? (
          <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
            <AlertCircle className="mx-auto h-10 w-10 text-red-600" aria-hidden="true" />
            <h1 className="mt-4 font-display text-xl font-semibold text-slate-900 dark:text-slate-100">
              Gagal Terhubung ke Server Perpustakaan
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {loadError || 'Data tidak tersedia saat ini.'}
            </p>
            <button
              type="button"
              onClick={() => void fetchInitialState()}
              className="mt-5 min-h-[40px] rounded-lg bg-teal-700 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-800"
            >
              Muat Ulang Data
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'catalog' && (
              <CatalogView
                books={snapshot.books}
                loans={snapshot.loans}
                members={snapshot.members}
                activeMember={activeMember}
                onBorrowBook={(book) => setBorrowTargetBook(book)}
                onReserveBook={(book) => void handleReserveBook(book)}
                onReadPreview={(book) => setPreviewBook(book)}
                onToggleSaveBook={(bookId) => void handleToggleSaveBook(bookId)}
                onNavigateCirculation={() => setActiveTab('circulation')}
              />
            )}

            {activeTab === 'circulation' && (
              <CirculationView
                books={snapshot.books}
                members={snapshot.members}
                loans={snapshot.loans}
                reservations={snapshot.reservations}
                roomBookings={snapshot.roomBookings}
                activeMember={activeMember}
                onCreateLoan={handleCreateLoan}
                onReturnLoan={handleReturnLoan}
                onRenewLoan={handleRenewLoan}
                onCancelReservation={handleCancelReservation}
                onCreateRoomBooking={handleCreateRoomBooking}
                onCancelRoomBooking={handleCancelRoomBooking}
              />
            )}

            {activeTab === 'member' && (
              <MemberDashboardView
                members={snapshot.members}
                activeMember={activeMember}
                books={snapshot.books}
                loans={snapshot.loans}
                reservations={snapshot.reservations}
                roomBookings={snapshot.roomBookings}
                activities={snapshot.activities}
                onReturnLoan={handleReturnLoan}
                onRenewLoan={handleRenewLoan}
                onUpdateProgress={handleUpdateProgress}
                onReadPreview={(book) => setPreviewBook(book)}
                onBorrowBook={(book) => setBorrowTargetBook(book)}
                onOpenMemberCard={() => setMemberCardOpen(true)}
              />
            )}

            {activeTab === 'admin' && (
              <AdminDashboardView
                books={snapshot.books}
                members={snapshot.members}
                loans={snapshot.loans}
                activities={snapshot.activities}
                onAddBook={() => setBookFormTarget(null)}
                onEditBook={(book) => setBookFormTarget(book)}
                onDeleteBook={handleDeleteBook}
                onToggleMemberStatus={handleToggleMemberStatus}
                onOpenNewMemberModal={() => setMemberCardOpen(true)}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsView
                reports={snapshot.reports}
                schedule={snapshot.reportSchedule}
                onGenerateReport={handleGenerateReport}
                onUpdateSchedule={handleUpdateSchedule}
              />
            )}
          </>
        )}
      </main>

      <footer className="no-print border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 py-6 text-xs text-slate-500 sm:px-6 lg:px-8 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
              Wonu&apos;s Library
            </span>
            <span aria-hidden="true">·</span>
            <span>Perpustakaan Digital &amp; Pusat Sirkulasi Terbuka</span>
            <span aria-hidden="true">·</span>
            <span>Senin–Sabtu 08:00–21:00 WIB</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className="hover:text-slate-900 dark:hover:text-slate-200"
            >
              Katalog
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('circulation')}
              className="hover:text-slate-900 dark:hover:text-slate-200"
            >
              Peminjaman
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className="hover:text-slate-900 dark:hover:text-slate-200"
            >
              Pelaporan Otomatis
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <BookReaderModal
        book={previewBook}
        onClose={() => setPreviewBook(null)}
        onBorrow={(book) => setBorrowTargetBook(book)}
        onReserve={(book) => void handleReserveBook(book)}
      />

      {snapshot && activeMember && borrowTargetBook !== undefined && (
        <BorrowModal
          book={borrowTargetBook}
          books={snapshot.books}
          members={snapshot.members}
          activeMember={activeMember}
          onClose={() => setBorrowTargetBook(undefined)}
          onConfirmBorrow={handleCreateLoan}
        />
      )}

      {bookFormTarget !== undefined && (
        <BookFormModal
          initialBook={bookFormTarget}
          onClose={() => setBookFormTarget(undefined)}
          onSave={handleSaveBook}
        />
      )}

      {memberCardOpen && activeMember && (
        <MemberCardModal
          activeMember={activeMember}
          onClose={() => setMemberCardOpen(false)}
          onCreateMember={handleCreateMember}
        />
      )}
    </div>
  );
}
