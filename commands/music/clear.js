const { useQueue } = require('discord-player');

module.exports = {
    name: 'clear',
    description: 'Kuyruğu temizler (çalan şarkı hariç).',
    async run(client, interaction) {
        const queue = useQueue(interaction.guild.id);

        if (!queue) {
            return interaction.reply({ content: 'Şu anda müzik çalmıyor!', flags: 64 });
        }

        if (interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId) {
            return interaction.reply({ content: 'Müziği kontrol etmek için benimle aynı ses kanalında olmalısınız!', flags: 64 });
        }

        queue.tracks.clear();
        return interaction.reply({ content: '🗑️ Kuyruk temizlendi!' });
    }
};
