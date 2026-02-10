const { EmbedBuilder } = require('discord.js');
const DB = require('../structures/Database');

class Logger {
    constructor(client) {
        this.client = client;
    }

    async log(guildId, title, description, color = 'Red') {
        const settings = DB.get(guildId);
        if (!settings || !settings.log_channel_id) return;

        const guild = this.client.guilds.cache.get(guildId);
        if (!guild) return;

        const channel = guild.channels.cache.get(settings.log_channel_id);
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(color)
            .setTimestamp();

        try {
            await channel.send({ embeds: [embed] });
        } catch (error) {
            console.error(`Failed to send log to guild ${guildId}:`, error);
        }
    }
}

module.exports = Logger;
