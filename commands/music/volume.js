const { ApplicationCommandOptionType, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
    name: 'volume',
    description: 'Ses seviyesini ayarlar.',
    options: [
        {
            name: 'seviye',
            description: 'Ses seviyesi (0-300)',
            type: ApplicationCommandOptionType.Integer,
            required: true,
            minValue: 0,
            maxValue: 300
        }
    ],
    async run(client, interaction) {
        const volume = interaction.options.getInteger('seviye');
        const queue = useQueue(interaction.guild.id);

        if (!queue || !queue.isPlaying()) {
            return interaction.reply({ content: 'Şu anda müzik çalmıyor!', flags: 64 });
        }

        if (interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId) {
            return interaction.reply({ content: 'Müziği kontrol etmek için benimle aynı ses kanalında olmalısınız!', flags: 64 });
        }

        // Normal volume change
        if (volume <= 150) {
            queue.node.setVolume(volume);
            return interaction.reply({ content: `Ses seviyesi **%${volume}** olarak ayarlandı.` });
        }

        // Warning
        if (volume > 150 && volume <= 200) {
            queue.node.setVolume(volume);
            return interaction.reply({ content: `Ses seviyesi **%${volume}** olarak ayarlandı. ⚠️ Yüksek ses kulağınıza zarar verebilir.` });
        }

        // > 200: Confirmation required
        if (volume > 200) {
            const confirmButton = new ButtonBuilder()
                .setCustomId('confirm_volume')
                .setLabel('Onayla (Tehlikeli Ses)')
                .setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder().addComponents(confirmButton);

            const response = await interaction.reply({
                content: `⚠️ **DİKKAT!** Ses seviyesini **%${volume}** yapmak üzeresiniz. Bu çok yüksek bir ses seviyesidir ve hoparlörlerinize/kulağınıza zarar verebilir.\nOnaylıyor musunuz? (30 saniye)`,
                components: [row],
                fetchReply: true
            });

            const collector = response.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 30000
            });

            collector.on('collect', async (i) => {
                if (i.user.id !== interaction.user.id) {
                    return i.reply({ content: 'Bu onayı sadece komutu kullanan kişi verebilir!', flags: 64 });
                }

                if (i.customId === 'confirm_volume') {
                    queue.node.setVolume(volume);
                    await i.update({ content: `✅ Ses seviyesi **%${volume}** olarak ayarlandı! (Dikkatli olun)`, components: [] });
                    client.emit('highVolume', interaction.guild, interaction.user, volume);
                    collector.stop('confirmed');
                }
            });

            collector.on('end', (_, reason) => {
                if (reason !== 'confirmed') {
                    interaction.editReply({ content: '❌ İşlem zaman aşımına uğradı veya iptal edildi.', components: [] });
                }
            });
        }
    }
};
