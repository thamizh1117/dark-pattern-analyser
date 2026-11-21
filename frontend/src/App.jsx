import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import BannerAlert from './components/BannerAlert';
import UploadSection from './components/UploadSection';
import AnalysisViewer from './components/AnalysisViewer';
import DashboardSummary from './components/DashboardSummary';
import HistoryTable from './components/HistoryTable';
import { 
  fetchHealth, fetchSamples, fetchAnalytics, fetchHistory, 
  fetchScanById, deleteScanRecord, analyzeImageFile, 
  analyzeSampleImage, analyzeRawText 
} from './api';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('inspector'); // 'inspector' | 'dashboard' | 'history'
  const [healthInfo, setHealthInfo] = useState(null);
  const [samples, setSamples] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  
  // Current analysis state
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [appError, setAppError] = useState(null);

  // Initial data loading
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [hData, sData, aData, histData] = await Promise.allSettled([
        fetchHealth(),
        fetchSamples(),
        fetchAnalytics(),
        fetchHistory(50)
      ]);

      if (hData.status === 'fulfilled') setHealthInfo(hData.value);
      if (sData.status === 'fulfilled') setSamples(sData.value.samples || []);
      if (aData.status === 'fulfilled') setAnalytics(aData.value);
      if (histData.status === 'fulfilled') setHistoryList(histData.value.scans || []);
    } catch (err) {
      console.error('Error initializing application data:', err);
    }
  };

  const refreshAnalyticsAndHistory = async () => {
    try {
      const [aData, histData] = await Promise.all([
        fetchAnalytics(),
        fetchHistory(50)
      ]);
      setAnalytics(aData);
      setHistoryList(histData.scans || []);
    } catch (err) {
      console.error('Failed to refresh stats:', err);
    }
  };

  // Upload and analyze screenshot file
  const handleAnalyzeFile = async (file) => {
    setIsLoading(true);
    setAppError(null);
    setLoadingStep('Uploading screenshot to server...');

    try {
      setTimeout(() => setLoadingStep('Preprocessing image with OpenCV (CLAHE & Bilateral Filter)...'), 500);
      setTimeout(() => setLoadingStep('Extracting text via Optical Character Recognition (pytesseract)...'), 1200);
      setTimeout(() => setLoadingStep('Matching explainable dark pattern heuristics & saving to SQLite...'), 2000);

      const result = await analyzeImageFile(file);
      setCurrentAnalysis(result);
      setActiveTab('inspector');
      await refreshAnalyticsAndHistory();
    } catch (err) {
      setAppError(err.message || 'Image analysis failed');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  // Analyze pre-bundled demonstration sample
  const handleAnalyzeSample = async (sampleId) => {
    setIsLoading(true);
    setAppError(null);
    setLoadingStep('Loading demo screenshot & running heuristic audit...');

    try {
      const result = await analyzeSampleImage(sampleId);
      setCurrentAnalysis(result);
      setActiveTab('inspector');
      await refreshAnalyticsAndHistory();
    } catch (err) {
      setAppError(err.message || 'Sample analysis failed');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  // Direct text copy analysis
  const handleAnalyzeText = async (text, title) => {
    setIsLoading(true);
    setAppError(null);
    setLoadingStep('Evaluating copy against 5 dark pattern rule categories...');

    try {
      const result = await analyzeRawText(text, title);
      setCurrentAnalysis(result);
      setActiveTab('inspector');
      await refreshAnalyticsAndHistory();
    } catch (err) {
      setAppError(err.message || 'Text analysis failed');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  // Select scan from history
  const handleSelectHistoryScan = async (scanId) => {
    setIsLoading(true);
    setAppError(null);
    try {
      const data = await fetchScanById(scanId);
      if (data && data.scan) {
        const s = data.scan;
        setCurrentAnalysis({
          scan_id: s.id,
          filename: s.filename,
          image_url: s.image_path,
          file_size_kb: s.file_size_kb,
          ocr_info: {
            success: true,
            engine: s.ocr_engine_status,
            tesseract_installed: healthInfo?.tesseract?.installed
          },
          extracted_text: s.raw_text,
          bounding_boxes: [],
          analysis: s.analysis
        });
        setActiveTab('inspector');
      }
    } catch (err) {
      setAppError(err.message || 'Failed to retrieve scan record');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete scan from SQLite history
  const handleDeleteScan = async (scanId) => {
    try {
      await deleteScanRecord(scanId);
      if (currentAnalysis?.scan_id === scanId) {
        setCurrentAnalysis(null);
      }
      await refreshAnalyticsAndHistory();
    } catch (err) {
      setAppError(err.message || 'Failed to delete scan record');
    }
  };

  return (
    <div className="app-root">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        healthInfo={healthInfo}
      />

      <main className="main-content">
        <div className="content-container">
          {/* Methodology and System Alerts */}
          <BannerAlert healthInfo={healthInfo} />

          {/* Error Banner */}
          {appError && (
            <div className="app-error-banner">
              <span>{appError}</span>
              <button className="dismiss-btn" onClick={() => setAppError(null)}>
                &times;
              </button>
            </div>
          )}

          {/* Tab 1: Visual Inspector / Upload */}
          {activeTab === 'inspector' && (
            <div className="tab-pane-view">
              {currentAnalysis ? (
                <AnalysisViewer
                  analysisData={currentAnalysis}
                  onReset={() => setCurrentAnalysis(null)}
                />
              ) : (
                <UploadSection
                  onAnalyzeFile={handleAnalyzeFile}
                  onAnalyzeSample={handleAnalyzeSample}
                  onAnalyzeText={handleAnalyzeText}
                  samples={samples}
                  isLoading={isLoading}
                  loadingStep={loadingStep}
                />
              )}
            </div>
          )}

          {/* Tab 2: Analytics Dashboard */}
          {activeTab === 'dashboard' && (
            <div className="tab-pane-view">
              <DashboardSummary
                analytics={analytics}
                onSelectSample={handleAnalyzeSample}
              />
            </div>
          )}

          {/* Tab 3: SQLite History Table */}
          {activeTab === 'history' && (
            <div className="tab-pane-view">
              <HistoryTable
                historyList={historyList}
                onSelectScan={handleSelectHistoryScan}
                onDeleteScan={handleDeleteScan}
                isLoading={isLoading}
              />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <div>
            <strong>Dark Pattern Visualizer</strong> &bull; Explainable Heuristic Deception Detection
          </div>
          <div className="footer-tech-stack">
            <span>React.js</span> &bull; 
            <span>Python Flask</span> &bull; 
            <span>OpenCV</span> &bull; 
            <span>Pillow</span> &bull; 
            <span>pytesseract</span> &bull; 
            <span>SQLite</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
