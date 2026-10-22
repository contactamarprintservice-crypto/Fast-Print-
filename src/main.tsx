import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initNetlifyFallback } from './utils/netlifyFallback.ts';

// Enable Netlify SPA client fallback for static deployments
initNetlifyFallback();

createRoot(document.getElementById('root')!).render(<App />);
