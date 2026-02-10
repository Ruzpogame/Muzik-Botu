const Database = require('better-sqlite3');
const db = new Database('bot.db');

// Initialize table
db.exec(`
    CREATE TABLE IF NOT EXISTS guild_settings (
        guild_id TEXT PRIMARY KEY,
        log_channel_id TEXT
    );
    CREATE TABLE IF NOT EXISTS active_sessions (
        guild_id TEXT PRIMARY KEY,
        text_channel_id TEXT
    );
`);

class DB {
    static get(guildId) {
        const stmt = db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?');
        return stmt.get(guildId);
    }

    static setLogChannel(guildId, channelId) {
        const stmt = db.prepare(`
            INSERT INTO guild_settings (guild_id, log_channel_id) 
            VALUES (?, ?) 
            ON CONFLICT(guild_id) DO UPDATE SET log_channel_id = excluded.log_channel_id
        `);
        return stmt.run(guildId, channelId);
    }

    static setActiveSession(guildId, channelId) {
        const stmt = db.prepare(`
            INSERT INTO active_sessions (guild_id, text_channel_id) 
            VALUES (?, ?) 
            ON CONFLICT(guild_id) DO UPDATE SET text_channel_id = excluded.text_channel_id
        `);
        return stmt.run(guildId, channelId);
    }

    static deleteActiveSession(guildId) {
        const stmt = db.prepare('DELETE FROM active_sessions WHERE guild_id = ?');
        return stmt.run(guildId);
    }

    static getAllActiveSessions() {
        const stmt = db.prepare('SELECT * FROM active_sessions');
        return stmt.all();
    }

    static clearActiveSessions() {
        const stmt = db.prepare('DELETE FROM active_sessions');
        stmt.run();
    }

    static delete(guildId) {
        const stmt = db.prepare('DELETE FROM guild_settings WHERE guild_id = ?');
        return stmt.run(guildId);
    }
}

module.exports = DB;
