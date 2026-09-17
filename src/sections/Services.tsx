import { useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { site, type Service } from '../config/site';
import { useFinePointer } from '../hooks/useFinePointer';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { gsap, useGSAP } from '../motion/motion';

// 4-column bento at ≥1024px: lg (2x2) + three md (2x1) + two sm (1x1) sum to
// exactly 12 cells = a full 4x3 grid with `grid-auto-flow: dense`.
const SIZE_CLASSES: Record<Service['size'], string> = {
  lg: 'sm:col-span-2 lg:col-span-2 lg:row-span-2',
  md: 'sm:col-span-2 lg:col-span-2',
  sm: 'sm:col-span-1 lg:col-span-1',
};

const ICON_CLASSES: Record<Service['id'], string> = {
  emergency: 'icon-emergency',
  panel: 'icon-panel',
  wiring: 'icon-wiring',
  lighting: 'icon-lighting',
  appliances: 'icon-appliances',
  diagnostics: 'icon-diagnostics',
};

// Six purpose-made icons, each with a fine-pointer-only hover/focus
// micro-animation defined in src/styles/global.css: breaker lever flips
// (panel), bulb lights (lighting), plug enters socket (appliances), meter
// needle moves (diagnostics), bolt + sparks (emergency), current flows
// through the wire (wiring).
const ICONS: Record<Service['id'], ReactNode> = {
  emergency: (
    <>
      <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" fill="var(--color-volt)" />
      <circle className="spark" cx="20" cy="6" r="1.4" fill="var(--color-arc)" />
      <circle className="spark" cx="6" cy="18" r="1" fill="var(--color-arc)" />
    </>
  ),
  panel: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" fill="none" stroke="var(--color-volt)" strokeWidth="1.5" />
      <path d="M8 8h3M8 16h3" stroke="var(--color-volt)" strokeWidth="1.5" strokeLinecap="round" />
      <g className="lever">
        <rect x="8" y="10.5" width="3" height="5" rx="1" fill="var(--color-arc)" />
      </g>
      <path d="M13 8h3M13 16h3" stroke="var(--color-volt)" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  wiring: (
    <>
      {/* Always-visible base wire; the brighter overlay only reveals a
          "current flowing" sweep on hover (fine pointer), so touch/reduced
          motion see the same fully-drawn icon. */}
      <path
        d="M4 6c4 0 2 6 6 6s2-6 6-6 2 6 6 6"
        fill="none"
        stroke="var(--color-volt)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        className="wire-flow"
        d="M4 6c4 0 2 6 6 6s2-6 6-6 2 6 6 6"
        fill="none"
        stroke="var(--color-arc)"
        strokeWidth="1.5"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1}
      />
    </>
  ),
  lighting: (
    <>
      <circle cx="12" cy="10" r="6" fill="none" stroke="var(--color-volt)" strokeWidth="1.5" />
      <circle className="bulb-glow" cx="12" cy="10" r="4" fill="var(--color-volt-hi)" />
      <path d="M9 20h6M10 22h4" stroke="var(--color-volt)" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  appliances: (
    <>
      <rect x="13" y="9" width="8" height="6" rx="1.5" fill="none" stroke="var(--color-volt)" strokeWidth="1.5" />
      <g className="plug">
        <path d="M3 12h8" stroke="var(--color-volt)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M6 8v3M9 8v3" stroke="var(--color-arc)" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </>
  ),
  diagnostics: (
    <>
      <circle cx="12" cy="14" r="7" fill="none" stroke="var(--color-volt)" strokeWidth="1.5" />
      <path d="M8 14a4 4 0 0 1 8 0" stroke="var(--color-line)" strokeWidth="1" fill="none" />
      <line className="needle" x1="12" y1="15" x2="12" y2="10" stroke="var(--color-arc)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="15" r="1.2" fill="var(--color-arc)" />
    </>
  ),
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

interface ServiceCardProps {
  service: Service;
}

function ServiceCard({ service }: ServiceCardProps) {
  const cardRef = useRef<HTMLElement>(null);
  const finePointer = useFinePointer();
  const reducedMotion = usePrefersReducedMotion();
  // Tilt + spotlight are continuous pointer-driven motion (BRIEF §5.2 removes
  // this outright under reduced motion), so gate on both conditions, not
  // fine-pointer alone.
  const interactive = finePointer && !reducedMotion;

  function handlePointerMove(event: ReactPointerEvent<HTMLElement>) {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const px = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const py = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    const rotateY = clamp((px - 0.5) * 12, -6, 6);
    const rotateX = clamp((0.5 - py) * 12, -6, 6);
    card.style.setProperty('--tilt-x', `${rotateX}deg`);
    card.style.setProperty('--tilt-y', `${rotateY}deg`);
    card.style.setProperty('--spot-x', `${px * 100}%`);
    card.style.setProperty('--spot-y', `${py * 100}%`);
  }

  function handlePointerLeave() {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty('--tilt-x', '0deg');
    card.style.setProperty('--tilt-y', '0deg');
  }

  return (
    <article
      ref={cardRef}
      tabIndex={0}
      data-testid="service-card"
      onPointerMove={interactive ? handlePointerMove : undefined}
      onPointerLeave={interactive ? handlePointerLeave : undefined}
      className={`service-card focus-ring glass relative flex flex-col justify-between p-6 ${SIZE_CLASSES[service.size]}`}
    >
      <span className="spotlight" aria-hidden="true" />
      {/* The pointer-tilt transform is scoped to this small, naturally-sized
          wrapper around just the icon — never to a flex/percentage-height
          container. Applying rotateX/rotateY to a `flex h-full` box inside a
          narrow CSS Grid cell triggers a genuine Chromium sizing bug for
          descendant SVGs (verified independent of GSAP); a tightly-sized
          wrapper sidesteps it entirely. */}
      <div
        className="tilt-wrapper relative z-[1] inline-block"
        style={interactive ? { transform: 'perspective(900px) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg))' } : undefined}
      >
        <svg className={ICON_CLASSES[service.id]} width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
          {ICONS[service.id]}
        </svg>
      </div>
      <div className="relative z-[1] mt-4">
        <h3 className="font-display text-lg font-semibold text-text">{service.title}</h3>
        <p className="mt-2 text-sm text-muted">{service.description}</p>
      </div>
    </article>
  );
}

/**
 * Asymmetric bento grid of six services (docs/BRIEF.md §6.6): 1 column
 * below 640px, 2 columns from 640px, the full 4-column bento from 1024px.
 * Cards reveal with a stagger on scroll-in (skipped under reduced motion,
 * which renders every card visible up front).
 */
export function Services() {
  const gridRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useGSAP(
    () => {
      if (reducedMotion) return;
      const cards = gridRef.current?.querySelectorAll<HTMLElement>('.service-card');
      if (!cards || cards.length === 0) return;
      gsap.fromTo(
        cards,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'expo.out',
          stagger: 0.08,
          scrollTrigger: { trigger: gridRef.current, start: 'top 85%', once: true },
        }
      );
    },
    { dependencies: [reducedMotion], scope: gridRef }
  );

  return (
    <section id="usluge" data-testid="section-services" className="section">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <p className="font-mono text-xs uppercase tracking-widest text-arc">{site.services.eyebrow}</p>
        <h2 className="mt-2 font-display text-3xl font-bold text-text md:text-5xl">{site.services.title}</h2>
        <p className="mt-4 max-w-2xl text-muted">{site.services.intro}</p>

        <div
          ref={gridRef}
          className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-flow-dense lg:auto-rows-[minmax(11rem,auto)] lg:grid-cols-4"
        >
          {site.services.items.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </div>
    </section>
  );
}
