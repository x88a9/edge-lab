import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/tailwind.css';
import App from './App';
import { AuthProvider } from './auth/AuthContext';
import { PortfolioProvider } from './context/PortfolioContext';
import { AdminInspectionProvider } from './context/AdminInspectionContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <AdminInspectionProvider>
          <PortfolioProvider>
            <App />
          </PortfolioProvider>
        </AdminInspectionProvider>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
