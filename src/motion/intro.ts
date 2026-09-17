/**
 * Tiny pub/sub for "the intro reveal is over" (docs/BRIEF.md §6.1).
 *
 * A plain `window` CustomEvent is not enough on its own: IntroReveal sits
 * above Hero in the tree, so its effect can fire before Hero has subscribed.
 * The module remembers that it already happened and replays it for late
 * subscribers, while still dispatching the event for anything outside React.
 */
export const INTRO_DONE_EVENT = 'jovan:intro-done';

let done = false;
const listeners = new Set<() => void>();

export function markIntroDone(): void {
  if (done) return;
  done = true;
  for (const listener of [...listeners]) listener();
  listeners.clear();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(INTRO_DONE_EVENT));
  }
}

/** Runs `callback` once — immediately if the intro is already finished. */
export function onIntroDone(callback: () => void): () => void {
  if (done) {
    callback();
    return () => {};
  }
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function introWasSeen(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return Boolean(sessionStorage.getItem('jovanIntroSeen'));
  } catch {
    return false;
  }
}

export function rememberIntro(): void {
  try {
    sessionStorage.setItem('jovanIntroSeen', '1');
  } catch {
    /* private mode / storage disabled — the intro simply plays again */
  }
}
