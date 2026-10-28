import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register service worker immediately for PWA capability and offline asset caching
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(<App />);
