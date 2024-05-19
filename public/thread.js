document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const threadId = urlParams.get('id');
    loadThread(threadId);
    loadMessages(threadId);
});

function loadThread(threadId) {
    fetch(`/threads/${threadId}`)
        .then(response => response.json())
        .then(data => {
            document.getElementById('thread-title').innerText = data.title;
        });
}

function loadMessages(threadId) {
    fetch(`/threads/${threadId}/messages`)
        .then(response => response.json())
        .then(data => {
            const messagesDiv = document.getElementById('messages');
            messagesDiv.innerHTML = '';
            data.forEach(message => {
                const messageDiv = document.createElement('div');
                messageDiv.className = 'message';
                messageDiv.innerHTML = `
                    <p>${message.content} - ${message.timestamp}</p>
                    <button onclick="deleteMessage(${message.id})">削除</button>
                `;
                messagesDiv.appendChild(messageDiv);
            });
        });
}

function postMessage() {
    const urlParams = new URLSearchParams(window.location.search);
    const threadId = urlParams.get('id');
    const content = document.getElementById('message-content').value;
    fetch(`/threads/${threadId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
    })
    .then(response => response.json())
    .then(() => {
        document.getElementById('message-content').value = '';
        loadMessages(threadId);
    });
}

function deleteMessage(id) {
    const urlParams = new URLSearchParams(window.location.search);
    const threadId = urlParams.get('id');
    fetch(`/messages/${id}`, { method: 'DELETE' })
    .then(() => loadMessages(threadId));
}
