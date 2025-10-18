// js/leaderboard.js
// Fetch and render leaderboard using Chart.js and table

document.addEventListener('DOMContentLoaded', function() {
    const leaderboardTable = document.getElementById('leaderboardTable');
    const leaderboardChart = document.getElementById('leaderboardChart');
    const citySelect = document.getElementById('citySelect');
    let allData = [];

    // Fetch leaderboard data (replace with your API endpoint)
    fetch('/api/users/leaderboard')
        .then(r => r.json())
        .then(data => {
            allData = data;
            renderLeaderboard();
            renderChart();
            populateCities();
        });

    function populateCities() {
        if (!citySelect) return;
        const cities = Array.from(new Set(allData.map(u => u.city).filter(Boolean)));
        citySelect.innerHTML = '<option value="">All Cities</option>' + cities.map(c => `<option value="${c}">${c}</option>`).join('');
    }

    if (citySelect) {
        citySelect.addEventListener('change', function() {
            renderLeaderboard();
            renderChart();
        });
    }

    function renderLeaderboard() {
        if (!leaderboardTable) return;
        const city = citySelect ? citySelect.value : '';
        let users = allData;
        if (city) users = users.filter(u => u.city === city);
        users = users.slice(0, 10); // Top 10
        leaderboardTable.innerHTML = `
            <tr><th>Rank</th><th>Name</th><th>City</th><th>Valid Reports</th></tr>
            ${users.map((u, i) => `<tr><td>${i+1}</td><td>${u.name}</td><td>${u.city||'-'}</td><td>${u.reportsCount||0}</td></tr>`).join('')}
        `;
    }

    function renderChart() {
        if (!leaderboardChart) return;
        const city = citySelect ? citySelect.value : '';
        let users = allData;
        if (city) users = users.filter(u => u.city === city);
        users = users.slice(0, 5); // Top 5 for chart
        const ctx = leaderboardChart.getContext('2d');
        if (window.leaderboardChartInstance) window.leaderboardChartInstance.destroy();
        window.leaderboardChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: users.map(u => u.name),
                datasets: [{
                    label: 'Valid Reports',
                    data: users.map(u => u.reportsCount||0),
                    backgroundColor: '#0096FF',
                }]
            },
            options: {
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
});
