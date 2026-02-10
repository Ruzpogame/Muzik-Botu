const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const { useMainPlayer, QueryType } = require('discord-player');

module.exports = {
    name: 'play',
    description: 'Müzik çalar.',
    options: [
        {
            name: 'sorgu',
            description: 'Çalınacak şarkı adı veya linki (YouTube, Spotify vb.)',
            type: ApplicationCommandOptionType.String,
            required: true
        }
    ],
    async run(client, interaction) {
        const { options, member, guild, channel } = interaction;
        const query = options.getString('sorgu');
        const voiceChannel = member.voice.channel;

        if (!voiceChannel) {
            return interaction.reply({ content: 'Bir ses kanalına katılmalısınız!', flags: 64 });
        }

        if (!voiceChannel.joinable) {
            return interaction.reply({ content: 'Ses kanalına katılma yetkim yok!', flags: 64 });
        }

        const botVoice = guild.members.me.voice.channel;
        if (botVoice && botVoice.id !== voiceChannel.id) {
            return interaction.reply({ content: 'Zaten başka bir kanaldayım!', flags: 64 });
        }

        await interaction.deferReply();

        try {
            const player = useMainPlayer();
            const play = require('play-dl');

            // 1. Search with play-dl (more reliable than discord-player-youtubei currently)
            let searchResult;
            if (query.startsWith('http')) {
                searchResult = query;
            } else {
                const results = await play.search(query, {
                    limit: 1,
                    source: { youtube: 'video' }
                });
                if (!results || results.length === 0) {
                    return interaction.editReply({ content: '❌ Şarkı bulunamadı. (play-dl arama sonucu yok)' });
                }
                searchResult = results[0].url;
            }

            // 2. Play the URL (onBeforeCreateStream in ExtendedClient will handle the stream)
            const result = await player.play(voiceChannel, searchResult, {
                searchEngine: QueryType.AUTO,
                nodeOptions: {
                    metadata: { channel },
                    selfDeaf: true,
                    volume: parseInt(process.env.DEFAULT_VOLUME || 80),
                    leaveOnEmpty: true,
                    leaveOnEmptyCooldown: 60000,
                    leaveOnEnd: false,
                    leaveOnEndCooldown: 300000
                }
            });

            const track = result.track;
            const embed = new EmbedBuilder()
                .setColor('Random')
                .setAuthor({ name: 'Kuyruğa Eklendi', iconURL: interaction.user.displayAvatarURL() })
                .setTitle(track.title)
                .setURL(track.url)
                .setThumbnail(track.thumbnail || null)
                .addFields(
                    { name: '👤 Yayıncı', value: track.author || 'Bilinmiyor', inline: true },
                    { name: '⏱️ Süre', value: String((typeof track.duration === 'number' ? `${Math.floor(track.duration / 60000)}:${String(Math.floor((track.duration % 60000) / 1000)).padStart(2, '0')}` : track.duration) || 'Canlı'), inline: true }
                )
                .setFooter({ text: `${interaction.user.username} tarafından istendi` });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('[PLAY] Error:', error.message);
            await interaction.editReply({ content: `❌ Hata oluştu: ${error.message}` });
        }
    }
};
