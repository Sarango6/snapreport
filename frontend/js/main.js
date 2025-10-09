const form = document.getElementById('issueForm');
const message = document.getElementById('message');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const issueData = {
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        category: document.getElementById('category').value,
        location: document.getElementById('location').value
    };

    try {
        const res = await fetch('http://localhost:5000/api/issues', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(issueData)
        });

        if (res.ok) {
            message.textContent = "Issue submitted successfully!";
            form.reset();
        } else {
            message.textContent = "Error submitting issue.";
        }
    } catch (err) {
        message.textContent = "Server error.";
    }
});
