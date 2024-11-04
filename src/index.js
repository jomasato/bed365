import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import ArbitrageAnalyzer from './components/ArbitrageAnalyzer';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-gray-900">
            bed-365🛌
          </h1>
        </div>
      </header>
      <main>
        <ArbitrageAnalyzer />
      </main>
    </div>
  </React.StrictMode>
);