const { EmbedBuilder } = require('discord.js');
const { useQueue } = require('discord-player');
const lyricsFinder = require('lyrics-finder');

module.exports = {
    name: 'lyrics',
    description: 'Çalan şarkının sözlerini gösterir.',
    async run(client, interaction) {
        const queue = useQueue(interaction.guild.id);

        if (!queue || !queue.currentTrack) {
            return interaction.reply({ content: 'Şu anda müzik çalmıyor!', flags: 64 });
        }

        await interaction.deferReply();

        const track = queue.currentTrack;

        try {
            let lyrics = await lyricsFinder(track.author, track.title) || await lyricsFinder("", track.title);

            if (!lyrics) {
                return interaction.editReply({ content: 'Şarkı sözleri bulunamadı!' });
            }

            const embed = new EmbedBuilder()
                .setTitle(`📃 ${track.title} - ${track.author}`)
                .setColor('Blue')
                .setDescription(lyrics.length > 4096 ? lyrics.substring(0, 4093) + '...' : lyrics);

            return interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            return interaction.editReply({ content: 'Şarkı sözleri alınırken bir hata oluştu.' });
        }
    }
};
