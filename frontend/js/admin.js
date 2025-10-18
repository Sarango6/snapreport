(async function(){
  const token = localStorage.getItem('token');
  if (!token) { alert('Please login as admin'); window.location = '/login.html'; return; }

  async function fetchAnalytics(){
    const res = await fetch('/api/admin/analytics', { headers: { 'Authorization': 'Bearer '+token } });
    if (!res.ok) { console.error('analytics fetch failed', await res.text()); return; }
    return res.json();
  }

  const data = await fetchAnalytics();
  if (!data) return;

  const labels = data.byCategory.map(b=>b._id||'Unknown');
  const counts = data.byCategory.map(b=>b.count);

  const ctx = document.getElementById('byCategoryChart').getContext('2d');
  new Chart(ctx, { type: 'bar', data: { labels, datasets: [{ label: 'Issues by Category', data: counts, backgroundColor: 'rgba(75,192,192,0.4)' }] } });

  const statusCtx = document.getElementById('statusChart').getContext('2d');
  new Chart(statusCtx, { type: 'doughnut', data: { labels: ['Resolved','Other'], datasets: [{ data: [data.resolved, data.total - data.resolved], backgroundColor: ['#4caf50','#f44336'] }] } });

  document.getElementById('exportCsv').addEventListener('click', ()=>{ window.location = '/api/admin/export/csv?'; });
  document.getElementById('exportPdf').addEventListener('click', ()=>{ window.location = '/api/admin/export/pdf?'; });

})();