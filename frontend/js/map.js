(async function(){
  const L = window.L;
  const socket = io();
  const map = L.map('map').setView([20.0, 78.0], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

  const markers = {};

  function addMarker(issue){
    if (!issue.location) return;
    // Expect location as 'lat,lng' or object
    let lat, lng;
    if (typeof issue.location === 'string'){
      const parts = issue.location.split(','); lat = parseFloat(parts[0]); lng = parseFloat(parts[1]);
    } else if (issue.location.latitude) { lat = issue.location.latitude; lng = issue.location.longitude; }
    if (!lat || !lng) return;
    const m = L.marker([lat,lng]).addTo(map).bindPopup(`<b>${issue.title}</b><br>${issue.address||''}`);
    markers[issue._id] = m;
  }

  // fetch existing issues (minimal)
  const res = await fetch('/api/issues');
  const issues = await res.json();
  issues.forEach(addMarker);

  socket.on('new_issue', (issue)=>{ addMarker(issue); });
  socket.on('status_update', (data)=>{
    const m = markers[data.reportId];
    if (m) {
      m.bindPopup(m.getPopup().getContent() + `<br><em>Status: ${data.status}</em>`);
    }
  });

})();