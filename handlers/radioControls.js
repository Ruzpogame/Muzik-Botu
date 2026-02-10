const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const stations = require('../data/stations');

// Helper to update session state and UI
async function updateRadio(session, interaction = null) {
    if (interaction && !interaction.replied && !interaction.deferred) {
        await interaction.deferUpdate().catch(() => { });
    }
    await session.playCurrentStation();
    await session.updateEmbed(interaction);
}

module.exports = {
    async stop(interaction, session) {
        await session.stop();
        if (!interaction.replied && !interaction.deferred) await interaction.deferUpdate().catch(() => { });
    },

    async previous(interaction, session) {
        let index = stations.findIndex(s => s.id === session.currentStationId);
        if (index === -1) index = 0;

        index = (index - 1 + stations.length) % stations.length;
        session.currentStationId = stations[index].id;
        await updateRadio(session, interaction);
    },

    async next(interaction, session) {
        let index = stations.findIndex(s => s.id === session.currentStationId);
        if (index === -1) index = 0;

        index = (index + 1) % stations.length;
        session.currentStationId = stations[index].id;
        await updateRadio(session, interaction);
    },

    async searchButton(interaction, session) {
        const modal = new ModalBuilder()
            .setCustomId('radio_search_modal')
            .setTitle('Radyo Arama');

        const input = new TextInputBuilder()
            .setCustomId('radio_search_input')
            .setLabel('Frekans veya Radyo Adı')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Örn: 100.0 veya Power FM')
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(input);
        modal.addComponents(row);

        await interaction.showModal(modal);
    },

    async categories(interaction, session) {
        const categories = [...new Set(stations.map(s => s.category))];

        const options = categories.map(cat => ({
            label: cat,
            value: cat,
            description: `${stations.filter(s => s.category === cat).length} istasyon`
        }));

        const select = new StringSelectMenuBuilder()
            .setCustomId('radio_category_select')
            .setPlaceholder('Bir kategori seçin')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(select);

        await interaction.reply({
            content: '📂 Lütfen bir kategori seçin:',
            components: [row],
            flags: 64,
            withResponse: true
        });

        return await interaction.fetchReply();
    },

    async handleCategorySelect(interaction, session, selectedCategory) {
        const categoryStations = stations.filter(s => s.category === selectedCategory);

        const options = categoryStations.map(s => ({
            label: `${s.name} (${s.frequency})`,
            value: s.id,
            description: s.frequency + ' FM'
        }));

        const select = new StringSelectMenuBuilder()
            .setCustomId('radio_station_select')
            .setPlaceholder('Bir istasyon seçin')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(select);

        // Update the ephemeral message
        await interaction.update({
            content: `📂 **${selectedCategory}** kategorisindeki istasyonlar:`,
            components: [row]
        });

        // Return the message (via fetchReply if needed, but update keeps it)
        return interaction.message;
    },

    async handleStationSelect(interaction, session, selectedStationId) {
        session.currentStationId = selectedStationId;
        const station = stations.find(s => s.id === selectedStationId);

        await interaction.update({ content: `✅ **${station.name}** çalınıyor!`, components: [] });

        await session.playCurrentStation();
        await session.updateEmbed();
    },

    async handleSearchSubmit(interaction, session, query) {
        const lowerQuery = query.toLowerCase().trim();
        const station = stations.find(s => s.frequency === lowerQuery) ||
            stations.find(s => s.name.toLowerCase().includes(lowerQuery)) ||
            stations.find(s => s.frequency.startsWith(lowerQuery));

        if (station) {
            session.currentStationId = station.id;
            // Ensure we catch potential errors if replying to already replied interaction
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: `✅ **${station.name}** bulundu ve çalınıyor.`, ephemeral: true });
            } else {
                await interaction.reply({ content: `✅ **${station.name}** bulundu ve çalınıyor.`, ephemeral: true });
            }
            await session.playCurrentStation();
            await session.updateEmbed();
        } else {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: `❌ "**${query}**" ile eşleşen radyo bulunamadı.`, ephemeral: true });
            } else {
                await interaction.reply({ content: `❌ "**${query}**" ile eşleşen radyo bulunamadı.`, ephemeral: true });
            }
        }
    }
};
