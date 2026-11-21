import React, { useState } from 'react';
import { 
  History, Search, Trash2, Eye, ShieldCheck, AlertTriangle, 
  Calendar, FileText, Image as ImageIcon, Filter 
} from 'lucide-react';

export default function HistoryTable({
  historyList = [],
  onSelectScan,
  onDeleteScan,
  isLoading
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState('ALL');

  const filteredList = historyList.filter(item => {
    const matchesSearch = 
      item.filename?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.clean_text?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterRisk === 'ALL') return matchesSearch;
    if (filterRisk === 'CLEAN') return matchesSearch && item.patterns_count === 0;
    if (filterRisk === 'FLAGGED') return matchesSearch && item.patterns_count > 0;
    if (filterRisk === 'HIGH') return matchesSearch && item.highest_risk === 'High Risk';
    return matchesSearch;
  });

  return (
    <div className="history-container">
      {/* Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">Audit History (SQLite Database)</h2>
          <p className="section-subtitle">
            Search, review, and inspect past screenshot scans and copy evaluations
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="history-controls-bar">
        <div className="search-input-wrap">
          <Search className="w-4 h-4 search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by filename or extracted text keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-buttons-group">
          <span className="filter-label">
            <Filter className="w-3.5 h-3.5 mr-1 inline" /> Filter:
          </span>
          <button
            className={`filter-btn ${filterRisk === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterRisk('ALL')}
          >
            All ({historyList.length})
          </button>
          <button
            className={`filter-btn ${filterRisk === 'FLAGGED' ? 'active' : ''}`}
            onClick={() => setFilterRisk('FLAGGED')}
          >
            Flagged ({historyList.filter(h => h.patterns_count > 0).length})
          </button>
          <button
            className={`filter-btn ${filterRisk === 'CLEAN' ? 'active' : ''}`}
            onClick={() => setFilterRisk('CLEAN')}
          >
            Clean ({historyList.filter(h => h.patterns_count === 0).length})
          </button>
          <button
            className={`filter-btn ${filterRisk === 'HIGH' ? 'active' : ''}`}
            onClick={() => setFilterRisk('HIGH')}
          >
            High Risk ({historyList.filter(h => h.highest_risk === 'High Risk').length})
          </button>
        </div>
      </div>

      {/* Table / List */}
      {filteredList.length === 0 ? (
        <div className="history-empty-card">
          <History className="w-12 h-12 text-slate-500 mb-3" />
          <div className="empty-title">No Scan Records Found</div>
          <p className="empty-desc">
            {searchQuery || filterRisk !== 'ALL'
              ? 'No records match your search query or filter criteria.'
              : 'Analyze a screenshot or paste copy to populate your persistent history.'}
          </p>
        </div>
      ) : (
        <div className="history-table-wrapper">
          <table className="history-table">
            <thead>
              <tr>
                <th>Scan ID</th>
                <th>Target & Type</th>
                <th>Scan Date</th>
                <th>Patterns Detected</th>
                <th>Risk Level</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((item) => {
                const isClean = item.patterns_count === 0;
                const isHigh = item.highest_risk === 'High Risk';

                return (
                  <tr key={item.id} className="history-row">
                    <td className="id-cell">
                      <span className="id-badge">#{item.id}</span>
                    </td>

                    <td className="target-cell">
                      <div className="target-flex">
                        {item.image_path ? (
                          <img
                            src={item.image_path}
                            alt=""
                            className="history-thumb"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="text-thumb-icon">
                            <FileText className="w-4 h-4 text-slate-400" />
                          </div>
                        )}
                        <div className="target-details">
                          <div className="target-name" title={item.filename}>
                            {item.filename}
                          </div>
                          <div className="target-snippet">
                            {item.clean_text
                              ? item.clean_text.substring(0, 70) + '...'
                              : 'No extracted text'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="date-cell">
                      <span className="date-text">
                        <Calendar className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                        {item.uploaded_at}
                      </span>
                    </td>

                    <td className="count-cell">
                      {isClean ? (
                        <span className="clean-pill">
                          <ShieldCheck className="w-3 h-3 mr-1 inline" /> 0 (Clean)
                        </span>
                      ) : (
                        <span className="patterns-count-pill">
                          {item.patterns_count} detected
                        </span>
                      )}
                    </td>

                    <td className="risk-cell">
                      <span
                        className={`risk-pill ${
                          isClean
                            ? 'risk-clean'
                            : isHigh
                            ? 'risk-high'
                            : 'risk-mod'
                        }`}
                      >
                        {isClean ? 'Clean UI' : item.highest_risk}
                      </span>
                    </td>

                    <td className="actions-cell">
                      <button
                        className="action-btn view-btn"
                        onClick={() => onSelectScan(item.id)}
                        title="View Full Scan Details"
                      >
                        <Eye className="w-4 h-4 mr-1 inline" />
                        Inspect
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => onDeleteScan(item.id)}
                        title="Delete from SQLite database"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
