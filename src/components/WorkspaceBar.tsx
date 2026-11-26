import { Moon, Sun, Type, UserCheck, Users } from 'lucide-react';
import type { Member } from '../types/library';

interface WorkspaceBarProps {
  members: Member[];
  activeMember: Member;
  onChangeActiveMember: (memberId: string) => void;
  onOpenMemberCard: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  largeText: boolean;
  onToggleLargeText: () => void;
  streamConnected: boolean;
}

export function WorkspaceBar({
  members,
  activeMember,
  onChangeActiveMember,
  onOpenMemberCard,
  darkMode,
  onToggleDarkMode,
  largeText,
  onToggleLargeText,
  streamConnected,
}: WorkspaceBarProps) {
  const adminAccount = members.find((m) => m.role === 'admin');
  const memberAccounts = members.filter((m) => m.role === 'member');

  return (
    <div className="no-print border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
        {/* Role & Account Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-950">
            <button
              type="button"
              onClick={() => {
                if (activeMember.role === 'admin' && memberAccounts[0]) {
                  onChangeActiveMember(memberAccounts[0].id);
                }
              }}
              className={`min-h-[34px] rounded-md px-3 py-1 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                activeMember.role === 'member'
                  ? 'bg-teal-700 text-white dark:bg-teal-600'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              Mode Member
            </button>
            {adminAccount && (
              <button
                type="button"
                onClick={() => onChangeActiveMember(adminAccount.id)}
                className={`min-h-[34px] rounded-md px-3 py-1 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  activeMember.role === 'admin'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                Mode Admin
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="active-account-select" className="sr-only">
              Pilih akun aktif
            </label>
            <Users className="h-4 w-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
            <select
              id="active-account-select"
              value={activeMember.id}
              onChange={(e) => onChangeActiveMember(e.target.value)}
              className="min-h-[36px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role === 'admin' ? 'Admin Pustakawan' : m.tier})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onOpenMemberCard}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 whitespace-nowrap shrink-0 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            <UserCheck className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400" aria-hidden="true" />
            Kartu &amp; Daftar Anggota
          </button>
        </div>

        {/* Accessibility & Live Stream Telemetry */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span
              aria-hidden="true"
              className={`h-2 w-2 rounded-full ${
                streamConnected ? 'bg-emerald-600' : 'bg-amber-500'
              }`}
            />
            <span className="whitespace-nowrap">
              {streamConnected ? 'Sinkronisasi Real-Time' : 'Menyambungkan...'}
            </span>
          </div>

          <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
            |
          </span>

          <button
            type="button"
            onClick={onToggleLargeText}
            aria-pressed={largeText}
            title="Ubah ukuran huruf untuk keterbacaan lebih mudah"
            className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
              largeText
                ? 'border-teal-600 bg-teal-50 text-teal-800 dark:border-teal-500 dark:bg-teal-950/60 dark:text-teal-300'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900'
            }`}
          >
            <Type className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{largeText ? 'Teks Besar: Aktif' : 'Teks Besar'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleDarkMode}
            aria-pressed={darkMode}
            aria-label={darkMode ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
            className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
