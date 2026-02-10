const { useQueue } = require('discord-player');

module.exports = {
    name: 'skip',
    description: 'Çalan şarkıyı geçer.',
    async run(client, interaction) {
        const queue = useQueue(interaction.guild.id);

        if (!queue || !queue.isPlaying()) {
            return interaction.reply({ content: 'Şu anda müzik çalmıyor!', flags: 64 });
        }

        if (interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId) {
            return interaction.reply({ content: 'Müziği kontrol etmek için benimle aynı ses kanalında olmalısınız!', flags: 64 });
        }

        queue.node.skip();
        return interaction.reply({ content: '⏭️ Şarkı geçildi!' });
    }
};
