import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { App } from './App';
import { Cursor } from './components/Cursor';
import './styles/global.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element (#root) not found');
}

// Cursor is rendered as a sibling of <App/> (not inside it, which is frozen)
// in both this entry point and entry-server.tsx, so the hydrated tree shape
// always matches what was server-rendered.
const app = (
  <StrictMode>
    <App />
    <Cursor />
  </StrictMode>
);

if (container.hasChildNodes()) {
  hydrateRoot(container, app);
} else {
  createRoot(container).render(app);
}
