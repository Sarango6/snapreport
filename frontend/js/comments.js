// js/comments.js
// Real-time comments for report.html using Socket.io

document.addEventListener('DOMContentLoaded', function() {
    // Only run on report.html
    if (!window.location.pathname.endsWith('report.html')) return;

    // Get reportId from query param (?id=...)
    const urlParams = new URLSearchParams(window.location.search);
    const reportId = urlParams.get('id');
    if (!reportId) return;

    const commentsList = document.getElementById('commentsList');
    const commentForm = document.getElementById('commentForm');
    const commentInput = document.getElementById('commentInput');
    const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();
    const token = localStorage.getItem('token');

    // Socket.io setup
    const socket = io();
    socket.emit('joinReport', reportId);
    socket.on('comment', function({ reportId: rid, comment }) {
        if (rid === reportId) renderComment(comment, true);
    });

    // Fetch and render comments
    fetch(`/api/comments/${reportId}`)
        .then(r => r.json())
        .then(comments => {
            if (Array.isArray(comments)) {
                commentsList.innerHTML = '';
                comments.forEach(c => renderComment(c));
            }
        });

    // Post comment
    if (commentForm && commentInput && user) {
        commentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const text = commentInput.value.trim();
            if (!text) return;
            fetch(`/api/comments/${reportId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                body: JSON.stringify({ text })
            })
            .then(r => r.json())
            .then(c => {
                commentInput.value = '';
                // Comment will be added via socket event
            });
        });
    }

    function renderComment(comment, prepend) {
        const div = document.createElement('div');
        div.className = 'comment';
        div.innerHTML = `<strong>${comment.author?.name || 'User'}:</strong> ${comment.text} <span class="comment-date">${new Date(comment.createdAt).toLocaleString()}</span>`;
        if (prepend && commentsList.firstChild) commentsList.insertBefore(div, commentsList.firstChild);
        else commentsList.appendChild(div);
    }
});
