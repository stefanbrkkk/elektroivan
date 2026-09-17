import type { ReactNode } from 'react';

/** Total number of blueprint sheets (hero … footer). */
export const SHEETS = 10;

export interface SectionHeaderProps {
  /** Sheet number, 1-based (docs/DESIGN.md §3). */
  sheet: number;
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  /** Heading level for the title; the hero passes its own h1 elsewhere. */
  as?: 'h2' | 'h3';
  align?: 'left' | 'center';
  className?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Blueprint "sheet" chrome shared by every section: mono sheet label with a
 * rule, display title, optional intro. Purely static markup (SSR-safe);
 * sections animate it themselves if they want to.
 */
export function SectionHeader({ sheet, eyebrow, title, intro, as = 'h2', align = 'left', className = '' }: SectionHeaderProps) {
  const Title = as;
  return (
    <header className={`sheet-header ${align === 'center' ? 'sheet-header--center' : ''} ${className}`.trim()}>
      <p className="sheet-label font-mono">
        <span className="sr-only">{`List ${pad(sheet)} od ${pad(SHEETS)}: `}</span>
        <span className="sheet-label__word" aria-hidden="true">List</span>
        <span className="sheet-label__num" aria-hidden="true">{pad(sheet)}</span>
        <span className="sheet-label__sep" aria-hidden="true">/</span>
        <span className="sheet-label__total" aria-hidden="true">{pad(SHEETS)}</span>
        <span className="sheet-label__rule" aria-hidden="true" />
        <span className="sheet-label__eyebrow">{eyebrow}</span>
      </p>
      <Title className="sheet-title font-display">{title}</Title>
      {intro ? <p className="sheet-intro">{intro}</p> : null}
    </header>
  );
}
