const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const { Player } = require('discord-player');
const { DefaultExtractors } = require('@discord-player/extractor');
const { YoutubeiExtractor } = require('discord-player-youtubei');
const play = require('play-dl');
const { glob } = require('glob');
const YtdlExtractor = require('./customExtractors/YtdlExtractor');

class ExtendedClient extends Client {
    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ],
            partials: [Partials.Channel],
            allowedMentions: { parse: ['users', 'roles'], repliedUser: false }
        });

        this.commands = new Collection();
        this.radioSessions = new Map();
        this.config = process.env;

        // discord-player initialization
        this.player = new Player(this);

        // Player events
        this.player.events.on('playerStart', (queue, track) => {
            if (queue.metadata && queue.metadata.isRadio) return;
            console.log(`[PLAYER] Now playing: ${track.title}`);
            queue.metadata.channel.send({
                embeds: [{
                    color: 0x3498db,
                    description: `🎶 Şimdi çalıyor: **${track.title}** - ${track.author}`
                }]
            }).catch(() => { });
        });

        this.player.events.on('emptyQueue', (queue) => {
            console.log('[PLAYER] Queue finished.');
        });

        this.player.events.on('emptyChannel', (queue) => {
            console.log('[PLAYER] Voice channel empty, leaving.');
        });

        this.player.events.on('playerSkip', (queue, track) => {
            console.log(`[PLAYER] Skipped (no stream): ${track.title}`);
        });

        this.player.events.on('disconnect', (queue) => {
            console.log('[PLAYER] Disconnected.');
        });

        // Error listeners removed to prevent recursion/stack overflow
        // We rely on localized try-catch in commands

        // Initialize Logger
        this.logger = new (require('../services/Logger'))(this);
    }

    async loadCommands() {
        const commandFiles = await glob('commands/**/*.js', { cwd: process.cwd(), absolute: true });
        commandFiles.forEach((file) => {
            const command = require(file);
            if (!command.name || !command.run) return console.warn(`[WARN] Missing name/logic: ${file}`);
            this.commands.set(command.name, command);
            console.log(`[CMD] Loaded ${command.name}`);
        });
    }

    async loadEvents() {
        const eventFiles = await glob('events/**/*.js', { cwd: process.cwd(), absolute: true });
        eventFiles.forEach((file) => {
            const event = require(file);
            if (event.once) {
                this.once(event.name, (...args) => event.execute(...args, this));
            } else {
                this.on(event.name, (...args) => event.execute(...args, this));
            }
            console.log(`[EVENT] Loaded ${event.name}`);
        });
    }

    async start() {
        // Register custom YtdlExtractor FIRST for priority
        await this.player.extractors.register(YtdlExtractor, {});

        // Load default extractors BUT filter out legacy YouTubeExtractor to avoid conflicts
        try {
            const { YouTubeExtractor } = require('@discord-player/extractor');
            const filteredExtractors = DefaultExtractors.filter(ext => ext !== YouTubeExtractor);
            await this.player.extractors.loadMulti(filteredExtractors);
            console.log(`[PLAYER] Loaded ${filteredExtractors.length} default extractors (excluding legacy YouTube).`);
        } catch (e) {
            console.error('[PLAYER] Failed to filter extractors, loading all defaults:', e);
            await this.player.extractors.loadMulti(DefaultExtractors);
        }

        console.log('[PLAYER] Extractors initialized.');
        await this.loadCommands();
        await this.loadEvents();
        await this.login(process.env.TOKEN);
    }
}

module.exports = ExtendedClient;
