import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import './index.css';

const kok = document.getElementById('root');

if (!kok) {
  throw new Error('#root bulunamadı; index.html bozulmuş olabilir.');
}

createRoot(kok).render(
  <StrictMode>
    {/* Tema en dışta: giriş ekranı dahil her rotayı kapsasın. */}
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
