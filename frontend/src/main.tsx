import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const kok = document.getElementById('root');

if (!kok) {
  throw new Error('#root bulunamadı; index.html bozulmuş olabilir.');
}

createRoot(kok).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
