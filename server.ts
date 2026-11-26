import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import type { Request, Response } from 'express';
import type {
  ActivityEvent,
  AutomatedReport,
  AutomatedReportRow,
  Book,
  BookCategory,
  BookFormat,
  LibrarySnapshot,
  LoanTransaction,
  Member,
  ReportScheduleConfig,
  ReportType,
  Reservation,
  RoomBooking,
} from './src/types/library.ts';

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'library-db.json');
const FINE_PER_DAY = 2000; // Rp 2.000 per hari keterlambatan

interface DatabaseState {
  books: Book[];
  members: Member[];
  loans: LoanTransaction[];
  reservations: Reservation[];
  roomBookings: RoomBooking[];
  activities: ActivityEvent[];
  reports: AutomatedReport[];
  reportSchedule: ReportScheduleConfig;
}

function isoDaysAgo(days: number, hoursOffset = 0): string {
  const d = new Date(Date.now() - days * 86400000 + hoursOffset * 3600000);
  return d.toISOString();
}

function isoDaysAhead(days: number): string {
  const d = new Date(Date.now() + days * 86400000);
  return d.toISOString();
}

function createInitialSeed(): DatabaseState {
  const books: Book[] = [
    {
      id: 'bk-01',
      isbn: '978-602-424-812-1',
      title: 'Herbarium Senja di Selatan Kota',
      author: 'Ayu Utami & Larasati Noor',
      publisher: 'Pustaka Cendekia Press',
      year: 2025,
      category: 'Fiksi Sastra',
      shelfCode: 'RAK-A01',
      totalCopies: 5,
      availableCopies: 3,
      pages: 312,
      language: 'Indonesia',
      format: 'Cetak & E-Book',
      coverImage: '/src/assets/images/book_cover_botanical_1795659629239.jpg',
      coverTone: '#6b8373',
      synopsis:
        'Novel kontemplatif tentang seorang kurator arsip botani yang menelusuri catatan harian tua di rumah kaca kolonial, mengungkap kisah persahabatan lintas generasi dan ekologi kota.',
      excerpt:
        'Bab 1 — Lembar Kertas yang Mengingat Hujan.\n\nDi balik lemari kayu jati ruang koleksi selatan, map linen berwarna lumut itu terselip di antara katalog paku-pakuan tahun 1968. Setiap spesimen yang ditekan di dalamnya masih menyimpan aroma tanah basah setelah gerimis sore. Rania membuka tali raminya dengan kehati-hatian seorang arkeolog, menyadari bahwa di setiap sudut halaman tertera catatan kecil dengan tinta biru pudar mengenai kapan tunas pertama kali muncul di halaman belakang rumah kaca.',
      borrowCount: 48,
      rating: 4.9,
      createdAt: isoDaysAgo(90),
    },
    {
      id: 'bk-02',
      isbn: '978-623-109-441-8',
      title: 'Kartografi Orbit & Dinamika Kosmos',
      author: 'Dr. Hendra Wijaya',
      publisher: 'Akademika Sains Nusantara',
      year: 2024,
      category: 'Sains & Teknologi',
      shelfCode: 'RAK-S04',
      totalCopies: 4,
      availableCopies: 2,
      pages: 428,
      language: 'Indonesia',
      format: 'Cetak & E-Book',
      coverImage: '/src/assets/images/book_cover_cosmos_1795659629522.jpg',
      coverTone: '#2c3d55',
      synopsis:
        'Panduan komprehensif mengenai mekanika benda langit, penentuan lintasan satelit modern, serta bagaimana pengamatan teleskopik membentuk pemahaman manusia atas ruang waktu.',
      excerpt:
        'Bab 2 — Menakar Jarak di Ruang Hampa.\n\nSebelum teleskop radio memetakan sinyal latar belakang kosmik, para astronom mengandalkan paralaks bintang—pergeseran sudut kecil ketika Bumi bergerak dari satu sisi orbitnya ke sisi lain enam bulan kemudian. Dari geometri segitiga sederhana itulah tangga jarak alam semesta mulai disusun dengan presisi yang kian tajam hingga era observatorium luar angkasa.',
      borrowCount: 62,
      rating: 4.8,
      createdAt: isoDaysAgo(75),
    },
    {
      id: 'bk-03',
      isbn: '978-602-789-330-4',
      title: 'Geometri Ruang Publik & Tektonika Modern',
      author: 'Ar. Dimas Pranoto, IAI',
      publisher: 'Balai Tata Ruang',
      year: 2025,
      category: 'Arsitektur & Desain',
      shelfCode: 'RAK-D02',
      totalCopies: 3,
      availableCopies: 0,
      pages: 264,
      language: 'Indonesia',
      format: 'Buku Cetak',
      coverImage: '/src/assets/images/book_cover_architecture_1795659629942.jpg',
      coverTone: '#1e40af',
      synopsis:
        'Kajian arsitektur tropis modern, proporsi grid Swiss, pencahayaan alami pada gedung perpustakaan publik, dan peran material jujur dalam membangun ruang komunal yang inklusif.',
      excerpt:
        'Bab 1 — Cahaya sebagai Material Bangunan.\n\nSebuah ruang baca tidak pernah benar-benar selesai sebelum cahaya pagi menyentuh permukaan mejanya. Kisi-kisi vertikal dari kayu keras bukan sekadar elemen estetika fasad, melainkan instrumen pengendali silau yang menjaga kenyamanan mata pembaca selama berjam-jam tanpa bergantung penuh pada pencahayaan buatan.',
      borrowCount: 54,
      rating: 4.9,
      createdAt: isoDaysAgo(60),
    },
    {
      id: 'bk-04',
      isbn: '978-602-512-190-6',
      title: 'Garis Cakrawala: Esai Fenomenologi Sunyi',
      author: 'Prof. Ratna Kusuma',
      publisher: 'Lentera Filsafat',
      year: 2023,
      category: 'Filsafat & Sejarah',
      shelfCode: 'RAK-F07',
      totalCopies: 4,
      availableCopies: 3,
      pages: 296,
      language: 'Indonesia',
      format: 'Cetak & E-Book',
      coverImage: '/src/assets/images/book_cover_philosophy_1795659630183.jpg',
      coverTone: '#3f3f46',
      synopsis:
        'Kumpulan esai tentang keheningan, etika perhatian di era informasi cepat, dan bagaimana tradisi membaca mendalam memulihkan kapasitas refleksi manusia.',
      excerpt:
        'Pengantar — Mengembalikan Kecepatan Membaca.\n\nMembaca secara mendalam bukanlah perlombaan menghabiskan halaman, melainkan latihan menyimak pikiran orang lain tanpa tergesa-gesa menyela. Ketika kita memberi waktu pada satu paragraf untuk mengendap, cakrawala penafsiran ikut meluas melampaui kesimpulan instan.',
      borrowCount: 39,
      rating: 4.7,
      createdAt: isoDaysAgo(120),
    },
    {
      id: 'bk-05',
      isbn: '978-623-450-112-9',
      title: 'Arsitektur Sistem Informasi Perpustakaan',
      author: 'Fajar Santoso, M.Kom.',
      publisher: 'Informatika Terapan',
      year: 2026,
      category: 'Sains & Teknologi',
      shelfCode: 'RAK-S09',
      totalCopies: 6,
      availableCopies: 5,
      pages: 380,
      language: 'Indonesia',
      format: 'Cetak & E-Book',
      coverImage: '/src/assets/images/book_cover_cosmos_1795659629522.jpg',
      coverTone: '#1e293b',
      synopsis:
        'Buku teks praktis mengenai klasifikasi DDC, standar metadata MARC21, pengindeksan katalog real-time, serta automasi pelaporan sirkulasi perpustakaan digital.',
      excerpt:
        'Bab 3 — Integritas Transaksi Sirkulasi.\n\nSetiap peminjaman dan pengembalian buku merupakan peristiwa atomik yang mengubah status inventaris sekaligus riwayat keanggotaan. Perancangan sistem sirkulasi modern menuntut pencatatan waktu presisi dan audit otomatis agar tidak terjadi selisih stok fisik dengan catatan digital.',
      borrowCount: 41,
      rating: 4.8,
      createdAt: isoDaysAgo(45),
    },
    {
      id: 'bk-06',
      isbn: '978-602-901-774-2',
      title: 'Taman Hutan Kota & Ekologi Nusantara',
      author: 'Dr. Sekar Melati',
      publisher: 'Pustaka Alam',
      year: 2024,
      category: 'Referensi Akademik',
      shelfCode: 'RAK-R03',
      totalCopies: 3,
      availableCopies: 2,
      pages: 348,
      language: 'Indonesia',
      format: 'Cetak & E-Book',
      coverImage: '/src/assets/images/book_cover_botanical_1795659629239.jpg',
      coverTone: '#577060',
      synopsis:
        'Referensi botani urban yang mendokumentasikan 140 spesies flora endemik pengikat karbon serta panduan perancangan koridor hijau di kota-kota kepulauan.',
      excerpt:
        'Bagian I — Tajuk Pohon sebagai Penyejuk Mikro.\n\nKeberadaan koridor hijau di sepanjang jalur pejalan kaki terbukti menurunkan suhu permukaan aspal hingga empat derajat Celsius pada puncak siang hari sekaligus menjadi jalur migrasi burung pemakan serangga.',
      borrowCount: 29,
      rating: 4.6,
      createdAt: isoDaysAgo(88),
    },
    {
      id: 'bk-07',
      isbn: '978-623-220-509-0',
      title: 'Tipografi Editorial & Keterbacaan Aksesibel',
      author: 'Nadia Kartika',
      publisher: 'Studio Huruf Jakarta',
      year: 2025,
      category: 'Arsitektur & Desain',
      shelfCode: 'RAK-D05',
      totalCopies: 4,
      availableCopies: 3,
      pages: 224,
      language: 'Indonesia',
      format: 'E-Book Digital',
      coverImage: '/src/assets/images/book_cover_architecture_1795659629942.jpg',
      coverTone: '#1d4ed8',
      synopsis:
        'Panduan merancang sistem hierarki huruf, rasio kontras WCAG AA, dan tata letak bacaan digital yang ramah bagi pembaca dengan beragam kebutuhan visual.',
      excerpt:
        'Bab 4 — Ritme Baris dan Ruang Napas Mata.\n\nPanjang baris ideal antara 60 hingga 75 karakter per baris membantu mata berpindah dari akhir satu baris ke awal baris berikutnya tanpa tersesat. Keterbacaan yang baik bukan kebetulan estetika, melainkan empati yang terukur.',
      borrowCount: 36,
      rating: 4.9,
      createdAt: isoDaysAgo(30),
    },
    {
      id: 'bk-08',
      isbn: '978-602-331-988-5',
      title: 'Kebiasaan Membaca & Fokus Mendalam',
      author: 'Bagus Setiawan',
      publisher: 'Bina Literasi',
      year: 2024,
      category: 'Pengembangan Diri',
      shelfCode: 'RAK-P02',
      totalCopies: 5,
      availableCopies: 4,
      pages: 210,
      language: 'Indonesia',
      format: 'Cetak & E-Book',
      coverImage: '/src/assets/images/book_cover_philosophy_1795659630183.jpg',
      coverTone: '#475569',
      synopsis:
        'Metode praktis membangun rutinitas membaca 30 menit setiap hari, teknik mencatat margin (marginalia), serta merangkum ide lintas disiplin ilmu.',
      excerpt:
        'Bab 1 — Mengapa Catatan Tangan Memperkuat Ingatan.\n\nKetika pembaca berhenti sejenak untuk menuliskan satu kalimat tanggapan di buku catatan, otak beralih dari mode konsumsi pasif menjadi dialog aktif dengan gagasan penulis.',
      borrowCount: 51,
      rating: 4.7,
      createdAt: isoDaysAgo(50),
    },
  ];

  const members: Member[] = [
    {
      id: 'mem-admin',
      memberCode: 'WNL-ADM-001',
      name: 'Wonu Prakoso',
      email: 'admin@wonulibrary.id',
      role: 'admin',
      tier: 'Pustakawan',
      status: 'Aktif',
      joinedAt: isoDaysAgo(365),
      maxLoans: 10,
      savedBookIds: ['bk-02', 'bk-03'],
    },
    {
      id: 'mem-01',
      memberCode: 'WNL-2026-014',
      name: 'Nadya Larasati',
      email: 'nadya.larasati@mail.id',
      role: 'member',
      tier: 'Peneliti',
      status: 'Aktif',
      joinedAt: isoDaysAgo(180),
      maxLoans: 5,
      savedBookIds: ['bk-01', 'bk-07'],
    },
    {
      id: 'mem-02',
      memberCode: 'WNL-2026-027',
      name: 'Bima Pratama',
      email: 'bima.pratama@mail.id',
      role: 'member',
      tier: 'Reguler',
      status: 'Aktif',
      joinedAt: isoDaysAgo(110),
      maxLoans: 3,
      savedBookIds: ['bk-02', 'bk-05'],
    },
    {
      id: 'mem-03',
      memberCode: 'WNL-2026-039',
      name: 'Siti Aisyah',
      email: 'siti.aisyah@mail.id',
      role: 'member',
      tier: 'Peneliti',
      status: 'Aktif',
      joinedAt: isoDaysAgo(95),
      maxLoans: 5,
      savedBookIds: ['bk-04'],
    },
    {
      id: 'mem-04',
      memberCode: 'WNL-2026-042',
      name: 'Raka Mahendra',
      email: 'raka.mahendra@mail.id',
      role: 'member',
      tier: 'Reguler',
      status: 'Aktif',
      joinedAt: isoDaysAgo(40),
      maxLoans: 3,
      savedBookIds: [],
    },
  ];

  const loans: LoanTransaction[] = [
    {
      id: 'ln-01',
      loanCode: 'TRX-2611-01',
      bookId: 'bk-01',
      bookTitle: 'Herbarium Senja di Selatan Kota',
      bookAuthor: 'Ayu Utami & Larasati Noor',
      memberId: 'mem-01',
      memberName: 'Nadya Larasati',
      memberCode: 'WNL-2026-014',
      borrowedAt: isoDaysAgo(4),
      dueAt: isoDaysAhead(10),
      returnedAt: null,
      status: 'Dipinjam',
      renewals: 0,
      readingProgress: 42,
      fineAmount: 0,
    },
    {
      id: 'ln-02',
      loanCode: 'TRX-2611-02',
      bookId: 'bk-03',
      bookTitle: 'Geometri Ruang Publik & Tektonika Modern',
      bookAuthor: 'Ar. Dimas Pranoto, IAI',
      memberId: 'mem-01',
      memberName: 'Nadya Larasati',
      memberCode: 'WNL-2026-014',
      borrowedAt: isoDaysAgo(9),
      dueAt: isoDaysAhead(5),
      returnedAt: null,
      status: 'Diperpanjang',
      renewals: 1,
      readingProgress: 76,
      fineAmount: 0,
    },
    {
      id: 'ln-03',
      loanCode: 'TRX-2611-03',
      bookId: 'bk-02',
      bookTitle: 'Kartografi Orbit & Dinamika Kosmos',
      bookAuthor: 'Dr. Hendra Wijaya',
      memberId: 'mem-02',
      memberName: 'Bima Pratama',
      memberCode: 'WNL-2026-027',
      borrowedAt: isoDaysAgo(17),
      dueAt: isoDaysAgo(3),
      returnedAt: null,
      status: 'Terlambat',
      renewals: 0,
      readingProgress: 60,
      fineAmount: 3 * FINE_PER_DAY,
    },
    {
      id: 'ln-04',
      loanCode: 'TRX-2611-04',
      bookId: 'bk-03',
      bookTitle: 'Geometri Ruang Publik & Tektonika Modern',
      bookAuthor: 'Ar. Dimas Pranoto, IAI',
      memberId: 'mem-03',
      memberName: 'Siti Aisyah',
      memberCode: 'WNL-2026-039',
      borrowedAt: isoDaysAgo(6),
      dueAt: isoDaysAhead(8),
      returnedAt: null,
      status: 'Dipinjam',
      renewals: 0,
      readingProgress: 28,
      fineAmount: 0,
    },
    {
      id: 'ln-05',
      loanCode: 'TRX-2611-05',
      bookId: 'bk-03',
      bookTitle: 'Geometri Ruang Publik & Tektonika Modern',
      bookAuthor: 'Ar. Dimas Pranoto, IAI',
      memberId: 'mem-04',
      memberName: 'Raka Mahendra',
      memberCode: 'WNL-2026-042',
      borrowedAt: isoDaysAgo(5),
      dueAt: isoDaysAhead(9),
      returnedAt: null,
      status: 'Dipinjam',
      renewals: 0,
      readingProgress: 15,
      fineAmount: 0,
    },
    {
      id: 'ln-06',
      loanCode: 'TRX-2611-06',
      bookId: 'bk-04',
      bookTitle: 'Garis Cakrawala: Esai Fenomenologi Sunyi',
      bookAuthor: 'Prof. Ratna Kusuma',
      memberId: 'mem-03',
      memberName: 'Siti Aisyah',
      memberCode: 'WNL-2026-039',
      borrowedAt: isoDaysAgo(3),
      dueAt: isoDaysAhead(11),
      returnedAt: null,
      status: 'Dipinjam',
      renewals: 0,
      readingProgress: 50,
      fineAmount: 0,
    },
    {
      id: 'ln-07',
      loanCode: 'TRX-2611-07',
      bookId: 'bk-05',
      bookTitle: 'Arsitektur Sistem Informasi Perpustakaan',
      bookAuthor: 'Fajar Santoso, M.Kom.',
      memberId: 'mem-02',
      memberName: 'Bima Pratama',
      memberCode: 'WNL-2026-027',
      borrowedAt: isoDaysAgo(2),
      dueAt: isoDaysAhead(12),
      returnedAt: null,
      status: 'Dipinjam',
      renewals: 0,
      readingProgress: 20,
      fineAmount: 0,
    },
    {
      id: 'ln-08',
      loanCode: 'TRX-2611-08',
      bookId: 'bk-06',
      bookTitle: 'Taman Hutan Kota & Ekologi Nusantara',
      bookAuthor: 'Dr. Sekar Melati',
      memberId: 'mem-04',
      memberName: 'Raka Mahendra',
      memberCode: 'WNL-2026-042',
      borrowedAt: isoDaysAgo(1),
      dueAt: isoDaysAhead(13),
      returnedAt: null,
      status: 'Dipinjam',
      renewals: 0,
      readingProgress: 10,
      fineAmount: 0,
    },
    {
      id: 'ln-09',
      loanCode: 'TRX-2610-19',
      bookId: 'bk-08',
      bookTitle: 'Kebiasaan Membaca & Fokus Mendalam',
      bookAuthor: 'Bagus Setiawan',
      memberId: 'mem-01',
      memberName: 'Nadya Larasati',
      memberCode: 'WNL-2026-014',
      borrowedAt: isoDaysAgo(20),
      dueAt: isoDaysAgo(6),
      returnedAt: isoDaysAgo(8),
      status: 'Dikembalikan',
      renewals: 0,
      readingProgress: 100,
      fineAmount: 0,
    },
    {
      id: 'ln-10',
      loanCode: 'TRX-2610-15',
      bookId: 'bk-07',
      bookTitle: 'Tipografi Editorial & Keterbacaan Aksesibel',
      bookAuthor: 'Nadia Kartika',
      memberId: 'mem-03',
      memberName: 'Siti Aisyah',
      memberCode: 'WNL-2026-039',
      borrowedAt: isoDaysAgo(24),
      dueAt: isoDaysAgo(10),
      returnedAt: isoDaysAgo(11),
      status: 'Dikembalikan',
      renewals: 0,
      readingProgress: 100,
      fineAmount: 0,
    },
  ];

  // Note: bk-01 has 1 active loan -> wait let's sync availableCopies precisely with active loans!
  // Active loans per book:
  // bk-01: 1 (total 5 -> avail 4)
  // bk-02: 1 (total 4 -> avail 3)
  // bk-03: 3 (total 3 -> avail 0)
  // bk-04: 1 (total 4 -> avail 3)
  // bk-05: 1 (total 6 -> avail 5)
  // bk-06: 1 (total 3 -> avail 2)
  // bk-07: 0 (total 4 -> avail 4)
  // bk-08: 0 (total 5 -> avail 5)
  // Let's keep bk-01 and bk-02 matching accurately!
  books[0].availableCopies = 4;
  books[1].availableCopies = 3;
  books[2].availableCopies = 0;
  books[3].availableCopies = 3;
  books[4].availableCopies = 5;
  books[5].availableCopies = 2;
  books[6].availableCopies = 4;
  books[7].availableCopies = 5;

  const reservations: Reservation[] = [
    {
      id: 'res-01',
      bookId: 'bk-03',
      bookTitle: 'Geometri Ruang Publik & Tektonika Modern',
      memberId: 'mem-02',
      memberName: 'Bima Pratama',
      createdAt: isoDaysAgo(1),
      status: 'Menunggu',
    },
  ];

  const roomBookings: RoomBooking[] = [
    {
      id: 'rm-01',
      roomName: 'Meja Baca Sunyi A-04',
      memberId: 'mem-01',
      memberName: 'Nadya Larasati',
      date: new Date().toISOString().slice(0, 10),
      timeSlot: '09:00 – 12:00 WIB',
      purpose: 'Riset Arsip Botani',
      status: 'Terkonfirmasi',
    },
    {
      id: 'rm-02',
      roomName: 'Ruang Diskusi Cendekia 2',
      memberId: 'mem-03',
      memberName: 'Siti Aisyah',
      date: new Date().toISOString().slice(0, 10),
      timeSlot: '13:30 – 15:30 WIB',
      purpose: 'Kelompok Kajian Fenomenologi',
      status: 'Terkonfirmasi',
    },
  ];

  const activities: ActivityEvent[] = [
    {
      id: 'act-01',
      type: 'BORROW',
      title: 'Peminjaman Buku Baru',
      description: 'Raka Mahendra meminjam "Taman Hutan Kota & Ekologi Nusantara"',
      actorName: 'Raka Mahendra',
      actorRole: 'member',
      timestamp: isoDaysAgo(1, -2),
      amountLabel: '14 Hari',
    },
    {
      id: 'act-02',
      type: 'RESERVE',
      title: 'Antrean Reservasi',
      description: 'Bima Pratama masuk antrean untuk "Geometri Ruang Publik & Tektonika Modern"',
      actorName: 'Bima Pratama',
      actorRole: 'member',
      timestamp: isoDaysAgo(1, -5),
    },
    {
      id: 'act-03',
      type: 'BORROW',
      title: 'Peminjaman Buku Baru',
      description: 'Bima Pratama meminjam "Arsitektur Sistem Informasi Perpustakaan"',
      actorName: 'Bima Pratama',
      actorRole: 'member',
      timestamp: isoDaysAgo(2, -3),
      amountLabel: '14 Hari',
    },
    {
      id: 'act-04',
      type: 'REPORT',
      title: 'Pelaporan Otomatis Selesai',
      description: 'Laporan Sirkulasi Mingguan dibuat otomatis oleh penjadwal sistem',
      actorName: 'Sistem Pelaporan',
      actorRole: 'system',
      timestamp: isoDaysAgo(2, -8),
    },
    {
      id: 'act-05',
      type: 'RETURN',
      title: 'Pengembalian Tepat Waktu',
      description: 'Nadya Larasati mengembalikan "Kebiasaan Membaca & Fokus Mendalam"',
      actorName: 'Nadya Larasati',
      actorRole: 'member',
      timestamp: isoDaysAgo(8),
      amountLabel: 'Denda Rp 0',
    },
  ];

  const reportSchedule: ReportScheduleConfig = {
    enabled: true,
    frequency: 'Harian',
    nextRunAt: isoDaysAhead(1),
    lastRunAt: isoDaysAgo(1),
    includeCirculation: true,
    includeInventory: true,
    includeFines: true,
  };

  const state: DatabaseState = {
    books,
    members,
    loans,
    reservations,
    roomBookings,
    activities,
    reports: [],
    reportSchedule,
  };

  state.reports.push(
    buildReportFromState(state, 'Sirkulasi Harian', 'Otomatis Terjadwal', isoDaysAgo(1)),
    buildReportFromState(state, 'Kesehatan Koleksi', 'Manual', isoDaysAgo(3))
  );

  return state;
}

function recalculateOverdueLoans(state: DatabaseState): void {
  const now = Date.now();
  for (const loan of state.loans) {
    if (loan.returnedAt) continue;
    const dueMs = new Date(loan.dueAt).getTime();
    if (now > dueMs) {
      const lateDays = Math.max(1, Math.ceil((now - dueMs) / 86400000));
      loan.status = 'Terlambat';
      loan.fineAmount = lateDays * FINE_PER_DAY;
    } else if (loan.renewals > 0) {
      loan.status = 'Diperpanjang';
      loan.fineAmount = 0;
    } else {
      loan.status = 'Dipinjam';
      loan.fineAmount = 0;
    }
  }
}

function buildReportFromState(
  state: DatabaseState,
  type: ReportType,
  trigger: 'Otomatis Terjadwal' | 'Manual',
  customTimestamp?: string
): AutomatedReport {
  recalculateOverdueLoans(state);
  const nowIso = customTimestamp || new Date().toISOString();
  const activeLoans = state.loans.filter((l) => !l.returnedAt);
  const overdueLoans = activeLoans.filter((l) => l.status === 'Terlambat');
  const returnedLoans = state.loans.filter((l) => Boolean(l.returnedAt));
  const totalCopies = state.books.reduce((acc, b) => acc + b.totalCopies, 0);
  const availableCopies = state.books.reduce((acc, b) => acc + b.availableCopies, 0);
  const totalFines = state.loans.reduce((acc, l) => acc + l.fineAmount, 0);
  const utilizationRate =
    totalCopies > 0 ? Math.round(((totalCopies - availableCopies) / totalCopies) * 100) : 0;

  let rows: AutomatedReportRow[] = [];
  if (type === 'Sirkulasi Harian') {
    rows = state.loans.slice(0, 12).map((loan) => ({
      label: `${loan.loanCode} · ${loan.bookTitle}`,
      category: loan.memberName,
      metricA: new Date(loan.borrowedAt).toLocaleDateString('id-ID'),
      metricB: loan.fineAmount > 0 ? `Rp ${loan.fineAmount.toLocaleString('id-ID')}` : 'Rp 0',
      status: loan.status,
    }));
  } else if (type === 'Kesehatan Koleksi') {
    rows = state.books.map((book) => ({
      label: book.title,
      category: book.category,
      metricA: `${book.availableCopies}/${book.totalCopies} eks`,
      metricB: `${book.borrowCount} pinjam`,
      status:
        book.availableCopies === 0
          ? 'Stok Habis'
          : book.availableCopies === 1
            ? 'Stok Menipis'
            : 'Optimal',
    }));
  } else {
    rows = state.members
      .filter((m) => m.role === 'member')
      .map((member) => {
        const memberLoans = state.loans.filter((l) => l.memberId === member.id);
        const memberActive = memberLoans.filter((l) => !l.returnedAt).length;
        const memberOverdue = memberLoans.filter((l) => l.status === 'Terlambat').length;
        const memberFine = memberLoans.reduce((acc, l) => acc + l.fineAmount, 0);
        return {
          label: `${member.memberCode} · ${member.name}`,
          category: member.tier,
          metricA: `${memberActive} aktif / ${memberLoans.length} total`,
          metricB: `Rp ${memberFine.toLocaleString('id-ID')}`,
          status: memberOverdue > 0 ? `${memberOverdue} Terlambat` : 'Patuh',
        };
      });
  }

  const codeNum = Math.floor(1000 + Math.random() * 9000);
  const prefix =
    type === 'Sirkulasi Harian' ? 'RPT-SRK' : type === 'Kesehatan Koleksi' ? 'RPT-KOL' : 'RPT-KPT';

  return {
    id: `rpt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    reportCode: `${prefix}-${codeNum}`,
    title: `Laporan ${type} — Wonu's Library`,
    type,
    generatedAt: nowIso,
    trigger,
    periodLabel: new Date(nowIso).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
    summary: {
      totalLoans: state.loans.length,
      activeLoans: activeLoans.length,
      overdueLoans: overdueLoans.length,
      returnedLoans: returnedLoans.length,
      totalBooks: state.books.length,
      availableCopies,
      totalFines,
      utilizationRate,
    },
    rows,
  };
}

function loadDatabase(): DatabaseState {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const seed = createInitialSeed();
    fs.writeFileSync(DB_PATH, JSON.stringify(seed, null, 2), 'utf8');
    return seed;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    const parsed = JSON.parse(raw) as DatabaseState;
    recalculateOverdueLoans(parsed);
    return parsed;
  } catch {
    const seed = createInitialSeed();
    fs.writeFileSync(DB_PATH, JSON.stringify(seed, null, 2), 'utf8');
    return seed;
  }
}

let db: DatabaseState = loadDatabase();
const sseClients = new Set<Response>();

function saveDatabase(): void {
  recalculateOverdueLoans(db);
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

function getSnapshot(): LibrarySnapshot {
  recalculateOverdueLoans(db);
  return {
    ...db,
    serverTime: new Date().toISOString(),
  };
}

function broadcastSnapshot(): void {
  const payload = `event: snapshot\ndata: ${JSON.stringify(getSnapshot())}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

function pushActivity(event: Omit<ActivityEvent, 'id' | 'timestamp'>): void {
  db.activities.unshift({
    ...event,
    id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
  });
  if (db.activities.length > 60) {
    db.activities = db.activities.slice(0, 60);
  }
}

function computeNextScheduleRun(frequency: 'Harian' | 'Mingguan' | 'Bulanan'): string {
  const days = frequency === 'Harian' ? 1 : frequency === 'Mingguan' ? 7 : 30;
  return isoDaysAhead(days);
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // SSE endpoint for real-time admin & member dashboards
  app.get('/api/stream', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    sseClients.add(res);
    res.write(`event: snapshot\ndata: ${JSON.stringify(getSnapshot())}\n\n`);

    const keepAlive = setInterval(() => {
      try {
        res.write(': keepalive\n\n');
      } catch {
        clearInterval(keepAlive);
        sseClients.delete(res);
      }
    }, 15000);

    req.on('close', () => {
      clearInterval(keepAlive);
      sseClients.delete(res);
    });
  });

  app.get('/api/state', (_req: Request, res: Response) => {
    res.json(getSnapshot());
  });

  // Borrow a book
  app.post('/api/loans', (req: Request, res: Response) => {
    const { bookId, memberId, durationDays } = req.body as {
      bookId?: string;
      memberId?: string;
      durationDays?: number;
    };

    const book = db.books.find((b) => b.id === bookId);
    const member = db.members.find((m) => m.id === memberId);

    if (!book || !member) {
      res.status(404).json({ error: 'Buku atau anggota tidak ditemukan.' });
      return;
    }
    if (member.status !== 'Aktif') {
      res.status(400).json({ error: 'Akun anggota sedang ditangguhkan.' });
      return;
    }
    const activeMemberLoans = db.loans.filter((l) => l.memberId === member.id && !l.returnedAt);
    if (activeMemberLoans.length >= member.maxLoans) {
      res.status(400).json({
        error: `Batas maksimal peminjaman (${member.maxLoans} buku) untuk akun ini telah tercapai.`,
      });
      return;
    }
    if (activeMemberLoans.some((l) => l.bookId === book.id)) {
      res.status(400).json({ error: 'Anggota masih memiliki pinjaman aktif untuk buku yang sama.' });
      return;
    }
    if (book.availableCopies <= 0) {
      res.status(400).json({ error: 'Stok buku sedang habis. Silakan ajukan reservasi antrean.' });
      return;
    }

    const days = Math.min(30, Math.max(3, Number(durationDays) || 14));
    const loan: LoanTransaction = {
      id: `ln-${Date.now()}`,
      loanCode: `TRX-${new Date().toISOString().slice(2, 4)}${new Date().toISOString().slice(5, 7)}-${Math.floor(10 + Math.random() * 89)}`,
      bookId: book.id,
      bookTitle: book.title,
      bookAuthor: book.author,
      memberId: member.id,
      memberName: member.name,
      memberCode: member.memberCode,
      borrowedAt: new Date().toISOString(),
      dueAt: isoDaysAhead(days),
      returnedAt: null,
      status: 'Dipinjam',
      renewals: 0,
      readingProgress: 0,
      fineAmount: 0,
    };

    book.availableCopies = Math.max(0, book.availableCopies - 1);
    book.borrowCount += 1;
    db.loans.unshift(loan);

    // Fulfill waiting reservation if this member had one
    const waitingRes = db.reservations.find(
      (r) => r.bookId === book.id && r.memberId === member.id && (r.status === 'Menunggu' || r.status === 'Siap Diambil')
    );
    if (waitingRes) {
      waitingRes.status = 'Selesai';
    }

    pushActivity({
      type: 'BORROW',
      title: 'Peminjaman Buku Baru',
      description: `${member.name} meminjam "${book.title}"`,
      actorName: member.name,
      actorRole: member.role,
      amountLabel: `${days} Hari`,
    });

    saveDatabase();
    broadcastSnapshot();
    res.status(201).json({ loan, snapshot: getSnapshot() });
  });

  // Return a book
  app.post('/api/loans/:id/return', (req: Request, res: Response) => {
    const loan = db.loans.find((l) => l.id === req.params.id);
    if (!loan) {
      res.status(404).json({ error: 'Transaksi peminjaman tidak ditemukan.' });
      return;
    }
    if (loan.returnedAt) {
      res.status(400).json({ error: 'Buku sudah dikembalikan sebelumnya.' });
      return;
    }

    recalculateOverdueLoans(db);
    loan.returnedAt = new Date().toISOString();
    loan.status = 'Dikembalikan';
    loan.readingProgress = 100;

    const book = db.books.find((b) => b.id === loan.bookId);
    if (book) {
      book.availableCopies = Math.min(book.totalCopies, book.availableCopies + 1);
      const nextReservation = db.reservations.find(
        (r) => r.bookId === book.id && r.status === 'Menunggu'
      );
      if (nextReservation) {
        nextReservation.status = 'Siap Diambil';
        pushActivity({
          type: 'RESERVE',
          title: 'Buku Reservasi Tersedia',
          description: `"${book.title}" kini siap diambil oleh ${nextReservation.memberName}`,
          actorName: 'Sistem Sirkulasi',
          actorRole: 'system',
        });
      }
    }

    pushActivity({
      type: 'RETURN',
      title: loan.fineAmount > 0 ? 'Pengembalian dengan Denda' : 'Pengembalian Buku',
      description: `${loan.memberName} mengembalikan "${loan.bookTitle}"`,
      actorName: loan.memberName,
      actorRole: 'member',
      amountLabel:
        loan.fineAmount > 0 ? `Denda Rp ${loan.fineAmount.toLocaleString('id-ID')}` : 'Tepat Waktu',
    });

    saveDatabase();
    broadcastSnapshot();
    res.json({ loan, snapshot: getSnapshot() });
  });

  // Renew a loan (+7 days)
  app.post('/api/loans/:id/renew', (req: Request, res: Response) => {
    const loan = db.loans.find((l) => l.id === req.params.id);
    if (!loan || loan.returnedAt) {
      res.status(404).json({ error: 'Peminjaman aktif tidak ditemukan.' });
      return;
    }
    recalculateOverdueLoans(db);
    if (loan.status === 'Terlambat') {
      res.status(400).json({ error: 'Peminjaman yang sudah terlambat tidak dapat diperpanjang.' });
      return;
    }
    if (loan.renewals >= 2) {
      res.status(400).json({ error: 'Batas perpanjangan maksimal (2 kali) telah tercapai.' });
      return;
    }

    const currentDue = new Date(loan.dueAt).getTime();
    loan.dueAt = new Date(currentDue + 7 * 86400000).toISOString();
    loan.renewals += 1;
    loan.status = 'Diperpanjang';

    pushActivity({
      type: 'RENEW',
      title: 'Perpanjangan Masa Pinjam',
      description: `${loan.memberName} memperpanjang "${loan.bookTitle}" (+7 hari)`,
      actorName: loan.memberName,
      actorRole: 'member',
      amountLabel: `Ke-${loan.renewals}`,
    });

    saveDatabase();
    broadcastSnapshot();
    res.json({ loan, snapshot: getSnapshot() });
  });

  // Update reading progress
  app.patch('/api/loans/:id/progress', (req: Request, res: Response) => {
    const loan = db.loans.find((l) => l.id === req.params.id);
    if (!loan) {
      res.status(404).json({ error: 'Transaksi tidak ditemukan.' });
      return;
    }
    const progress = Math.min(100, Math.max(0, Number(req.body?.readingProgress) || 0));
    loan.readingProgress = progress;
    saveDatabase();
    broadcastSnapshot();
    res.json({ loan, snapshot: getSnapshot() });
  });

  // Add new book (Collection Management)
  app.post('/api/books', (req: Request, res: Response) => {
    const body = req.body as Partial<Book>;
    if (!body.title?.trim() || !body.author?.trim()) {
      res.status(400).json({ error: 'Judul dan penulis buku wajib diisi.' });
      return;
    }

    const category = (body.category || 'Fiksi Sastra') as BookCategory;
    const defaultCoverByCategory: Record<BookCategory, string> = {
      'Fiksi Sastra': '/src/assets/images/book_cover_botanical_1795659629239.jpg',
      'Sains & Teknologi': '/src/assets/images/book_cover_cosmos_1795659629522.jpg',
      'Arsitektur & Desain': '/src/assets/images/book_cover_architecture_1795659629942.jpg',
      'Filsafat & Sejarah': '/src/assets/images/book_cover_philosophy_1795659630183.jpg',
      'Pengembangan Diri': '/src/assets/images/book_cover_philosophy_1795659630183.jpg',
      'Referensi Akademik': '/src/assets/images/book_cover_botanical_1795659629239.jpg',
    };

    const totalCopies = Math.max(1, Number(body.totalCopies) || 3);
    const newBook: Book = {
      id: `bk-${Date.now()}`,
      isbn: body.isbn?.trim() || `978-623-${Math.floor(100 + Math.random() * 899)}-${Math.floor(100 + Math.random() * 899)}-1`,
      title: body.title.trim(),
      author: body.author.trim(),
      publisher: body.publisher?.trim() || 'Wonu Press',
      year: Number(body.year) || new Date().getFullYear(),
      category,
      shelfCode: body.shelfCode?.trim() || 'RAK-U01',
      totalCopies,
      availableCopies: totalCopies,
      pages: Math.max(20, Number(body.pages) || 240),
      language: body.language?.trim() || 'Indonesia',
      format: (body.format || 'Cetak & E-Book') as BookFormat,
      coverImage: body.coverImage?.trim() || defaultCoverByCategory[category],
      coverTone: '#0f766e',
      synopsis:
        body.synopsis?.trim() ||
        'Koleksi terbaru di Wonu\'s Library yang tersedia untuk peminjaman anggota dan akses bacaan digital.',
      excerpt:
        body.excerpt?.trim() ||
        `${body.title.trim()}\n\nPratinjau naskah digital sedang disiapkan oleh kurator koleksi Wonu's Library. Silakan pinjam salinan penuh melalui meja sirkulasi.`,
      borrowCount: 0,
      rating: 4.8,
      createdAt: new Date().toISOString(),
    };

    db.books.unshift(newBook);
    pushActivity({
      type: 'CATALOG_ADD',
      title: 'Koleksi Baru Ditambahkan',
      description: `Admin menambahkan "${newBook.title}" (${newBook.totalCopies} eksemplar)`,
      actorName: 'Wonu Prakoso',
      actorRole: 'admin',
      amountLabel: newBook.shelfCode,
    });

    saveDatabase();
    broadcastSnapshot();
    res.status(201).json({ book: newBook, snapshot: getSnapshot() });
  });

  // Update existing book
  app.patch('/api/books/:id', (req: Request, res: Response) => {
    const book = db.books.find((b) => b.id === req.params.id);
    if (!book) {
      res.status(404).json({ error: 'Buku tidak ditemukan.' });
      return;
    }

    const body = req.body as Partial<Book>;
    const activeCount = db.loans.filter((l) => l.bookId === book.id && !l.returnedAt).length;

    if (body.title !== undefined) book.title = body.title.trim() || book.title;
    if (body.author !== undefined) book.author = body.author.trim() || book.author;
    if (body.publisher !== undefined) book.publisher = body.publisher.trim() || book.publisher;
    if (body.category !== undefined) book.category = body.category;
    if (body.shelfCode !== undefined) book.shelfCode = body.shelfCode.trim() || book.shelfCode;
    if (body.year !== undefined) book.year = Number(body.year) || book.year;
    if (body.format !== undefined) book.format = body.format;
    if (body.synopsis !== undefined) book.synopsis = body.synopsis.trim() || book.synopsis;
    if (body.totalCopies !== undefined) {
      const nextTotal = Math.max(activeCount, Number(body.totalCopies) || book.totalCopies);
      book.totalCopies = nextTotal;
      book.availableCopies = Math.max(0, nextTotal - activeCount);
    }

    pushActivity({
      type: 'CATALOG_EDIT',
      title: 'Pembaruan Data Koleksi',
      description: `Metadata atau stok "${book.title}" diperbarui`,
      actorName: 'Wonu Prakoso',
      actorRole: 'admin',
    });

    saveDatabase();
    broadcastSnapshot();
    res.json({ book, snapshot: getSnapshot() });
  });

  // Delete book
  app.delete('/api/books/:id', (req: Request, res: Response) => {
    const bookIndex = db.books.findIndex((b) => b.id === req.params.id);
    if (bookIndex === -1) {
      res.status(404).json({ error: 'Buku tidak ditemukan.' });
      return;
    }
    const book = db.books[bookIndex];
    const hasActiveLoan = db.loans.some((l) => l.bookId === book.id && !l.returnedAt);
    if (hasActiveLoan) {
      res.status(400).json({ error: 'Tidak dapat menghapus buku yang masih memiliki peminjaman aktif.' });
      return;
    }

    db.books.splice(bookIndex, 1);
    pushActivity({
      type: 'CATALOG_EDIT',
      title: 'Penghapusan Koleksi',
      description: `Admin menghapus "${book.title}" dari katalog`,
      actorName: 'Wonu Prakoso',
      actorRole: 'admin',
    });

    saveDatabase();
    broadcastSnapshot();
    res.json({ ok: true, snapshot: getSnapshot() });
  });

  // Register new member
  app.post('/api/members', (req: Request, res: Response) => {
    const { name, email, tier } = req.body as {
      name?: string;
      email?: string;
      tier?: 'Reguler' | 'Peneliti';
    };
    if (!name?.trim() || !email?.trim()) {
      res.status(400).json({ error: 'Nama dan email anggota wajib diisi.' });
      return;
    }

    const memberTier = tier === 'Peneliti' ? 'Peneliti' : 'Reguler';
    const newMember: Member = {
      id: `mem-${Date.now()}`,
      memberCode: `WNL-2026-${Math.floor(100 + Math.random() * 899)}`,
      name: name.trim(),
      email: email.trim(),
      role: 'member',
      tier: memberTier,
      status: 'Aktif',
      joinedAt: new Date().toISOString(),
      maxLoans: memberTier === 'Peneliti' ? 5 : 3,
      savedBookIds: [],
    };

    db.members.push(newMember);
    pushActivity({
      type: 'MEMBER_UPDATE',
      title: 'Anggota Baru Terdaftar',
      description: `${newMember.name} bergabung sebagai anggota ${newMember.tier}`,
      actorName: newMember.name,
      actorRole: 'member',
      amountLabel: newMember.memberCode,
    });

    saveDatabase();
    broadcastSnapshot();
    res.status(201).json({ member: newMember, snapshot: getSnapshot() });
  });

  // Update member (status / bookmark toggle)
  app.patch('/api/members/:id', (req: Request, res: Response) => {
    const member = db.members.find((m) => m.id === req.params.id);
    if (!member) {
      res.status(404).json({ error: 'Anggota tidak ditemukan.' });
      return;
    }

    const { status, toggleSaveBookId } = req.body as {
      status?: 'Aktif' | 'Ditangguhkan';
      toggleSaveBookId?: string;
    };

    if (status && member.role !== 'admin') {
      member.status = status;
      pushActivity({
        type: 'MEMBER_UPDATE',
        title: 'Status Anggota Diperbarui',
        description: `Status ${member.name} diubah menjadi ${status}`,
        actorName: 'Wonu Prakoso',
        actorRole: 'admin',
      });
    }

    if (toggleSaveBookId) {
      const exists = member.savedBookIds.includes(toggleSaveBookId);
      member.savedBookIds = exists
        ? member.savedBookIds.filter((id) => id !== toggleSaveBookId)
        : [...member.savedBookIds, toggleSaveBookId];
    }

    saveDatabase();
    broadcastSnapshot();
    res.json({ member, snapshot: getSnapshot() });
  });

  // Reserve a book
  app.post('/api/reservations', (req: Request, res: Response) => {
    const { bookId, memberId } = req.body as { bookId?: string; memberId?: string };
    const book = db.books.find((b) => b.id === bookId);
    const member = db.members.find((m) => m.id === memberId);

    if (!book || !member) {
      res.status(404).json({ error: 'Buku atau anggota tidak ditemukan.' });
      return;
    }
    const existing = db.reservations.find(
      (r) => r.bookId === book.id && r.memberId === member.id && r.status === 'Menunggu'
    );
    if (existing) {
      res.status(400).json({ error: 'Anda sudah berada dalam antrean reservasi buku ini.' });
      return;
    }

    const reservation: Reservation = {
      id: `res-${Date.now()}`,
      bookId: book.id,
      bookTitle: book.title,
      memberId: member.id,
      memberName: member.name,
      createdAt: new Date().toISOString(),
      status: book.availableCopies > 0 ? 'Siap Diambil' : 'Menunggu',
    };

    db.reservations.unshift(reservation);
    pushActivity({
      type: 'RESERVE',
      title: 'Reservasi Buku',
      description: `${member.name} mereservasi "${book.title}"`,
      actorName: member.name,
      actorRole: member.role,
    });

    saveDatabase();
    broadcastSnapshot();
    res.status(201).json({ reservation, snapshot: getSnapshot() });
  });

  app.patch('/api/reservations/:id', (req: Request, res: Response) => {
    const reservation = db.reservations.find((r) => r.id === req.params.id);
    if (!reservation) {
      res.status(404).json({ error: 'Reservasi tidak ditemukan.' });
      return;
    }
    const { status } = req.body as { status?: Reservation['status'] };
    if (status) {
      reservation.status = status;
    }
    saveDatabase();
    broadcastSnapshot();
    res.json({ reservation, snapshot: getSnapshot() });
  });

  // Supporting library service: Reading table & study room booking
  app.post('/api/rooms', (req: Request, res: Response) => {
    const { roomName, memberId, date, timeSlot, purpose } = req.body as {
      roomName?: string;
      memberId?: string;
      date?: string;
      timeSlot?: string;
      purpose?: string;
    };
    const member = db.members.find((m) => m.id === memberId);
    if (!roomName || !member || !date || !timeSlot) {
      res.status(400).json({ error: 'Data reservasi ruang baca belum lengkap.' });
      return;
    }

    const conflict = db.roomBookings.some(
      (b) =>
        b.roomName === roomName &&
        b.date === date &&
        b.timeSlot === timeSlot &&
        b.status === 'Terkonfirmasi'
    );
    if (conflict) {
      res.status(400).json({ error: 'Ruangan sudah dipesan pada jadwal tersebut.' });
      return;
    }

    const booking: RoomBooking = {
      id: `rm-${Date.now()}`,
      roomName,
      memberId: member.id,
      memberName: member.name,
      date,
      timeSlot,
      purpose: purpose?.trim() || 'Studi Mandiri',
      status: 'Terkonfirmasi',
    };

    db.roomBookings.unshift(booking);
    pushActivity({
      type: 'ROOM_BOOKING',
      title: 'Reservasi Ruang Baca',
      description: `${member.name} memesan ${roomName} (${timeSlot})`,
      actorName: member.name,
      actorRole: member.role,
    });

    saveDatabase();
    broadcastSnapshot();
    res.status(201).json({ booking, snapshot: getSnapshot() });
  });

  app.patch('/api/rooms/:id', (req: Request, res: Response) => {
    const booking = db.roomBookings.find((b) => b.id === req.params.id);
    if (!booking) {
      res.status(404).json({ error: 'Reservasi ruangan tidak ditemukan.' });
      return;
    }
    const { status } = req.body as { status?: RoomBooking['status'] };
    if (status) booking.status = status;
    saveDatabase();
    broadcastSnapshot();
    res.json({ booking, snapshot: getSnapshot() });
  });

  // Automated reporting generation
  app.post('/api/reports/generate', (req: Request, res: Response) => {
    const { type, trigger } = req.body as {
      type?: ReportType;
      trigger?: 'Otomatis Terjadwal' | 'Manual';
    };
    const reportType: ReportType = type || 'Sirkulasi Harian';
    const reportTrigger = trigger || 'Manual';

    const report = buildReportFromState(db, reportType, reportTrigger);
    db.reports.unshift(report);
    if (db.reports.length > 30) {
      db.reports = db.reports.slice(0, 30);
    }

    db.reportSchedule.lastRunAt = report.generatedAt;
    db.reportSchedule.nextRunAt = computeNextScheduleRun(db.reportSchedule.frequency);

    pushActivity({
      type: 'REPORT',
      title: `Laporan ${reportType}`,
      description: `${report.reportCode} dibuat (${reportTrigger})`,
      actorName: reportTrigger === 'Manual' ? 'Wonu Prakoso' : 'Sistem Pelaporan',
      actorRole: reportTrigger === 'Manual' ? 'admin' : 'system',
    });

    saveDatabase();
    broadcastSnapshot();
    res.status(201).json({ report, snapshot: getSnapshot() });
  });

  app.patch('/api/reports/schedule', (req: Request, res: Response) => {
    const body = req.body as Partial<ReportScheduleConfig>;
    db.reportSchedule = {
      ...db.reportSchedule,
      ...body,
      nextRunAt: body.frequency
        ? computeNextScheduleRun(body.frequency)
        : db.reportSchedule.nextRunAt,
    };

    pushActivity({
      type: 'REPORT',
      title: 'Jadwal Pelaporan Diperbarui',
      description: `Pelaporan otomatis ${db.reportSchedule.enabled ? `aktif (${db.reportSchedule.frequency})` : 'dinonaktifkan'}`,
      actorName: 'Wonu Prakoso',
      actorRole: 'admin',
    });

    saveDatabase();
    broadcastSnapshot();
    res.json({ reportSchedule: db.reportSchedule, snapshot: getSnapshot() });
  });

  // Background check for automated scheduled reports
  setInterval(() => {
    if (!db.reportSchedule.enabled) return;
    const nextMs = new Date(db.reportSchedule.nextRunAt).getTime();
    if (Date.now() >= nextMs) {
      const types: ReportType[] = [];
      if (db.reportSchedule.includeCirculation) types.push('Sirkulasi Harian');
      if (db.reportSchedule.includeInventory) types.push('Kesehatan Koleksi');
      if (db.reportSchedule.includeFines) types.push('Kepatuhan & Denda');
      for (const rType of types) {
        const rpt = buildReportFromState(db, rType, 'Otomatis Terjadwal');
        db.reports.unshift(rpt);
      }
      db.reportSchedule.lastRunAt = new Date().toISOString();
      db.reportSchedule.nextRunAt = computeNextScheduleRun(db.reportSchedule.frequency);
      pushActivity({
        type: 'REPORT',
        title: 'Pelaporan Terjadwal Dieksekusi',
        description: `${types.length} laporan otomatis (${db.reportSchedule.frequency}) telah diterbitkan`,
        actorName: 'Sistem Pelaporan',
        actorRole: 'system',
      });
      saveDatabase();
      broadcastSnapshot();
    }
  }, 30000);

  // Serve Vite in development or static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Wonu's Library server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
