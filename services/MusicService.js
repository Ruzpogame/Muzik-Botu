// MusicService is no longer needed with discord-player
// discord-player handles queue management internally
// This file is kept as a thin wrapper for compatibility

class MusicService {
    constructor(client) {
        this.client = client;
    }

    getQueue(guildId) {
        return this.client.player.nodes.get(guildId);
    }
}

module.exports = MusicService;
