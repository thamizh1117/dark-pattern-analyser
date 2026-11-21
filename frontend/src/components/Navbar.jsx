import React from 'react';
import { Eye, ShieldAlert, BarChart3, History, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, healthInfo }) {
  const isHealthy = healthInfo?.status === 'healthy';
  const tesseractInstalled = healthInfo?.tesseract?.installed;

  return (
    <header className="navbar-container">
      <div className="navbar-inner">
        <div className="navbar-brand" onClick={() => setActiveTab('inspector')}>
          <div className="brand-logo-icon">
            <Eye className="w-6 h-6 text-indigo-400" />
            <ShieldAlert className="brand-badge-icon" />
          </div>
          <div>
            <div className="brand-title">Dark Pattern Visualizer</div>
            <div className="brand-subtitle">Explainable UI Deception Detection & Heuristic Audit</div>
          </div>
        </div>

        <nav className="navbar-nav">
          <button
            className={`nav-btn ${activeTab === 'inspector' ? 'active' : ''}`}
            onClick={() => setActiveTab('inspector')}
          >
            <Eye className="w-4 h-4 inline-icon" />
            Visual Inspector
          </button>
          <button
            className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <BarChart3 className="w-4 h-4 inline-icon" />
            Analytics Dashboard
          </button>
          <button
            className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History className="w-4 h-4 inline-icon" />
            Scan History
          </button>
        </nav>

        <div className="navbar-status">
          <div className="status-badge" title={isHealthy ? 'Flask API Online' : 'Connecting to API...'}>
            <span className={`status-dot ${isHealthy ? 'green' : 'amber'}`}></span>
            API: {isHealthy ? 'Connected' : 'Connecting...'}
          </div>

          <div
            className={`status-badge ${tesseractInstalled ? 'tess-ok' : 'tess-notice'}`}
            title={
              tesseractInstalled
                ? `Tesseract OCR v${healthInfo?.tesseract?.version || 'Active'}`
                : 'Tesseract OCR binary not detected on PATH. Using demo ground-truth fallback for bundled samples.'
            }
          >
            {tesseractInstalled ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                OCR: Tesseract Active
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mr-1" />
                OCR: Demo / Direct Mode
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
