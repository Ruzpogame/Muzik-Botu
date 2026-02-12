const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType } = require('discord.js');

module.exports = {
    name: 'help',
    description: 'Bot komutlarını gösterir.',
    async run(client, interaction) {
        const categories = {
            music: 'Müzik Komutları',
            general: 'Genel Komutlar'
        };

        const emojis = {
            music: '🎵',
            general: '⚙️'
        };

        const options = Object.keys(categories).map(cat => ({
            label: categories[cat],
            value: cat,
            emoji: emojis[cat]
        }));

        const menu = new StringSelectMenuBuilder()
            .setCustomId('help_menu')
            .setPlaceholder('Bir kategori seçin...')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(menu);

        const embed = new EmbedBuilder()
            .setTitle('Yardım Menüsü')
            .setDescription('Aşağıdaki menüden komutlarını görmek istediğiniz kategoriyi seçin.')
            .setColor('Blue');

        const reply = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 60000
        });

        collector.on('collect', (i) => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: 'Bu menüyü sadece komutu kullanan kişi kullanabilir.', flags: 64 });
            }

            const category = i.values[0];
            const commands = client.commands
                .filter(cmd => {
                    // Primitive category checking based on path or manual list
                    // Since specific paths aren't stored in command object by loader yet,
                    // we'll assume based on command names or we should have stored category in loader.
                    // Let's rely on manual mapping or better, update loader.
                    // For now, manual mapping for simplicity in this file.
                    if (category === 'music') return ['play', 'skip', 'stop', 'pause', 'resume', 'loop', 'shuffle', 'volume', 'nowplaying', 'queue', 'clear', 'lyrics', 'radyo'].includes(cmd.name);
                    if (category === 'general') return ['ayarlar', 'help'].includes(cmd.name);
                    return false;
                })
                .map(cmd => `**/${cmd.name}**: ${cmd.description}`)
                .join('\n');

            const categoryEmbed = new EmbedBuilder()
                .setTitle(`${emojis[category]} ${categories[category]}`)
                .setDescription(commands || 'Bu kategoride komut bulunamadı.')
                .setColor('Blue');

            i.update({ embeds: [categoryEmbed] });
        });
    }
};
