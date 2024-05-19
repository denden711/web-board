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
                    <h3>${thread.title}</h3>
                    <button onclick="deleteThread(${thread.id})">削除</button>
                    <div class="messages" id="messages-${thread.id}">
                        <input type="text" id="message-content-${thread.id}" placeholder="メッセージ内容">
                        <button onclick="postMessage(${thread.id})">投稿</button>
                        <div class="message-list" id="message-list-${thread.id}">
                            <!-- メッセージがここに表示される -->
                        </div>
                    </div>
                `;
                threadsDiv.appendChild(threadDiv);
                loadMessages(thread.id);
            });
        });
}

function createThread() {
    const title = document.getElementById('thread-title').value;
    fetch('/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
    })
    .then(response => response.json())
    .then(() => {
        document.getElementById('thread-title').value = '';
        loadThreads();
    });
}

function deleteThread(id) {
    fetch(`/threads/${id}`, { method: 'DELETE' })
    .then(() => loadThreads());
}

function loadMessages(threadId) {
    fetch(`/threads/${threadId}/messages`)
        .then(response => response.json())
        .then(data => {
            const messageListDiv = document.getElementById(`message-list-${threadId}`);
            messageListDiv.innerHTML = '';
            data.forEach(message => {
                const messageDiv = document.createElement('div');
                messageDiv.className = 'message';
                messageDiv.innerHTML = `
                    <p>${message.content} - ${message.timestamp}</p>
                    <button onclick="deleteMessage(${message.id})">削除</button>
                `;
                messageListDiv.appendChild(messageDiv);
            });
        });
}

function postMessage(threadId) {
    const content = document.getElementById(`message-content-${threadId}`).value;
    fetch(`/threads/${threadId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
    })
    .then(response => response.json())
    .then(() => {
        document.getElementById(`message-content-${threadId}`).value = '';
        loadMessages(threadId);
    });
}

function deleteMessage(id) {
    fetch(`/messages/${id}`, { method: 'DELETE' })
    .then(() => {
        const threadId = document.querySelector(`#messages-${id}`).dataset.threadId;
        loadMessages(threadId);
    });
}
