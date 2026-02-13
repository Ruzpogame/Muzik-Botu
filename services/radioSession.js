const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const stations = require('../data/stations');
const radioControls = require('../handlers/radioControls');

class RadioSession {
    constructor(client, guildId, voiceChannelId, textChannelId, ownerUserId, startStationId) {
        this.client = client;
        this.guildId = guildId;
        this.voiceChannelId = voiceChannelId;
        this.textChannelId = textChannelId;
        this.ownerUserId = ownerUserId;
        this.currentStationId = startStationId || 'powerfm';
        this.message = null;
        this.collector = null;
        this.updateInterval = null;
        this.isActive = false;
    }

    async start() {
        this.isActive = true;
        await this.playCurrentStation();
        await this.sendEmbed();
        this.startCollector();
        this.startUpdateInterval();
    }

    async stop() {
        this.isActive = false;

        if (this.collector) this.collector.stop();
        if (this.updateInterval) clearInterval(this.updateInterval);

        const queue = this.client.player.nodes.get(this.guildId);
        if (queue) {
            queue.node.stop();
            queue.delete();
        }

        if (this.message) {
            const embed = new EmbedBuilder(this.message.embeds[0].data);
            embed.setColor('Red');
            embed.setDescription('🔴 **Radyo Modu Durduruldu.**');
            embed.setFields([]);
            await this.message.edit({ embeds: [embed], components: [] }).catch(() => { });
        }

        this.client.radioSessions.delete(this.guildId);
    }

    async playCurrentStation() {
        if (!this.isActive) return;

        try {
            const station = stations.find(s => s.id === this.currentStationId);
            if (!station) return;

            const voiceChannel = this.client.channels.cache.get(this.voiceChannelId);
            if (!voiceChannel) {
                console.error('[RadioSession] Voice channel not found:', this.voiceChannelId);
                return;
            }

            const player = this.client.player;
            let queue = player.nodes.get(this.guildId);

            const nodeOptions = {
                metadata: {
                    channel: this.client.channels.cache.get(this.textChannelId),
                    isRadio: true,
                    station: station
                },
                selfDeaf: true,
                volume: 80,
                leaveOnEmpty: false,
                leaveOnEnd: false,
                leaveOnStop: false
            };
// Sa
            if (queue) {
                // Kuyrugu silme – bot kanalda kalsin. Durdur, temizle, sonra ayni node'a yeni yayin ekle.
                queue.setRepeatMode(0);
                queue.tracks.clear();
                queue.node.stop();
                await new Promise(r => setTimeout(r, 300));

                // Mevcut node var; player.play() yeni track'i bu kuyruga ekler, bot kanaldan cikmaz
                await player.play(voiceChannel, station.streamUrl, {
                    nodeOptions,
                    requestedBy: this.client.users.cache.get(this.ownerUserId)
                });
            } else {
                await player.play(voiceChannel, station.streamUrl, {
                    nodeOptions,
                    requestedBy: this.client.users.cache.get(this.ownerUserId)
                });
            }

            queue = player.nodes.get(this.guildId);
            if (queue) {
                queue.setRepeatMode(1);
            }
        } catch (e) {
            console.error(`[RadioSession] Play error: ${e.message}`);
        }
    }

    async sendEmbed() {
        const channel = this.client.channels.cache.get(this.textChannelId);
        if (!channel) return;

        const embed = this.createEmbed();
        const components = this.createComponents();

        this.message = await channel.send({ embeds: [embed], components: components });
    }

    async updateEmbed(interaction = null) {
        if (!this.message) return;

        const embed = this.createEmbed();

        try {
            if (interaction && !interaction.replied && !interaction.deferred) {
                await interaction.update({ embeds: [embed] });
            } else {
                await this.message.edit({ embeds: [embed] }).catch(() => { });
            }
        } catch (e) { }
    }

    createEmbed() {
        let station = stations.find(s => s.id === this.currentStationId);
        if (!station) station = stations[0];

        const owner = this.client.users.cache.get(this.ownerUserId);

        const embed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('📻 Radyo Modu (7/24)')
            .setDescription(`📡 **Şu an çalıyor:** [${station.name}](${station.streamUrl})\n🎵 **Frekans:** ${station.frequency} FM`)
            .setThumbnail(station.logoUrl)
            .addFields(
                { name: 'Kategori', value: station.category, inline: true },
                { name: 'Durum', value: '🟢 Yayında', inline: true },
                { name: 'Sahip', value: owner ? owner.username : 'Bilinmiyor', inline: true }
            )
            .setFooter({ text: 'Radyo Modu • Qylent Music Bot', iconURL: this.client.user.displayAvatarURL() })
            .setTimestamp();

        embed.addFields({ name: '🎵 Anlık Şarkı', value: 'Canlı Radyo Yayını', inline: false });

        return embed;
    }

    createComponents() {
        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('radio_previous').setEmoji('⏮️').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('radio_stop').setEmoji('🛑').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('radio_next').setEmoji('⏭️').setStyle(ButtonStyle.Secondary)
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('radio_search').setEmoji('🔍').setLabel('Ara').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('radio_categories').setEmoji('📻').setLabel('Kategoriler').setStyle(ButtonStyle.Primary)
        );

        return [row1, row2];
    }

    startCollector() {
        if (!this.message) return;

        const filter = (i) => {
            if (i.user.id === this.ownerUserId) return true;
            i.reply({ content: '❌ Bu radyo panelini sadece başlatan kişi kullanabilir.', flags: 64 });
            return false;
        };

        this.collector = this.message.createMessageComponentCollector({ filter });

        this.collector.on('collect', async (i) => {
            try {
                switch (i.customId) {
                    case 'radio_stop':
                        await radioControls.stop(i, this);
                        break;
                    case 'radio_previous':
                        await radioControls.previous(i, this);
                        break;
                    case 'radio_next':
                        await radioControls.next(i, this);
                        break;
                    case 'radio_search':
                        await radioControls.searchButton(i, this);
                        // Handle modal submission
                        try {
                            const submitted = await i.awaitModalSubmit({
                                time: 60000,
                                filter: (m) => m.user.id === i.user.id && m.customId === 'radio_search_modal'
                            });
                            if (submitted) {
                                const query = submitted.fields.getTextInputValue('radio_search_input');
                                await radioControls.handleSearchSubmit(submitted, this, query);
                            }
                        } catch (e) {
                            // Modal timeout, ignore
                        }
                        break;
                    case 'radio_categories':
                        const response = await radioControls.categories(i, this);
                        if (response) {
                            const subCollector = response.createMessageComponentCollector({
                                filter: (subI) => subI.user.id === i.user.id,
                                time: 60000,
                                componentType: ComponentType.StringSelect
                            });

                            subCollector.on('collect', async (subI) => {
                                try {
                                    if (subI.customId === 'radio_category_select') {
                                        await radioControls.handleCategorySelect(subI, this, subI.values[0]);
                                        // Collector continues for next step
                                    } else if (subI.customId === 'radio_station_select') {
                                        await radioControls.handleStationSelect(subI, this, subI.values[0]);
                                        subCollector.stop();
                                    }
                                } catch (e) {
                                    console.error('[RadioSession] SubCollector Error:', e);
                                }
                            });
                        }
                        break;
                }
            } catch (e) {
                console.error('[RadioSession] Collector error:', e);
            }
        });

        this.collector.on('end', () => {
            // Session ends?
        });
    }

    startUpdateInterval() {
        this.updateInterval = setInterval(() => {
            if (this.isActive) this.updateEmbed();
        }, 30000);
    }
}

module.exports = RadioSession;
