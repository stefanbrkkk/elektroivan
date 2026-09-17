import { renderToString } from 'react-dom/server';
import { App } from './App';
import { Cursor } from './components/Cursor';

// Re-exported so scripts/prerender.mts can read business data straight from
// the built server bundle without a separate ts loader.
export { site } from './config/site';

// Cursor renders null on the server (matchMedia is unavailable), but keeping
// it in the tree here mirrors main.tsx exactly so hydration never mismatches.
export function render(): string {
  return renderToString(
    <>
      <App />
      <Cursor />
    </>
  );
}
