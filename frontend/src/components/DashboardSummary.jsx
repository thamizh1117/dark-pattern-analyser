import React from 'react';
import { 
  BarChart3, ShieldCheck, AlertOctagon, AlertTriangle, 
  Clock, DollarSign, HeartCrack, Lock, HelpCircle, Layers
} from 'lucide-react';

const CATEGORY_META = {
  'False Urgency': {
    icon: Clock,
    color: '#f43f5e',
    bgColor: 'rgba(244, 63, 94, 0.1)',
    desc: 'Artificial countdowns, fake stock shortages, or inflated peer counters forcing rushed checkout.'
  },
  'Hidden Costs': {
    icon: DollarSign,
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    desc: 'Undisclosed convenience fees, stealth handling charges, or non-obvious recurring billing.'
  },
  'Confirm Shaming': {
    icon: HeartCrack,
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    desc: 'Guilt-tripping or emotionally manipulative opt-out copy that shames users into consent.'
  },
  'Forced Action': {
    icon: Lock,
    color: '#ec4899',
    bgColor: 'rgba(236, 72, 153, 0.1)',
    desc: 'Mandatory phone submissions, forced notifications, or survey gates to unlock standard content.'
  },
  'Trick Questions': {
    icon: HelpCircle,
    color: '#06b6d4',
    bgColor: 'rgba(6, 182, 212, 0.1)',
    desc: 'Double-negative checkboxes and inverted opt-out semantics that deceive user intent.'
  }
};

export default function DashboardSummary({ analytics, onSelectSample }) {
  const totalScans = analytics?.total_scans || 0;
  const cleanScans = analytics?.clean_scans || 0;
  const flaggedScans = analytics?.flagged_scans || 0;
  const totalPatterns = analytics?.total_patterns_detected || 0;

  const cleanPercent = totalScans > 0 ? Math.round((cleanScans / totalScans) * 100) : 0;
  const flaggedPercent = totalScans > 0 ? Math.round((flaggedScans / totalScans) * 100) : 0;

  const categoryCounts = analytics?.category_counts || {
    'False Urgency': 0,
    'Hidden Costs': 0,
    'Confirm Shaming': 0,
    'Forced Action': 0,
    'Trick Questions': 0
  };

  const maxCategoryCount = Math.max(1, ...Object.values(categoryCounts));

  return (
    <div className="dashboard-container">
      {/* Top Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">Deceptive UI Pattern Intelligence Dashboard</h2>
          <p className="section-subtitle">
            Aggregate statistics and heuristic pattern distribution from analyzed interfaces
          </p>
        </div>
      </div>

      {/* 4 Primary Summary Cards */}
      <div className="metric-cards-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Total Analyzed</span>
            <div className="metric-icon-wrap blue">
              <Layers className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div className="metric-value">{totalScans}</div>
          <div className="metric-subtext">Screenshots & text inputs recorded in SQLite</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Flagged Interfaces</span>
            <div className="metric-icon-wrap red">
              <AlertOctagon className="w-5 h-5 text-rose-400" />
            </div>
          </div>
          <div className="metric-value text-rose-400">{flaggedScans}</div>
          <div className="metric-subtext">
            {flaggedPercent}% of scans contained dark pattern triggers
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Clean Interfaces</span>
            <div className="metric-icon-wrap green">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div className="metric-value text-emerald-400">{cleanScans}</div>
          <div className="metric-subtext">
            {cleanPercent}% passed with zero deceptive triggers
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Deceptive Signals</span>
            <div className="metric-icon-wrap amber">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div className="metric-value text-amber-400">{totalPatterns}</div>
          <div className="metric-subtext">Total individual heuristic matches across scans</div>
        </div>
      </div>

      {/* Category Breakdown & Risk Distribution Grid */}
      <div className="dashboard-charts-grid">
        {/* Category Breakdown */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Detection Frequency by Pattern Category</h3>
            <span className="chart-tag">5 Required Categories</span>
          </div>

          <div className="category-bars-list">
            {Object.entries(CATEGORY_META).map(([catName, meta]) => {
              const count = categoryCounts[catName] || 0;
              const barPercent = Math.round((count / maxCategoryCount) * 100);
              const IconComp = meta.icon;

              return (
                <div key={catName} className="category-bar-row">
                  <div className="cat-row-header">
                    <div className="cat-row-name">
                      <span className="cat-icon-badge" style={{ backgroundColor: meta.bgColor }}>
                        <IconComp className="w-4 h-4" style={{ color: meta.color }} />
                      </span>
                      <strong>{catName}</strong>
                    </div>
                    <div className="cat-row-count">
                      <span className="count-num">{count}</span> signals
                    </div>
                  </div>
                  <div className="cat-progress-track">
                    <div
                      className="cat-progress-fill"
                      style={{
                        width: `${Math.max(barPercent, count > 0 ? 8 : 0)}%`,
                        backgroundColor: meta.color
                      }}
                    ></div>
                  </div>
                  <div className="cat-desc">{meta.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Explainability & Criteria Matrix */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Pattern Definitions & Heuristic Criteria</h3>
            <span className="chart-tag">Detection Rules</span>
          </div>

          <div className="rules-reference-list">
            <div className="rule-ref-item">
              <div className="rule-ref-badge urgency">False Urgency</div>
              <p>
                Looks for artificial scarcity phrases (<code>only X left</code>, <code>deal expires in</code>)
                or exaggerated FOMO cues intended to short-circuit deliberate consumer evaluation.
              </p>
            </div>

            <div className="rule-ref-item">
              <div className="rule-ref-badge costs">Hidden Costs</div>
              <p>
                Identifies drip pricing terms (<code>mandatory fee</code>, <code>convenience charge</code>)
                and hidden auto-renewing subscriptions (<code>charged monthly after trial</code>).
              </p>
            </div>

            <div className="rule-ref-item">
              <div className="rule-ref-badge shaming">Confirm Shaming</div>
              <p>
                Detects derogatory opt-out text designed to manipulate emotion (
                <code>no thanks, i hate saving money</code>, <code>i prefer paying full price</code>).
              </p>
            </div>

            <div className="rule-ref-item">
              <div className="rule-ref-badge forced">Forced Action</div>
              <p>
                Flags arbitrary friction walls (<code>enter phone number to continue</code>, <code>allow notifications to proceed</code>)
                blocking access to standard content.
              </p>
            </div>

            <div className="rule-ref-item">
              <div className="rule-ref-badge trick">Trick Questions</div>
              <p>
                Captures confusing double negatives in consent boxes (
                <code>uncheck if you do not wish to opt-out</code>).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
