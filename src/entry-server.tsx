import { renderToString } from 'react-dom/server';
import { App } from './App';

// Re-exported so scripts/prerender.mts can read business data straight from
// the built server bundle without a separate ts loader.
export { site } from './config/site';

export function render(): string {
  return renderToString(<App />);
}
