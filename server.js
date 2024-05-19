const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// CORSミドルウェアの追加
app.use(cors());

// データベースのセットアップ
let db = new sqlite3.Database(':memory:');

db.serialize(() => {
  db.run("CREATE TABLE threads (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, description TEXT, updated_at TEXT)");
  db.run("CREATE TABLE messages (id INTEGER PRIMARY KEY AUTOINCREMENT, thread_id INTEGER, username TEXT, content TEXT, timestamp TEXT)");
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// スレッド一覧の取得
app.get('/threads', (req, res) => {
  db.all("SELECT * FROM threads", [], (err, rows) => {
    if (err) {
      throw err;
    }
    res.json(rows);
  });
});

// スレッドの作成
app.post('/threads', (req, res) => {
  const { title, description, initialMessage, username } = req.body;
  const updatedAt = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
  db.run("INSERT INTO threads (title, description, updated_at) VALUES (?, ?, ?)", [title, description, updatedAt], function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    const threadId = this.lastID;
    db.run("INSERT INTO messages (thread_id, username, content, timestamp) VALUES (?, ?, ?, ?)", [threadId, username, initialMessage, updatedAt], function(err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      res.json({ id: threadId });
    });
  });
});

// スレッドの取得
app.get('/threads/:id', (req, res) => {
  const { id } = req.params;
  db.get("SELECT * FROM threads WHERE id = ?", [id], (err, row) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json(row);
  });
});

// スレッドの削除
app.delete('/threads/:id', (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM threads WHERE id = ?", [id], function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    db.run("DELETE FROM messages WHERE thread_id = ?", [id], function(err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      res.json({ message: 'Deleted' });
    });
  });
});

// メッセージ一覧の取得
app.get('/threads/:id/messages', (req, res) => {
  const { id } = req.params;
  db.all("SELECT * FROM messages WHERE thread_id = ?", [id], (err, rows) => {
    if (err) {
      throw err;
    }
    res.json(rows);
  });
});

// メッセージの投稿
app.post('/threads/:id/messages', (req, res) => {
  const { id } = req.params;
  const { username, content } = req.body;
  const timestamp = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
  db.run("INSERT INTO messages (thread_id, username, content, timestamp) VALUES (?, ?, ?, ?)", [id, username, content, timestamp], function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    db.run("UPDATE threads SET updated_at = ? WHERE id = ?", [timestamp, id], function(err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      res.json({ id: this.lastID });
    });
  });
});

// メッセージの削除
app.delete('/messages/:id', (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM messages WHERE id = ?", [id], function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({ message: 'Deleted' });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
