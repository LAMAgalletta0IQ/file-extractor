import App from './App.svelte';
import './styles.css';

// Disabilita menu contestuale
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  return false;
});

// Disabilita dev tools shortcuts solo in produzione
if (import.meta.env.PROD) {
  document.addEventListener('keydown', (e) => {
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && e.key === 'I') ||
      (e.ctrlKey && e.shiftKey && e.key === 'C') ||
      (e.ctrlKey && e.shiftKey && e.key === 'J') ||
      (e.ctrlKey && e.key === 'u')
    ) {
      e.preventDefault();
      return false;
    }
  });
}

// Force dark theme
document.documentElement.setAttribute('data-theme', 'dark');
document.documentElement.classList.add('dark');

const app = new App({
  target: document.getElementById('app')!,
});

export default app;
