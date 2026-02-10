const { useQueue } = require('discord-player');

module.exports = {
    name: 'pause',
    description: 'Müziği duraklatır veya devam ettirir.',
    async run(client, interaction) {
        const queue = useQueue(interaction.guild.id);

        if (!queue || !queue.isPlaying()) {
            return interaction.reply({ content: 'Şu anda müzik çalmıyor!', flags: 64 });
        }

        if (interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId) {
            return interaction.reply({ content: 'Müziği kontrol etmek için benimle aynı ses kanalında olmalısınız!', flags: 64 });
        }

        if (queue.node.isPaused()) {
            queue.node.resume();
            return interaction.reply({ content: '▶️ Müzik devam ettirildi.' });
        } else {
            queue.node.pause();
            return interaction.reply({ content: '⏸️ Müzik duraklatıldı.' });
        }
    }
};
