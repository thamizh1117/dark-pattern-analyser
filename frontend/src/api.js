/**
 * API client connecting React frontend to Flask backend
 */

export async function fetchHealth() {
  const res = await fetch('/api/health');
  if (!res.ok) throw new Error('Backend health check failed');
  return res.json();
}

export async function fetchSamples() {
  const res = await fetch('/api/samples');
  if (!res.ok) throw new Error('Failed to load demo samples');
  return res.json();
}

export async function fetchAnalytics() {
  const res = await fetch('/api/analytics');
  if (!res.ok) throw new Error('Failed to load analytics data');
  return res.json();
}

export async function fetchHistory(limit = 50) {
  const res = await fetch(`/api/history?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to load history');
  return res.json();
}

export async function fetchScanById(id) {
  const res = await fetch(`/api/history/${id}`);
  if (!res.ok) throw new Error(`Failed to load scan #${id}`);
  return res.json();
}

export async function deleteScanRecord(id) {
  const res = await fetch(`/api/history/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to delete scan #${id}`);
  return res.json();
}

export async function analyzeImageFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/analyze-image', {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Image analysis request failed');
  }
  return data;
}

export async function analyzeSampleImage(sampleId) {
  const res = await fetch('/api/analyze-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sample_id: sampleId }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Sample analysis failed');
  }
  return data;
}

export async function analyzeRawText(text, title = 'Custom Text Analysis') {
  const res = await fetch('/api/analyze-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, title }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Text analysis failed');
  }
  return data;
}
