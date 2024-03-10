import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('contents') as HTMLElement;
const root = createRoot(container);
root.render(<App />);
