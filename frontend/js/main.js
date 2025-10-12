// Require login for all feature pages except index.html
const protectedPages = [
    'dashboard.html',
    'report.html',
    'profile.html',
    'settings.html'
];
const currentPage = window.location.pathname.split('/').pop();
if (protectedPages.includes(currentPage)) {
    if (!localStorage.getItem('isLoggedIn')) {
        window.location.href = 'login.html';
    }
}
// Feature box click navigation
document.addEventListener('DOMContentLoaded', function() {
    // Feature box navigation
    document.querySelectorAll('.box[data-link]').forEach(function(box) {
        box.style.cursor = 'pointer';
        box.addEventListener('click', function() {
            const link = box.getAttribute('data-link');
            if (link) {
                window.location.href = link;
            }
        });
    });

    // Dynamic department/issue dropdowns
    const departmentSelect = document.getElementById('department');
    const issueTypeSelect = document.getElementById('issueType');
    const departmentIssues = {
        PWD: ['Pothole', 'Broken Footpath', 'Damaged Road', 'Blocked Drain'],
        Electricity: ['Power Outage', 'Streetlight Not Working', 'Exposed Wires', 'Electric Pole Issue'],
        Water: ['Water Leakage', 'No Water Supply', 'Contaminated Water', 'Sewage Overflow'],
        Traffic: ['Signal Not Working', 'Illegal Parking', 'Accident Spot', 'Traffic Jam']
    };
    if (departmentSelect && issueTypeSelect) {
        departmentSelect.addEventListener('change', function() {
            const dept = departmentSelect.value;
            issueTypeSelect.innerHTML = '<option value="" disabled selected>Select Issue</option>';
            if (departmentIssues[dept]) {
                departmentIssues[dept].forEach(function(issue) {
                    const opt = document.createElement('option');
                    opt.value = issue;
                    opt.textContent = issue;
                    issueTypeSelect.appendChild(opt);
                });
                issueTypeSelect.disabled = false;
            } else {
                issueTypeSelect.disabled = true;
            }
        });
    }

    // Live camera photo capture
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const captureBtn = document.getElementById('captureBtn');
    const photoPreview = document.getElementById('photoPreview');
    const imageDataInput = document.getElementById('imageData');
    if (video && captureBtn && canvas && photoPreview && imageDataInput) {
        let cameraStream = null;
        captureBtn.addEventListener('click', async function() {
            if (!cameraStream) {
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    try {
                        cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
                        video.srcObject = cameraStream;
                        video.classList.add('show');
                        video.play();
                        captureBtn.textContent = 'Capture Photo';
                    } catch (err) {
                        captureBtn.disabled = true;
                        captureBtn.textContent = 'Camera not available';
                    }
                } else {
                    captureBtn.disabled = true;
                    captureBtn.textContent = 'Camera not supported';
                }
                return;
            }
            // Capture photo
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/png');
            photoPreview.src = dataUrl;
            photoPreview.classList.add('show');
            imageDataInput.value = dataUrl;
            video.classList.remove('show');
            // Move button below photo
            photoPreview.parentNode.appendChild(captureBtn);
            // Stop camera after capture
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
                cameraStream = null;
                captureBtn.textContent = 'Take Photo';
            }
        });
    }

    // Geolocation for location using Leaflet.js for map and Nominatim for address
    const getLocationBtn = document.getElementById('getLocationBtn');
    const locationDisplay = document.getElementById('locationDisplay');
    const locationInput = document.getElementById('location');
    const addressDisplay = document.getElementById('addressDisplay');
    const miniMap = document.getElementById('miniMap');
    let selectedAddress = '';
    if (getLocationBtn && locationDisplay && locationInput) {
        getLocationBtn.addEventListener('click', function() {
            if (navigator.geolocation) {
                locationDisplay.textContent = 'Getting location...';
                if (addressDisplay) addressDisplay.textContent = '';
                if (typeof miniMap !== 'undefined' && miniMap) miniMap.innerHTML = '';
                navigator.geolocation.getCurrentPosition(function(pos) {
                    const lat = pos.coords.latitude;
                    const lon = pos.coords.longitude;
                    const coords = lat.toFixed(8) + ', ' + lon.toFixed(8);
                    locationInput.value = coords;
                    // Fetch address using Nominatim
                    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
                        .then(res => res.json())
                        .then(data => {
                            if (data && data.display_name) {
                                if (addressDisplay) addressDisplay.textContent = data.display_name;
                                locationDisplay.textContent = data.display_name;
                                selectedAddress = data.display_name;
                            } else {
                                if (addressDisplay) addressDisplay.textContent = 'Address not found';
                                locationDisplay.textContent = coords;
                                selectedAddress = coords;
                            }
                        })
                        .catch(() => {
                            if (addressDisplay) addressDisplay.textContent = 'Address lookup failed';
                            locationDisplay.textContent = coords;
                            selectedAddress = coords;
                        });
                    // Show OpenStreetMap static iframe
                    if (typeof miniMap !== 'undefined' && miniMap) {
                        const zoom = 17;
                        const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lon-0.001},${lat-0.001},${lon+0.001},${lat+0.001}&layer=mapnik&marker=${lat},${lon}`;
                        miniMap.innerHTML = `<iframe width='100%' height='180' frameborder='0' scrolling='no' marginheight='0' marginwidth='0' src='${src}' style='border-radius:8px;'></iframe>`;
                    }
                }, function(err) {
                    locationDisplay.textContent = 'Location unavailable';
                    if (addressDisplay) addressDisplay.textContent = '';
                    if (typeof miniMap !== 'undefined' && miniMap) miniMap.innerHTML = '';
                    selectedAddress = '';
                }, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                });
            } else {
                locationDisplay.textContent = 'Geolocation not supported';
                if (addressDisplay) addressDisplay.textContent = '';
                if (typeof miniMap !== 'undefined' && miniMap) miniMap.innerHTML = '';
                selectedAddress = '';
            }
        });
    }

    // Issue form submission (on report.html)
    const form = document.getElementById('issueForm');
    const message = document.getElementById('message');
    if (form && message) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('title').value.trim();
            const description = document.getElementById('description').value.trim();
            const department = departmentSelect ? departmentSelect.value : '';
            const issueType = issueTypeSelect ? issueTypeSelect.value : '';
            const location = locationInput ? locationInput.value.trim() : '';
            const address = selectedAddress || (addressDisplay ? addressDisplay.textContent : '');
            const imageURL = imageDataInput ? imageDataInput.value : '';
            // Validate dropdowns are not at default
            if (!title || !description || !department || department === '' || department === 'Select Department' || !issueType || issueType === '' || issueType === 'Select Issue' || !location) {
                message.textContent = "Please fill all required fields, select department/issue, take a photo, and select your location.";
                return;
            }
            const category = department + ' - ' + issueType;
            const issueData = { title, description, category, location, address, imageURL };
            try {
                const res = await fetch('http://localhost:3000/api/issues', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(issueData)
                });
                if (res.ok) {
                    message.textContent = "Issue submitted successfully!";
                    form.reset();
                    if (issueTypeSelect) issueTypeSelect.disabled = true;
                    // Reset UI for photo, location, address, map
                    if (photoPreview) {
                        photoPreview.src = '';
                        photoPreview.classList.remove('show');
                    }
                    if (video) video.classList.remove('show');
                    if (locationDisplay) locationDisplay.textContent = 'No location selected';
                    if (addressDisplay) addressDisplay.textContent = '';
                    if (typeof miniMap !== 'undefined' && miniMap) miniMap.innerHTML = '';
                    selectedAddress = '';
                } else {
                    message.textContent = "Error submitting issue.";
                }
            } catch (err) {
                message.textContent = "Server error.";
            }
        });
    }

    // Fetch and display issues (on dashboard.html)
    const issuesList = document.getElementById('issuesList');
    if (issuesList) {
        fetch('http://localhost:3000/api/issues')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    issuesList.innerHTML = data.map(issue => {
                        let imageBlock = '';
                        if (issue.imageURL && issue.imageURL.startsWith('data:image')) {
                            imageBlock = `<img src="${issue.imageURL}" alt="Issue Photo" style="width:100%;max-width:180px;border-radius:8px;margin-bottom:8px;">`;
                        }
                        let locationText = issue.address ? issue.address : issue.location;
                        return `
                        <div class="issue-card">
                            ${imageBlock}
                            <h3>${issue.title}</h3>
                            <p><strong>Category:</strong> ${issue.category}</p>
                            <p><strong>Location:</strong> ${locationText}</p>
                            <p><strong>Status:</strong> ${issue.status}</p>
                            <p>${issue.description}</p>
                        </div>
                        `;
                    }).join('');
                } else {
                    issuesList.textContent = 'No issues reported yet.';
                }
            })
            .catch(() => {
                issuesList.textContent = 'Failed to load issues.';
            });
    }
});
