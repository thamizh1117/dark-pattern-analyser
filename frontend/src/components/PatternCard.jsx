import React from 'react';
import { 
  AlertTriangle, ShieldAlert, CheckCircle, Lightbulb, 
  Tag, Search, Layers, ChevronRight 
} from 'lucide-react';

export default function PatternCard({ pattern }) {
  const isHighRisk = pattern.risk_level === 'High Risk';
  const confidenceColor = {
    High: 'badge-conf-high',
    Medium: 'badge-conf-med',
    Low: 'badge-conf-low'
  }[pattern.confidence] || 'badge-conf-med';

  const categoryColorClass = pattern.category.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`pattern-card ${isHighRisk ? 'border-high-risk' : 'border-mod-risk'}`}>
      {/* Header */}
      <div className="pattern-card-header">
        <div className="pattern-title-group">
          <span className={`pattern-category-pill ${categoryColorClass}`}>
            {pattern.category}
          </span>
          <span className={`pattern-risk-pill ${isHighRisk ? 'risk-high' : 'risk-mod'}`}>
            <AlertTriangle className="w-3.5 h-3.5 mr-1 inline" />
            {pattern.risk_level}
          </span>
        </div>

        <div className="pattern-confidence-group">
          <span className="confidence-label">Confidence:</span>
          <span className={`confidence-badge ${confidenceColor}`}>
            {pattern.confidence}
          </span>
        </div>
      </div>

      {/* Matched Text Section (Requirement 5) */}
      <div className="matched-text-box">
        <div className="matched-box-label">
          <Search className="w-3.5 h-3.5 mr-1 inline text-slate-400" />
          Detected Trigger Phrase(s) in OCR Text:
        </div>
        <div className="matched-chips-list">
          {pattern.matched_snippets && pattern.matched_snippets.map((snippet, idx) => (
            <span key={idx} className="matched-phrase-chip">
              "{snippet}"
            </span>
          ))}
        </div>

        {/* Detailed Context Snippets */}
        {pattern.matches && pattern.matches.length > 0 && (
          <div className="context-snippets-wrap">
            {pattern.matches.map((m, idx) => (
              <div key={idx} className="context-snippet-line">
                <span className="context-prefix">Context:</span>
                <span className="context-text">{m.context}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Explanation of Why Pattern is Deceptive */}
      <div className="pattern-body-section">
        <div className="explanation-title">
          <ShieldAlert className="w-4 h-4 mr-1 inline text-rose-400" />
          Deception Mechanism & User Impact:
        </div>
        <p className="explanation-text">{pattern.explanation}</p>
      </div>

      {/* Ethical UX Recommendation */}
      <div className="recommendation-box">
        <div className="rec-header">
          <Lightbulb className="w-4 h-4 mr-1 inline text-amber-400" />
          Ethical UX Recommendation:
        </div>
        <p className="rec-text">{pattern.recommendation}</p>
      </div>

      {/* Footer Heuristic Tag */}
      <div className="pattern-card-footer">
        <span className="heuristic-tag">
          <Tag className="w-3 h-3 mr-1 inline" />
          {pattern.heuristic_type || 'Transparent Lexical Rule'}
        </span>
        <span className="disclaimer-mini">
          Rule-based heuristic indicator
        </span>
      </div>
    </div>
  );
}
