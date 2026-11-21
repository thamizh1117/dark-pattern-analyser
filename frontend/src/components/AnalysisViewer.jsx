import React, { useState } from 'react';
import { 
  CheckCircle2, AlertOctagon, AlertTriangle, FileText, 
  Copy, Check, Image as ImageIcon, ArrowLeft, ShieldCheck, 
  ExternalLink, Layers, Info
} from 'lucide-react';
import PatternCard from './PatternCard';

export default function AnalysisViewer({ analysisData, onReset }) {
  const [activeTab, setActiveTab] = useState('patterns'); // 'patterns' | 'ocr'
  const [copied, setCopied] = useState(false);

  if (!analysisData) return null;

  const {
    scan_id,
    filename,
    image_url,
    file_size_kb,
    ocr_info,
    extracted_text,
    analysis
  } = analysisData;

  const totalPatterns = analysis?.total_patterns || 0;
  const isClean = analysis?.clean_ui || totalPatterns === 0;
  const highestRisk = analysis?.highest_risk || 'None';
  const patterns = analysis?.patterns || [];

  const handleCopyText = () => {
    if (extracted_text) {
      navigator.clipboard.writeText(extracted_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Helper to highlight matched phrases in OCR text
  const renderHighlightedText = () => {
    if (!extracted_text) {
      return <em className="text-slate-400">No text was extracted from this image.</em>;
    }

    // Gather all phrases to highlight
    const phrasesToHighlight = [];
    patterns.forEach(p => {
      if (p.matched_snippets) {
        phrasesToHighlight.push(...p.matched_snippets);
      }
    });

    if (phrasesToHighlight.length === 0) {
      return <span>{extracted_text}</span>;
    }

    // Create regex matching any of the phrases
    const escaped = phrasesToHighlight
      .map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = extracted_text.split(regex);

    return (
      <div className="ocr-text-content">
        {parts.map((part, i) => {
          const isMatch = phrasesToHighlight.some(
            phrase => phrase.toLowerCase() === part.toLowerCase()
          );
          if (isMatch) {
            return (
              <mark key={i} className="highlighted-token">
                {part}
              </mark>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </div>
    );
  };

  return (
    <div className="analysis-viewer-container">
      {/* Top Action & Overview Bar */}
      <div className="viewer-top-bar">
        <button className="back-btn" onClick={onReset}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Inspect Another Screenshot
        </button>

        <div className="viewer-file-meta">
          <span className="file-pill">
            <ImageIcon className="w-3.5 h-3.5 mr-1 text-slate-400" />
            {filename}
          </span>
          {file_size_kb > 0 && <span className="meta-pill">{file_size_kb} KB</span>}
          {scan_id && <span className="meta-pill">Scan ID #{scan_id}</span>}
        </div>
      </div>

      {/* Main Status Alert Banner */}
      {isClean ? (
        /* Requirement 7: Show a clear message when no suspicious keywords are detected */
        <div className="clean-status-card">
          <div className="clean-icon-wrap">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <div className="clean-text-wrap">
            <div className="clean-title">Clean Interface Detected</div>
            <p className="clean-description">
              No suspicious dark pattern keywords or deceptive UI structures were detected in this
              screenshot. The examined text adheres to transparent, ethical design guidelines.
            </p>
            <div className="clean-badges-row">
              <span className="clean-badge">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Zero Deceptive Heuristics Triggered
              </span>
              <span className="clean-badge">
                Transparent Opt-In / Affirmative Consent
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flagged-status-card">
          <div className="flagged-icon-wrap">
            <AlertOctagon className="w-8 h-8 text-rose-400" />
          </div>
          <div className="flagged-text-wrap">
            <div className="flagged-title">
              {totalPatterns} Potential Deceptive Pattern Signal{totalPatterns > 1 ? 's' : ''} Flagged
            </div>
            <p className="flagged-description">{analysis?.summary}</p>
            <div className="flagged-badges-row">
              <span className="risk-badge-large">
                <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                Overall Risk: {highestRisk}
              </span>
              {analysis?.categories_found?.map(cat => (
                <span key={cat} className="category-pill-active">
                  {cat}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* OCR Engine Notice if applicable */}
      {ocr_info?.notice && (
        <div className="ocr-notice-bar">
          <Info className="w-4 h-4 text-indigo-400 mr-2 flex-shrink-0" />
          <span>{ocr_info.notice}</span>
        </div>
      )}

      {/* Two Column Layout: Screenshot Preview & Details */}
      <div className="viewer-grid">
        {/* Left Column: Screenshot Preview (Requirement 2) */}
        <div className="preview-pane-card">
          <div className="pane-header">
            <h3 className="pane-title">
              <ImageIcon className="w-4 h-4 mr-1.5 text-indigo-400" />
              Screenshot Preview
            </h3>
            {image_url && (
              <a
                href={image_url}
                target="_blank"
                rel="noreferrer"
                className="pane-link"
                title="Open image in full view"
              >
                Full Resolution <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </a>
            )}
          </div>

          <div className="screenshot-canvas-wrapper">
            {image_url ? (
              <div className="image-relative-container">
                <img
                  src={image_url}
                  alt={filename || 'Screenshot Preview'}
                  className="preview-image"
                />
              </div>
            ) : (
              <div className="no-image-placeholder">
                <FileText className="w-12 h-12 text-slate-500 mb-2" />
                <p>Direct Text Input (No Image Uploaded)</p>
              </div>
            )}
          </div>

          <div className="pane-footer-caption">
            <span>OCR Extraction: {ocr_info?.engine || 'Direct Input'}</span>
            {analysis?.patterns?.length > 0 && (
              <span className="text-amber-400 font-medium">
                {analysis.patterns.length} pattern signal(s) mapped
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Tabbed Results (Detected Patterns & OCR Text) */}
        <div className="details-pane-card">
          {/* Navigation Tabs */}
          <div className="details-tabs-header">
            <button
              className={`details-tab ${activeTab === 'patterns' ? 'active' : ''}`}
              onClick={() => setActiveTab('patterns')}
            >
              <AlertTriangle className="w-4 h-4 mr-1.5" />
              Detected Patterns ({totalPatterns})
            </button>
            <button
              className={`details-tab ${activeTab === 'ocr' ? 'active' : ''}`}
              onClick={() => setActiveTab('ocr')}
            >
              <FileText className="w-4 h-4 mr-1.5" />
              Extracted OCR Text
            </button>
          </div>

          <div className="details-tab-content">
            {activeTab === 'patterns' ? (
              <div className="patterns-tab-view">
                {isClean ? (
                  <div className="clean-patterns-box">
                    <ShieldCheck className="w-12 h-12 text-emerald-400 mb-3" />
                    <h4>All Checks Passed</h4>
                    <p>
                      No keywords associated with False Urgency, Hidden Costs, Confirm Shaming,
                      Forced Action, or Trick Questions were triggered in this design.
                    </p>
                  </div>
                ) : (
                  <div className="patterns-stack">
                    {patterns.map((p, idx) => (
                      <PatternCard key={p.id || idx} pattern={p} />
                    ))}
                  </div>
                )}

                {/* Explainable Disclaimer */}
                <div className="methodology-disclaimer-box">
                  <p>
                    <strong>Note:</strong> {analysis?.disclaimer}
                  </p>
                </div>
              </div>
            ) : (
              /* Requirement 6: Display extracted OCR text */
              <div className="ocr-tab-view">
                <div className="ocr-actions-bar">
                  <div className="ocr-stats">
                    <span>
                      {extracted_text ? extracted_text.trim().split(/\s+/).length : 0} words
                    </span>
                    &bull;
                    <span>{extracted_text ? extracted_text.length : 0} characters</span>
                  </div>

                  <button className="copy-btn" onClick={handleCopyText}>
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                        Copied to Clipboard!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 mr-1" />
                        Copy Extracted Text
                      </>
                    )}
                  </button>
                </div>

                <div className="ocr-text-scrollbox">
                  {renderHighlightedText()}
                </div>

                <div className="ocr-legend">
                  <span className="legend-label">Highlight Legend:</span>
                  <span className="legend-chip">
                    <span className="legend-color-box"></span> Deceptive Keyword Matches
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
