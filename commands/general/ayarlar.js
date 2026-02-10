const { ApplicationCommandOptionType, PermissionFlagsBits, ChannelType } = require('discord.js');
const DB = require('../../structures/Database');

module.exports = {
    name: 'ayarlar',
    description: 'Bot ayarlarını yapılandırır.',
    options: [
        {
            name: 'log-kanal',
            description: 'Log kanalını ayarlar.',
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: true
        }
    ],
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    async run(client, interaction) {
        const channel = interaction.options.getChannel('log-kanal');

        try {
            DB.setLogChannel(interaction.guild.id, channel.id);
            return interaction.reply({ content: `✅ Log kanalı başarıyla ${channel} olarak ayarlandı.` });
        } catch (error) {
            console.error(error);
            return interaction.reply({ content: 'Ayarlar kaydedilirken bir hata oluştu.', ephemeral: true });
        }
    }
};
