import React from 'react';
import ReactDOM from 'react-dom/client';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import App from './App';
import '@ionic/react/css/core.css';
import './theme/variables.css';

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);

// Call the element loader after the platform has been bootstrapped
defineCustomElements(window);