// Consolidated frontend main script
// Handles: auth protection, navigation, profile menu, department dropdowns,
// camera capture, geolocation/address lookup, image previews (max 3), issue submission via FormData,
// and dashboard rendering of issues with images and address.


// --- Protect pages (require login) and restrict admin ---
const protectedPages = ['dashboard.html', 'report.html', 'profile.html', 'settings.html', 'admin.html'];
const currentPage = window.location.pathname.split('/').pop();
const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();
const userRole = user && user.role ? user.role : '';
if (protectedPages.includes(currentPage)) {
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'login.html';
    }
    // If needed, keep admins away from citizen-only report page
    if (userRole === 'Admin' && currentPage === 'report.html') {
        window.location.href = 'admin.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // --- Feature box click navigation ---
    document.querySelectorAll('.box[data-link]').forEach(box => {
        box.style.cursor = 'pointer';
        box.addEventListener('click', () => {
            const link = box.getAttribute('data-link');
            if (link) window.location.href = link;
        });
    });

        // Sidebar Toggle (does not affect profile dropdown or auth)
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');

    if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.toggle('active');
        document.body.classList.toggle('sidebar-open');
    });
    document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
        sidebar.classList.remove('active');
        document.body.classList.remove('sidebar-open');
        }
    });
    }


    // --- Profile / login UI ---
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const profileBtn = document.getElementById('profileBtn');
    const loginLink = document.querySelector('nav a[href="login.html"]');
    if (profileBtn) profileBtn.style.display = isLoggedIn ? 'inline-block' : 'none';
    if (loginLink) loginLink.style.display = isLoggedIn ? 'none' : 'inline-block';
    if (profileBtn) {
        const dropdown = profileBtn.querySelector('.dropdown');
        // Toggle dropdown on profileBtn click (anywhere in button)
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (dropdown) dropdown.classList.toggle('show');
        });
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!profileBtn.contains(e.target)) dropdown.classList.remove('show');
        });
        const logoutOpt = document.getElementById('logoutoption');
        if (logoutOpt) logoutOpt.addEventListener('click', e => { e.preventDefault(); localStorage.removeItem('isLoggedIn'); window.location.href = 'index.html'; });
        // Settings and Contact Us navigation
        const settingsOpt = profileBtn.querySelector('a[href="settings.html"]');
        if (settingsOpt) settingsOpt.addEventListener('click', e => { e.preventDefault(); window.location.href = 'settings.html'; });
        const contactOpt = profileBtn.querySelector('a[href="contactus.html"]');
        if (contactOpt) contactOpt.addEventListener('click', e => { e.preventDefault(); window.location.href = 'contactus.html'; });
    }

    // --- Department -> Issue dropdowns ---
    const departmentSelect = document.getElementById('department');
    const issueTypeSelect = document.getElementById('issueType');
    const departmentIssues = {
        PWD: ['Pothole', 'Broken Footpath', 'Damaged Road', 'Blocked Drain'],
        Electricity: ['Power Outage', 'Streetlight Not Working', 'Exposed Wires', 'Electric Pole Issue'],
        Water: ['Water Leakage', 'No Water Supply', 'Contaminated Water', 'Sewage Overflow'],
        Traffic: ['Signal Not Working', 'Illegal Parking', 'Accident Spot', 'Traffic Jam']
    };
    if (departmentSelect && issueTypeSelect) {
        departmentSelect.addEventListener('change', () => {
            const dept = departmentSelect.value;
            issueTypeSelect.innerHTML = '<option value="" disabled selected>Select Issue</option>';
            if (departmentIssues[dept]) {
                departmentIssues[dept].forEach(issue => { const opt = document.createElement('option'); opt.value = issue; opt.textContent = issue; issueTypeSelect.appendChild(opt); });
                issueTypeSelect.disabled = false;
            } else issueTypeSelect.disabled = true;
        });
    }

    // --- Camera capture ---
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const captureBtn = document.getElementById('captureBtn');
    const photoPreview = document.getElementById('photoPreview');
    const imageDataInput = document.getElementById('imageData');
    let cameraStream = null;
    if (video && canvas && captureBtn && photoPreview && imageDataInput) {
        captureBtn.addEventListener('click', async () => {
            if (!cameraStream) {
                try { cameraStream = await navigator.mediaDevices.getUserMedia({ video: true }); video.srcObject = cameraStream; video.play(); video.classList.add('show'); captureBtn.textContent = 'Capture Photo'; }
                catch (err) { captureBtn.disabled = true; captureBtn.textContent = 'Camera not available'; return; }
                return;
            }
            canvas.width = video.videoWidth; canvas.height = video.videoHeight; canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/png'); photoPreview.src = dataUrl; photoPreview.classList.add('show'); imageDataInput.value = dataUrl; video.classList.remove('show');
            cameraStream.getTracks().forEach(t => t.stop()); cameraStream = null; captureBtn.textContent = 'Take Photo';
        });
    }

    // --- Geolocation + OpenStreetMap iframe ---
    const getLocationBtn = document.getElementById('getLocationBtn');
    const locationDisplay = document.getElementById('locationDisplay');
    const locationInput = document.getElementById('location');
    const addressDisplay = document.getElementById('addressDisplay');
    const miniMap = document.getElementById('miniMap');
    let selectedAddress = '';
    if (getLocationBtn && locationDisplay && locationInput) {
        getLocationBtn.addEventListener('click', () => {
            if (!navigator.geolocation) { locationDisplay.textContent = 'Geolocation not supported'; return; }
            locationDisplay.textContent = 'Getting location...'; if (addressDisplay) addressDisplay.textContent = ''; if (miniMap) miniMap.innerHTML = '';
            navigator.geolocation.getCurrentPosition(async pos => {
                const lat = pos.coords.latitude; const lon = pos.coords.longitude; locationInput.value = `${lat.toFixed(8)}, ${lon.toFixed(8)}`;
                try { const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`); const data = await res.json(); selectedAddress = data.display_name || `${lat}, ${lon}`; if (addressDisplay) addressDisplay.textContent = selectedAddress; locationDisplay.textContent = selectedAddress; }
                catch { selectedAddress = `${lat}, ${lon}`; if (addressDisplay) addressDisplay.textContent = 'Address lookup failed'; locationDisplay.textContent = selectedAddress; }
                if (miniMap) { const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lon-0.001},${lat-0.001},${lon+0.001},${lat+0.001}&layer=mapnik&marker=${lat},${lon}`; miniMap.innerHTML = `<iframe width='100%' height='180' frameborder='0' scrolling='no' marginheight='0' marginwidth='0' src='${src}' style='border-radius:8px;'></iframe>`; }
            }, () => { locationDisplay.textContent = 'Location unavailable'; if (addressDisplay) addressDisplay.textContent = ''; }, { enableHighAccuracy: true, timeout: 10000 });
        });
    }

    // No file upload input: require live capture. imagePreviews holds the captured preview.
    const imagePreviews = document.getElementById('imagePreviews');

    // --- Issue form submission (multipart) ---
    const form = document.getElementById('issueForm');
    const message = document.getElementById('message');
    if (form && message) {
        form.addEventListener('submit', async e => {
            e.preventDefault();
            const title = document.getElementById('title').value.trim();
            const description = document.getElementById('description').value.trim();
            const department = departmentSelect ? departmentSelect.value : '';
            const issueType = issueTypeSelect ? issueTypeSelect.value : '';
            const location = locationInput ? locationInput.value.trim() : '';
            const address = selectedAddress || (addressDisplay ? addressDisplay.textContent : '');
            // require live-captured photo
            const capturedData = imageDataInput ? imageDataInput.value : '';
            if (!title || !description || !department || !issueType || !location) { message.textContent = 'Please fill all required fields.'; return; }
            if (!capturedData) { message.textContent = 'Please capture a live photo before submitting.'; return; }
            const category = `${department} - ${issueType}`;
            const fd = new FormData(); fd.append('title', title); fd.append('description', description); fd.append('category', category); fd.append('location', location); fd.append('address', address);
            // Attach reporter username for admin visibility (fallback to email if missing)
            try {
                const me = JSON.parse(localStorage.getItem('user'));
                if (me && me.username) fd.append('reporterUsername', me.username);
                else if (me && me.name) fd.append('reporterUsername', me.name);
                if (me && me.email) fd.append('reporterEmail', me.email);
            } catch {}
            // convert dataURL to Blob and append as 'image'
            function dataURLtoBlob(dataurl) {
                const arr = dataurl.split(',');
                const mime = arr[0].match(/:(.*?);/)[1];
                const bstr = atob(arr[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                while (n--) { u8arr[n] = bstr.charCodeAt(n); }
                return new Blob([u8arr], { type: mime });
            }
            try {
                const blob = dataURLtoBlob(capturedData);
                fd.append('image', blob, 'capture.png');
                // Also send dataURL as fallback for environments without Cloudinary
                fd.append('imageData', capturedData);
            } catch (e) { 
                console.error('Failed to append captured image', e); 
                // If blob conversion fails, at least send the raw dataURL
                try { if (capturedData) fd.append('imageData', capturedData); } catch {}
            }
            try {
                const base = window.API_BASE || '';
                const res = await fetch(base + '/api/issues', { method: 'POST', body: fd });
                if (res.ok) { message.style.color = 'green'; message.textContent = 'Issue submitted successfully!'; form.reset(); if (issueTypeSelect) issueTypeSelect.disabled = true; if (photoPreview) { photoPreview.src = ''; photoPreview.classList.remove('show'); } if (miniMap) miniMap.innerHTML = ''; if (addressDisplay) addressDisplay.textContent = ''; if (imagePreviews) imagePreviews.innerHTML = ''; selectedAddress = ''; }
                else { const d = await res.json(); message.style.color = 'red'; message.textContent = d.message || 'Error submitting issue.'; }
            } catch (err) { console.error(err); message.style.color = 'red'; message.textContent = 'Server error.'; }
        });
    }

    // --- Fetch & render issues (dashboard) ---
    const issuesList = document.getElementById('issuesList');
    // Get user role from localStorage (set on login)
    let userRole = '';
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        userRole = user && user.role ? user.role : '';
    } catch {}
    if (issuesList) {
    {
    const base = window.API_BASE || '';
    fetch(base + '/api/issues').then(r => r.json()).then(data => {
            // Sort latest first by createdAt
            const allIssues = Array.isArray(data) ? [...data].sort((a,b)=> new Date(b.createdAt||0) - new Date(a.createdAt||0)) : [];
            // Filter controls (visible to all users)
            const adminFilters = document.getElementById('adminFilters');
            const filterDept = document.getElementById('filterDept');
            const filterType = document.getElementById('filterType');
            const filterStatus = document.getElementById('filterStatus');
            const departmentIssues = {
                PWD: ['Pothole', 'Broken Footpath', 'Damaged Road', 'Blocked Drain'],
                Electricity: ['Power Outage', 'Streetlight Not Working', 'Exposed Wires', 'Electric Pole Issue'],
                Water: ['Water Leakage', 'No Water Supply', 'Contaminated Water', 'Sewage Overflow'],
                Traffic: ['Signal Not Working', 'Illegal Parking', 'Accident Spot', 'Traffic Jam']
            };
            if (adminFilters && filterDept && filterType) {
                adminFilters.style.display = 'flex';
                filterDept.addEventListener('change', function() {
                    const dept = filterDept.value;
                    filterType.innerHTML = '<option value="">All</option>';
                    if (departmentIssues[dept]) {
                        departmentIssues[dept].forEach(issue => {
                            const opt = document.createElement('option');
                            opt.value = issue;
                            opt.textContent = issue;
                            filterType.appendChild(opt);
                        });
                        filterType.disabled = false;
                    } else {
                        filterType.disabled = true;
                    }
                    renderIssues();
                });
                filterType.addEventListener('change', renderIssues);
                if (filterStatus) filterStatus.addEventListener('change', renderIssues);
            }
            function renderIssues() {
                let filtered = data;
                if (filterDept && filterType) {
                    const dept = filterDept.value;
                    const type = filterType.value;
                    const stat = filterStatus ? filterStatus.value : '';
                    if (dept) filtered = filtered.filter(issue => issue.category && issue.category.startsWith(dept));
                    if (type) filtered = filtered.filter(issue => issue.category && issue.category.endsWith(type));
                    if (stat) filtered = filtered.filter(issue => (issue.status||'Pending') === stat);
                }
                if (Array.isArray(filtered) && filtered.length) {
                    issuesList.innerHTML = filtered.map(issue => {
                        let imgs = '';
                        if (issue.images && issue.images.length) imgs = issue.images.map(u => `<img src="${u}" style="max-width:160px;border-radius:8px;margin-bottom:8px;margin-right:6px;">`).join('');
                        let resImgs = '';
                        if (Array.isArray(issue.resolutionImages) && issue.resolutionImages.length) {
                            const thumbs = issue.resolutionImages.map(u => `<img src="${u}" style="max-width:160px;border-radius:8px;margin-bottom:8px;margin-right:6px;">`).join('');
                            resImgs = `<div style="margin-top:8px;"><strong>Resolution Photos:</strong></div><div>${thumbs}</div>`;
                        }
                        const locText = issue.address || issue.location || '';
                        const status = issue.status || 'Pending';
                        const statusClass = status === 'Rejected' ? 'rejected' : (status === 'In Progress' ? 'accepted' : '');
                        let adminControls = '';
                        if (userRole === 'Admin' || userRole === 'Authority') {
                            const selectDisabled = status === 'Rejected' ? 'disabled' : '';
                            const choiceBtns = status === 'Pending' ? `
                                <button class="accept-btn" data-id="${issue._id}">Accept</button>
                                <button class="reject-btn" data-id="${issue._id}">Reject</button>
                            ` : '';
                            adminControls = `
                            <div class="admin-controls">
                                <label>Status:
                                    <select class="status-select" data-id="${issue._id}" ${selectDisabled}>
                                        <option value="Pending" ${status==='Pending'?'selected':''}>Pending</option>
                                        <option value="In Progress" ${status==='In Progress'?'selected':''}>In Progress</option>
                                        <option value="Resolved" ${status==='Resolved'?'selected':''}>Resolved</option>
                                        <option value="Rejected" ${status==='Rejected'?'selected':''}>Rejected</option>
                                    </select>
                                </label>
                                ${choiceBtns}
                            </div>`;
                        }
                        const remarkHtml = (status === 'Rejected' && issue.rejectionRemark) ? `<p class="remark"><strong>Remark:</strong> ${issue.rejectionRemark}</p>` : '';
                        return `<div class="issue-card ${statusClass}">${imgs}${resImgs}<h3>${issue.title}</h3><p><strong>Category:</strong> ${issue.category || ''}</p><p><strong>Location:</strong> ${locText}</p><p><strong>Status:</strong> ${status}</p><p>${issue.description || ''}</p>${remarkHtml}${adminControls}</div>`;
                    }).join('');
                    // Add event listeners for admin controls
                    if (userRole === 'Admin' || userRole === 'Authority') {
                        document.querySelectorAll('.status-select').forEach(sel => {
                            sel.addEventListener('change', async function(){
                                const id = this.getAttribute('data-id');
                                const status = this.value;
                                const token = localStorage.getItem('token');
                                let body = { status };
                                if (status === 'Rejected') {
                                    const remark = prompt('Enter rejection remark:');
                                    if (remark === null) { this.value = 'Pending'; return; }
                                    body.rejectionRemark = remark || '';
                                } else {
                                    body.rejectionRemark = '';
                                }
                                const base = window.API_BASE || '';
                                await fetch(base + `/api/issues/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer '+token }, body: JSON.stringify(body) });
                                location.reload();
                            });
                        });
                        document.querySelectorAll('.accept-btn').forEach(btn => {
                            btn.addEventListener('click', async function(){
                                const id = this.getAttribute('data-id');
                                const token = localStorage.getItem('token');
                                const base = window.API_BASE || '';
                                await fetch(base + `/api/issues/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer '+token }, body: JSON.stringify({ status: 'In Progress', rejectionRemark: '' }) });
                                location.reload();
                            });
                        });
                        document.querySelectorAll('.reject-btn').forEach(btn => {
                            btn.addEventListener('click', async function(){
                                const id = this.getAttribute('data-id');
                                const token = localStorage.getItem('token');
                                const remark = prompt('Enter rejection remark:');
                                if (remark === null) return;
                                const base = window.API_BASE || '';
                                await fetch(base + `/api/issues/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer '+token }, body: JSON.stringify({ status: 'Rejected', rejectionRemark: remark || '' }) });
                                location.reload();
                            });
                        });
                    }
                } else issuesList.textContent = 'No issues reported yet.';
            }
            renderIssues();
    }).catch(err => { console.error(err); issuesList.textContent = 'Failed to load issues.'; });
    }
    }

});
