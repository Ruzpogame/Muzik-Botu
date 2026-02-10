const { EmbedBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
    name: 'nowplaying',
    description: 'Şu anda çalan şarkıyı gösterir.',
    async run(client, interaction) {
        const queue = useQueue(interaction.guild.id);

        if (!queue || !queue.currentTrack) {
            return interaction.reply({ content: 'Şu anda müzik çalmıyor!', flags: 64 });
        }

        const track = queue.currentTrack;
        const progress = queue.node.createProgressBar();

        const embed = new EmbedBuilder()
            .setTitle('🎶 Şu Anda Çalıyor')
            .setDescription(`[${track.title}](${track.url})`)
            .addFields(
                { name: 'Sanatçı', value: track.author || 'Bilinmiyor', inline: true },
                { name: 'Süre', value: `${track.duration}` || 'Bilinmiyor', inline: true },
                { name: 'İlerleme', value: progress || '▬▬▬▬▬▬▬▬▬▬' }
            )
            .setThumbnail(track.thumbnail || null)
            .setColor('Blue');

        return interaction.reply({ embeds: [embed] });
    }
};
