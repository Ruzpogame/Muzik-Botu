const { useQueue } = require('discord-player');

module.exports = {
    name: 'shuffle',
    description: 'Kuyruğu karıştırır.',
    async run(client, interaction) {
        const queue = useQueue(interaction.guild.id);

        if (!queue || queue.tracks.size < 2) {
            return interaction.reply({ content: 'Karıştırmak için kuyrukta yeterli şarkı yok!', flags: 64 });
        }

        if (interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId) {
            return interaction.reply({ content: 'Müziği kontrol etmek için benimle aynı ses kanalında olmalısınız!', flags: 64 });
        }

        queue.tracks.shuffle();

        return interaction.reply({ content: '🔀 Kuyruk karıştırıldı!' });
    }
};
