const { ApplicationCommandOptionType } = require('discord.js');
const RadioSession = require('../../services/radioSession');
const stations = require('../../data/stations');

module.exports = {
    name: 'radyo',
    description: '7/24 Radyo Modunu başlatır.',
    options: [
        {
            name: 'istasyon',
            description: 'Frekans (örn: 100.0) veya Radyo Adı (örn: Power)',
            type: ApplicationCommandOptionType.String,
            required: false
        }
    ],
    async run(client, interaction) {
        // 1. Voice Channel Check
        const memberChannel = interaction.member.voice.channel;
        if (!memberChannel) {
            return interaction.reply({ content: '❌ Radyo dinlemek için bir ses kanalında olmalısınız!', flags: 64 });
        }

        await interaction.deferReply().catch(() => {});

        // 2. Determine Station
        const input = interaction.options.getString('istasyon');
        let selectedStation = null;

        if (!input) {
            // Default: Power FM (100.0)
            selectedStation = stations.find(s => s.id === 'powerfm') || stations[0];
        } else {
            const lowerInput = input.trim().toLowerCase();

            // Numeric check (Frequency)
            if (/^[\d.,]+$/.test(lowerInput)) {
                // Find exact or nearest frequency
                const targetFreq = parseFloat(lowerInput.replace(',', '.'));

                // Find exact
                selectedStation = stations.find(s => parseFloat(s.frequency) === targetFreq);

                // If not found, find nearest
                if (!selectedStation) {
                    let minDiff = Infinity;
                    let nearest = null;
                    for (const s of stations) {
                        const freq = parseFloat(s.frequency);
                        const diff = Math.abs(freq - targetFreq);
                        if (diff < minDiff) {
                            minDiff = diff;
                            nearest = s;
                        }
                    }
                    if (minDiff < 2.0) { // Safety margin
                        selectedStation = nearest;
                    }
                }
            } else {
                // Name fuzzy match
                selectedStation = stations.find(s => s.name.toLowerCase().includes(lowerInput)) ||
                    stations.find(s => s.id.includes(lowerInput)) ||
                    stations.find(s => s.category.toLowerCase().includes(lowerInput));
            }
        }

        if (!selectedStation) {
            return interaction.editReply({ content: `❌ "**${input}**" ile eşleşen veya yakın bir radyo frekansı bulunamadı.` });
        }

        // 3. Session Management
        if (!client.radioSessions) client.radioSessions = new Map();

        let session = client.radioSessions.get(interaction.guild.id);

        if (session) {
            // Update existing session: channel and station
            session.voiceChannelId = memberChannel.id;
            session.textChannelId = interaction.channel.id;
            if (input) session.currentStationId = selectedStation.id;

            await session.playCurrentStation(interaction);
            if (session.message && session.message.channelId === interaction.channel.id) {
                await session.updateEmbed();
            } else {
                await session.sendEmbed();
            }

            await interaction.editReply({ content: `✅ Radyo oturumu güncellendi! **${selectedStation.name}** çalınıyor.` });
        } else {
            session = new RadioSession(
                client,
                interaction.guild.id,
                memberChannel.id,
                interaction.channel.id,
                interaction.user.id,
                selectedStation.id
            );

            client.radioSessions.set(interaction.guild.id, session);
            await session.start(interaction);

            await interaction.editReply({ content: `✅ **Radyo Modu Başlatıldı!**\nKeyifli dinlemeler. (Panel aşağıda)` });
        }
    }
};
