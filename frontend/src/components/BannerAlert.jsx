import React, { useState } from 'react';
import { Info, AlertTriangle, ChevronDown, ChevronUp, Terminal, ShieldCheck } from 'lucide-react';

export default function BannerAlert({ healthInfo }) {
  const [showTessGuide, setShowTessGuide] = useState(false);
  const tesseractInstalled = healthInfo?.tesseract?.installed;

  return (
    <div className="banner-alert-stack">
      {/* Explainable Methodology Disclaimer Banner */}
      <div className="alert-card info-card">
        <div className="alert-icon-col">
          <Info className="w-5 h-5 text-indigo-400" />
        </div>
        <div className="alert-body">
          <div className="alert-heading">
            <strong>Methodology Notice:</strong> Transparent Heuristic-Based Analysis
          </div>
          <div className="alert-text">
            This tool uses deterministic keyword and regular expression rules to flag common
            lexical tropes associated with manipulative UI design (False Urgency, Hidden Costs,
            Confirm Shaming, Forced Action, Trick Questions). These results are{' '}
            <strong>preliminary heuristic indicators</strong> intended to guide UX audits,{' '}
            <em>not legal determinations or definitive proof of intentional deception</em>.
          </div>
        </div>
      </div>

      {/* Tesseract OCR status guide banner if not installed */}
      {!tesseractInstalled && healthInfo && (
        <div className="alert-card warning-card">
          <div className="alert-icon-col">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="alert-body">
            <div className="alert-header-row">
              <span className="alert-heading">
                <strong>System Notice:</strong> Tesseract OCR engine binary not detected on system PATH.
              </span>
              <button
                className="guide-toggle-btn"
                onClick={() => setShowTessGuide(!showTessGuide)}
              >
                {showTessGuide ? (
                  <>Hide Setup Guide <ChevronUp className="w-4 h-4 ml-1" /></>
                ) : (
                  <>Show Install Instructions <ChevronDown className="w-4 h-4 ml-1" /></>
                )}
              </button>
            </div>
            <div className="alert-text">
              You can still test and analyze all 6 pre-bundled demo screenshots (which use verified ground-truth text) or analyze custom text directly. To enable live OCR for custom screenshot uploads on Windows:
            </div>

            {showTessGuide && (
              <div className="terminal-guide">
                <div className="terminal-title">
                  <Terminal className="w-4 h-4 inline mr-1 text-slate-400" />
                  Install Tesseract OCR on Windows:
                </div>
                <pre className="code-block">
                  <code>winget install UB-Mannheim.TesseractOCR</code>
                </pre>
                <div className="guide-note">
                  Or download the installer from:{' '}
                  <a
                    href="https://github.com/UB-Mannheim/tesseract/wiki"
                    target="_blank"
                    rel="noreferrer"
                    className="guide-link"
                  >
                    https://github.com/UB-Mannheim/tesseract/wiki
                  </a>
                  . Default path: <code>C:\Program Files\Tesseract-OCR\tesseract.exe</code>.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
