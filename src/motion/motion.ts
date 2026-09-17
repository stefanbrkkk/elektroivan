// Single registration point for every GSAP plugin used on the site.
// Everything else imports gsap/plugins/EASE from here — never from 'gsap' directly.
//
// NOTE: `gsap/all` has no type declarations in gsap 3.15 (implicit `any`,
// see docs/DECISIONS.md), so plugins are imported from their individual
// subpaths instead — this typechecks cleanly under `strict`.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, MotionPathPlugin, useGSAP);

export { gsap, ScrollTrigger, SplitText, DrawSVGPlugin, MotionPathPlugin, useGSAP };

export const EASE = {
  out: 'expo.out',
  quart: 'quart.out',
} as const;
