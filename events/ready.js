const { ActivityType } = require('discord.js');

module.exports = {
    name: 'clientReady',
    once: true,
    async execute(client) {
        console.log(`Logged in as ${client.user.tag}`);

        client.user.setPresence({
            activities: [{ name: '/help | Müzik Botu', type: ActivityType.Listening }],
            status: 'online',
        });

        // Notify restarted sessions
        const DB = require('../structures/Database');
        const sessions = DB.getAllActiveSessions();
        if (sessions.length > 0) {
            console.log(`Notifying ${sessions.length} guilds about restart.`);
            for (const session of sessions) {
                try {
                    // Fetch guild and channel properly
                    const channel = await client.channels.fetch(session.text_channel_id).catch(() => null);
                    if (channel) {
                        await channel.send('⚠️ **Bot yeniden başlatıldı.** Müzik kuyruğu sıfırlandı. Lütfen tekrar çaldırın.');
                    }
                } catch (err) {
                    console.error(`Failed to notify session ${session.guild_id}: ${err.message}`);
                }
            }
            DB.clearActiveSessions();
        }

        // Register slash commands globally (implied requirement, or per guild for dev)
        // For production, global is better but takes time to update.
        // For this task, we'll do guild-based if GUILD_ID is present, else global.

        const commands = client.commands.map(cmd => ({
            name: cmd.name,
            description: cmd.description,
            options: cmd.options || [],
        }));

        if (process.env.GUILD_ID) {
            const guild = client.guilds.cache.get(process.env.GUILD_ID);
            if (guild) {
                guild.commands.set(commands)
                    .then(() => console.log(`Commands loaded in guild ${guild.name}`))
                    .catch(err => console.error(err));
            }
        } else {
            client.application.commands.set(commands)
                .then(() => console.log('Commands loaded globally'))
                .catch(err => console.error(err));
        }
    },
};
