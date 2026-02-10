const { EmbedBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
    name: 'queue',
    description: 'Müzik kuyruğunu gösterir.',
    async run(client, interaction) {
        const queue = useQueue(interaction.guild.id);

        if (!queue || queue.tracks.size === 0) {
            return interaction.reply({ content: 'Kuyruk boş!', flags: 64 });
        }

        const tracks = queue.tracks.toArray().slice(0, 10).map((track, i) => {
            return `${i + 1}. [${track.title}](${track.url}) - **${track.author}**`;
        }).join('\n');

        const embed = new EmbedBuilder()
            .setTitle('📄 Müzik Kuyruğu')
            .setDescription(queue.tracks.size > 10 ? `${tracks}\n...ve ${queue.tracks.size - 10} şarkı daha.` : tracks)
            .setFooter({ text: `Toplam ${queue.tracks.size} şarkı.` })
            .setColor('Blue');

        if (queue.currentTrack) {
            embed.addFields({ name: 'Şu Anda Çalıyor', value: `[${queue.currentTrack.title}](${queue.currentTrack.url})` });
        }

        return interaction.reply({ embeds: [embed] });
    }
};
