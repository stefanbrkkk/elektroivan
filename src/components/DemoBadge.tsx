import { site } from '../config/site';

interface DemoBadgeProps {
  className?: string;
}

/** Small mono pill marking demo data (stats, testimonials) as non-real. */
export function DemoBadge({ className }: DemoBadgeProps) {
  const classes = ['badge-demo', className].filter(Boolean).join(' ');
  return (
    <span className={classes}>
      {site.ui.demoBadge}
    </span>
  );
}
