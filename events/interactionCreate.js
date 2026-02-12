const { InteractionType } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    once: false,
    async execute(interaction, client) {
        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);

        if (!command) return;

        try {
            await command.run(client, interaction);
        } catch (error) {
            console.error(error);
            // If the error is "Unknown interaction", we can't reply/edit anyway.
            if (error.code === 10062 || error.code === 40060) return;

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Komutu çalıştırırken bir hata oluştu!', flags: 64 }).catch(() => { });
            } else {
                await interaction.reply({ content: 'Komutu çalıştırırken bir hata oluştu!', flags: 64 }).catch(() => { });
            }
        }
    },
};
