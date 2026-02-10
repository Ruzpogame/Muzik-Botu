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
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Komutu çalıştırırken bir hata oluştu!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'Komutu çalıştırırken bir hata oluştu!', ephemeral: true });
            }
        }
    },
};
