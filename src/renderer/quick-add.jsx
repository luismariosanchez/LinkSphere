import { createRoot } from 'react-dom/client';
import { QuickAddApp } from './QuickAddApp.js';
import './styles/theme.css';
import './styles.css';
import './styles/quick-add.css';

const root = document.getElementById('root');

if (root) {
  createRoot(root).render(<QuickAddApp />);
}
