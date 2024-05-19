document.addEventListener('DOMContentLoaded', function() {
    loadThreads();
});

function loadThreads() {
    fetch('/threads')
        .then(response => response.json())
        .then(data => {
            const threadsDiv = document.getElementById('threads');
            threadsDiv.innerHTML = '';
            data.forEach(thread => {
                const threadDiv = document.createElement('div');
                threadDiv.className = 'thread';
                threadDiv.innerHTML = `
                    <h3><a href="/thread.html?id=${thread.id}">${thread.title}</a></h3>
                    <p>${thread.description}</p>
                    <p>最終更新: ${thread.updated_at}</p>
                    <button onclick="deleteThread(${thread.id})">削除</button>
                `;
                threadsDiv.appendChild(threadDiv);
            });
        });
}

function createThread() {
    const title = document.getElementById('thread-title').value;
    const description = document.getElementById('thread-description').value;
    const initialMessage = document.getElementById('initial-message').value;
    const username = document.getElementById('username').value;
    fetch('/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, initialMessage, username })
    })
    .then(response => response.json())
    .then(() => {
        document.getElementById('thread-title').value = '';
        document.getElementById('thread-description').value = '';
        document.getElementById('initial-message').value = '';
        document.getElementById('username').value = '';
        loadThreads();
    });
}

function deleteThread(id) {
    fetch(`/threads/${id}`, { method: 'DELETE' })
    .then(() => loadThreads());
}
