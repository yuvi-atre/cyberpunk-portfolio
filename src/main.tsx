import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

// Note: StrictMode is intentionally omitted — its double-mount in dev would
// churn the Phaser WebGL context on every reload.
ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
