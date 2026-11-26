export type BookCategory =
  | 'Fiksi Sastra'
  | 'Sains & Teknologi'
  | 'Arsitektur & Desain'
  | 'Filsafat & Sejarah'
  | 'Pengembangan Diri'
  | 'Referensi Akademik';

export type BookFormat = 'Cetak & E-Book' | 'Buku Cetak' | 'E-Book Digital';

export interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  year: number;
  category: BookCategory;
  shelfCode: string;
  totalCopies: number;
  availableCopies: number;
  pages: number;
  language: string;
  format: BookFormat;
  coverImage: string;
  coverTone: string;
  synopsis: string;
  excerpt: string;
  borrowCount: number;
  rating: number;
  createdAt: string;
}

export interface Member {
  id: string;
  memberCode: string;
  name: string;
  email: string;
  role: 'member' | 'admin';
  tier: 'Reguler' | 'Peneliti' | 'Pustakawan';
  status: 'Aktif' | 'Ditangguhkan';
  joinedAt: string;
  maxLoans: number;
  savedBookIds: string[];
}

export type LoanStatus = 'Dipinjam' | 'Terlambat' | 'Dikembalikan' | 'Diperpanjang';

export interface LoanTransaction {
  id: string;
  loanCode: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  memberId: string;
  memberName: string;
  memberCode: string;
  borrowedAt: string;
  dueAt: string;
  returnedAt: string | null;
  status: LoanStatus;
  renewals: number;
  readingProgress: number;
  fineAmount: number;
}

export interface Reservation {
  id: string;
  bookId: string;
  bookTitle: string;
  memberId: string;
  memberName: string;
  createdAt: string;
  status: 'Menunggu' | 'Siap Diambil' | 'Dibatalkan' | 'Selesai';
}

export interface RoomBooking {
  id: string;
  roomName: string;
  memberId: string;
  memberName: string;
  date: string;
  timeSlot: string;
  purpose: string;
  status: 'Terkonfirmasi' | 'Selesai' | 'Dibatalkan';
}

export type ActivityType =
  | 'BORROW'
  | 'RETURN'
  | 'RENEW'
  | 'RESERVE'
  | 'CATALOG_ADD'
  | 'CATALOG_EDIT'
  | 'REPORT'
  | 'ROOM_BOOKING'
  | 'MEMBER_UPDATE';

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  actorName: string;
  actorRole: 'admin' | 'member' | 'system';
  timestamp: string;
  amountLabel?: string;
}

export type ReportType = 'Sirkulasi Harian' | 'Kesehatan Koleksi' | 'Kepatuhan & Denda';

export interface AutomatedReportRow {
  label: string;
  category: string;
  metricA: string;
  metricB: string;
  status: string;
}

export interface AutomatedReport {
  id: string;
  reportCode: string;
  title: string;
  type: ReportType;
  generatedAt: string;
  trigger: 'Otomatis Terjadwal' | 'Manual';
  periodLabel: string;
  summary: {
    totalLoans: number;
    activeLoans: number;
    overdueLoans: number;
    returnedLoans: number;
    totalBooks: number;
    availableCopies: number;
    totalFines: number;
    utilizationRate: number;
  };
  rows: AutomatedReportRow[];
}

export interface ReportScheduleConfig {
  enabled: boolean;
  frequency: 'Harian' | 'Mingguan' | 'Bulanan';
  nextRunAt: string;
  lastRunAt: string | null;
  includeCirculation: boolean;
  includeInventory: boolean;
  includeFines: boolean;
}

export interface LibrarySnapshot {
  books: Book[];
  members: Member[];
  loans: LoanTransaction[];
  reservations: Reservation[];
  roomBookings: RoomBooking[];
  activities: ActivityEvent[];
  reports: AutomatedReport[];
  reportSchedule: ReportScheduleConfig;
  serverTime: string;
}
