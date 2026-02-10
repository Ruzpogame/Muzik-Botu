const { ApplicationCommandOptionType } = require('discord.js');
const { useQueue, QueueRepeatMode } = require('discord-player');

module.exports = {
    name: 'loop',
    description: 'Döngü modunu ayarlar.',
    options: [
        {
            name: 'mod',
            description: 'Döngü modu',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: 'Kapalı', value: 'none' },
                { name: 'Şarkı', value: 'track' },
                { name: 'Kuyruk', value: 'queue' }
            ]
        }
    ],
    async run(client, interaction) {
        const queue = useQueue(interaction.guild.id);
        const mode = interaction.options.getString('mod');

        if (!queue) {
            return interaction.reply({ content: 'Şu anda müzik çalmıyor!', flags: 64 });
        }

        if (interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId) {
            return interaction.reply({ content: 'Müziği kontrol etmek için benimle aynı ses kanalında olmalısınız!', flags: 64 });
        }

        const modes = {
            'none': QueueRepeatMode.OFF,
            'track': QueueRepeatMode.TRACK,
            'queue': QueueRepeatMode.QUEUE
        };

        queue.setRepeatMode(modes[mode]);

        let message = 'Döngü modu kapatıldı.';
        if (mode === 'track') message = '🔂 Şarkı döngüsü açıldı.';
        if (mode === 'queue') message = '🔁 Kuyruk döngüsü açıldı.';

        return interaction.reply({ content: message });
    }
};
