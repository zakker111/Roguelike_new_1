import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';

createRoot(document.getElementById('root')!, {
  onRecoverableError(error: unknown) {
    // Gracefully catch and log recoverable concurrent render fallbacks
    // without letting unhandled uncaught error events bubble to parent iframes
    console.warn('[React Concurrency Recovery]:', error);
  },
}).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
