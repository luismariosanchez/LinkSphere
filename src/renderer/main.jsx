import { createRoot } from 'react-dom/client';
import { App } from './App.js';
import './styles/theme.css';
import './styles.css';
import './styles/dashboard-theme.css';

const root = document.getElementById('root');

if (root) {
  createRoot(root).render(<App />);
}
