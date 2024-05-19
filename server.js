const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// 環境変数の読み込み
require('dotenv').config();

// CORSミドルウェアの追加
app.use(cors());

// PostgreSQLのプールを設定
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// データベースの初期化
pool.query(`
  CREATE TABLE IF NOT EXISTS threads (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    thread_id INTEGER REFERENCES threads(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`, (err) => {
  if (err) {
    console.error('Error initializing database', err);
  } else {
    console.log('Database initialized');
  }
});

// スレッド一覧の取得
app.get('/threads', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM threads');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching threads', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// スレッドの作成
app.post('/threads', async (req, res) => {
  const { title, description, initialMessage, username } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO threads (title, description) VALUES ($1, $2) RETURNING id',
      [title, description]
    );
    const threadId = result.rows[0].id;
    await pool.query(
      'INSERT INTO messages (thread_id, username, content) VALUES ($1, $2, $3)',
      [threadId, username, initialMessage]
    );
    res.json({ id: threadId });
  } catch (err) {
    console.error('Error creating thread', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// スレッドの取得
app.get('/threads/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM threads WHERE id = $1', [id]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching thread', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// スレッドの削除
app.delete('/threads/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM threads WHERE id = $1', [id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Error deleting thread', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// メッセージ一覧の取得
app.get('/threads/:id/messages', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM messages WHERE thread_id = $1', [id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching messages', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// メッセージの投稿
app.post('/threads/:id/messages', async (req, res) => {
  const { id } = req.params;
  const { username, content } = req.body;
  try {
    await pool.query(
      'INSERT INTO messages (thread_id, username, content) VALUES ($1, $2, $3)',
      [id, username, content]
    );
    await pool.query(
      'UPDATE threads SET updated_at = NOW() WHERE id = $1',
      [id]
    );
    res.json({ message: 'Message posted' });
  } catch (err) {
    console.error('Error posting message', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// メッセージの削除
app.delete('/messages/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM messages WHERE id = $1', [id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Error deleting message', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
