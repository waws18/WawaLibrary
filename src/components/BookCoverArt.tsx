import { useState } from 'react';
import { BookOpen } from 'lucide-react';

interface BookCoverArtProps {
  src: string;
  title: string;
  author: string;
  tone?: string;
  className?: string;
}

export function BookCoverArt({
  src,
  title,
  author,
  tone = '#0f766e',
  className = '',
}: BookCoverArtProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`relative flex flex-col justify-between overflow-hidden rounded-lg border border-slate-200 p-4 text-white dark:border-slate-800 ${className}`}
        style={{ backgroundColor: tone }}
        role="img"
        aria-label={`Sampul buku ${title} oleh ${author}`}
      >
        <div className="flex items-center justify-between opacity-80">
          <span className="font-mono text-[11px] tracking-wider">WONU PRESS</span>
          <BookOpen className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="my-auto space-y-2 py-4">
          <p className="font-display text-base font-semibold leading-snug text-white line-clamp-3">
            {title}
          </p>
          <p className="text-xs text-white/80 line-clamp-1">{author}</p>
        </div>
        <div className="h-px w-full bg-white/25" />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      <img
        src={src}
        alt={`Sampul buku ${title} oleh ${author}`}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      />
    </div>
  );
}
