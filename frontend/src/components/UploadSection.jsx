import React, { useState, useRef } from 'react';
import { 
  Upload, Image as ImageIcon, FileText, CheckCircle2, 
  AlertCircle, Sparkles, RefreshCw, ArrowRight 
} from 'lucide-react';

const SAMPLE_TEXT_PRESETS = [
  {
    name: 'False Urgency Copy',
    text: 'HURRY, LAST CHANCE! Only 2 items left in stock at this price! Deal expires in 04:59. 18 other shoppers are viewing this item right now! Order within 5 minutes to reserve your discount.'
  },
  {
    name: 'Confirm Shaming Copy',
    text: 'Claim your VIP 20% discount coupon today! [YES, APPLY DISCOUNT] No thanks, I hate saving money and prefer paying full price.'
  },
  {
    name: 'Hidden Costs Copy',
    text: 'Your cart total is $45.00. Additional mandatory convenience fee: $8.50. Handling fee: $4.00. Note: Automatically renews at $19.99 charged monthly after trial unless cancelled.'
  },
  {
    name: 'Forced Action Copy',
    text: 'Access Restricted. Required to proceed: Enter your phone number to continue reading this article. You must allow notifications to proceed.'
  },
  {
    name: 'Trick Questions Copy',
    text: 'Newsletter Preferences: [X] Uncheck this box if you do not wish to opt-out of receiving daily promotional emails from third-party partners.'
  },
  {
    name: 'Clean Ethical Copy',
    text: 'Subscribe to our monthly developer newsletter. We respect your privacy. No spam. You can unsubscribe at any time with one click.'
  }
];

export default function UploadSection({
  onAnalyzeFile,
  onAnalyzeSample,
  onAnalyzeText,
  samples = [],
  isLoading,
  loadingStep
}) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [inputMode, setInputMode] = useState('image'); // 'image' | 'text'
  const [customText, setCustomText] = useState('');
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (file) => {
    setFileError(null);
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    const validExts = ['.png', '.jpg', '.jpeg'];
    const hasValidExt = validExts.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!validTypes.includes(file.type) && !hasValidExt) {
      setFileError('Invalid file format. Please upload a PNG, JPG, or JPEG screenshot.');
      setSelectedFile(null);
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setFileError('File size exceeds 15 MB limit. Please select a smaller screenshot.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleStartAnalysis = () => {
    if (selectedFile) {
      onAnalyzeFile(selectedFile);
    }
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (customText.trim()) {
      onAnalyzeText(customText.trim(), 'Custom Copy Inspection');
    }
  };

  return (
    <div className="upload-wrapper">
      {/* Mode Switcher */}
      <div className="mode-toggle-bar">
        <button
          className={`mode-btn ${inputMode === 'image' ? 'active' : ''}`}
          onClick={() => setInputMode('image')}
          disabled={isLoading}
        >
          <ImageIcon className="w-4 h-4 mr-2" />
          Screenshot Image Analysis
        </button>
        <button
          className={`mode-btn ${inputMode === 'text' ? 'active' : ''}`}
          onClick={() => setInputMode('text')}
          disabled={isLoading}
        >
          <FileText className="w-4 h-4 mr-2" />
          Direct UI Copy Analysis
        </button>
      </div>

      {inputMode === 'image' ? (
        <div className="upload-box-container">
          {/* Drag & Drop Area */}
          <div
            className={`dropzone-card ${dragActive ? 'drag-active' : ''} ${selectedFile ? 'has-file' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !selectedFile && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,image/png,image/jpeg"
              style={{ display: 'none' }}
              onChange={handleFileChange}
              disabled={isLoading}
            />

            {isLoading ? (
              <div className="loading-state-box">
                <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin mb-3" />
                <div className="loading-title">Analyzing Screenshot...</div>
                <div className="loading-step-text">{loadingStep || 'Processing with OpenCV and pytesseract...'}</div>
                <div className="loading-bar-track">
                  <div className="loading-bar-indeterminate"></div>
                </div>
              </div>
            ) : selectedFile ? (
              <div className="selected-file-view">
                <div className="file-info-header">
                  <div className="file-icon-badge">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="file-meta">
                    <div className="file-name">{selectedFile.name}</div>
                    <div className="file-size">
                      {(selectedFile.size / 1024).toFixed(1)} KB &bull; {selectedFile.type || 'Image'}
                    </div>
                  </div>
                </div>

                <div className="file-action-buttons" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="btn btn-primary"
                    onClick={handleStartAnalysis}
                    disabled={isLoading}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Run Dark Pattern Heuristic Audit
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    disabled={isLoading}
                  >
                    Choose Different Image
                  </button>
                </div>
              </div>
            ) : (
              <div className="dropzone-empty-content">
                <div className="drop-icon-circle">
                  <Upload className="w-8 h-8 text-indigo-400" />
                </div>
                <div className="drop-primary-text">
                  Drag and drop a website screenshot here, or <span className="highlight-browse">browse files</span>
                </div>
                <div className="drop-sub-text">
                  Supports PNG, JPG, or JPEG formats up to 15 MB
                </div>
              </div>
            )}
          </div>

          {fileError && (
            <div className="upload-error-banner">
              <AlertCircle className="w-5 h-5 text-rose-400 mr-2 flex-shrink-0" />
              <span>{fileError}</span>
            </div>
          )}

          {/* Pre-bundled Demonstration Samples */}
          <div className="demo-samples-section">
            <div className="samples-header">
              <div className="samples-title">
                <Sparkles className="w-4 h-4 text-amber-400 inline mr-1" />
                Or Quick-Test Pre-bundled Demo Screenshots (1-Click)
              </div>
              <div className="samples-subtitle">
                Demonstrates each of the 5 deceptive categories plus a clean, ethical baseline
              </div>
            </div>

            <div className="samples-grid">
              {samples.map((sample) => (
                <div
                  key={sample.id}
                  className="sample-card"
                  onClick={() => !isLoading && onAnalyzeSample(sample.id)}
                >
                  <div className="sample-thumb-wrap">
                    <img
                      src={sample.image_url}
                      alt={sample.title}
                      className="sample-thumb"
                      loading="lazy"
                    />
                    <span className={`sample-category-tag ${sample.category.toLowerCase().replace(/\s+/g, '-')}`}>
                      {sample.category}
                    </span>
                  </div>
                  <div className="sample-content">
                    <div className="sample-card-title">{sample.title}</div>
                    <div className="sample-card-desc">{sample.description}</div>
                    <div className="sample-test-cta">
                      Analyze Sample <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Direct Text Mode */
        <div className="text-mode-card">
          <form onSubmit={handleTextSubmit}>
            <div className="text-mode-header">
              <label htmlFor="customCopyInput" className="text-mode-label">
                Inspect UI Copy, Modals, or Checkout Text:
              </label>
              <div className="sample-text-chips">
                <span className="chips-label">Quick Presets:</span>
                {SAMPLE_TEXT_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="preset-chip"
                    onClick={() => setCustomText(preset.text)}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              id="customCopyInput"
              rows={5}
              className="copy-textarea"
              placeholder="Paste button text, terms, countdown banners, or checkout fine print here..."
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              disabled={isLoading}
            />

            <div className="text-mode-footer">
              <span className="char-count">
                {customText.length} characters &bull; {customText.trim() ? customText.trim().split(/\s+/).length : 0} words
              </span>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading || !customText.trim()}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing Text...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze Text For Deceptive Signals
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
