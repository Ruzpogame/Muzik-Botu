const { BaseExtractor, QueryType } = require('discord-player');
const ytdl = require('@distube/ytdl-core');
const play = require('play-dl');
const { spawn, execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const ffmpegPath = require('ffmpeg-static');

class YtdlExtractor extends BaseExtractor {
    static identifier = 'com.discord-player.ytdlextractor';

    async validate(query, type) {
        try {
            if (typeof query === 'string') {
                if (ytdl.validateURL(query)) return true;
                if (query.startsWith('http')) return true;
            }
            return type === QueryType.YOUTUBE_SEARCH;
        } catch (e) {
            return false;
        }
    }

    async handle(query, context) {
        try {
            // Is it a YouTube URL?
            const isYoutube = ytdl.validateURL(query);

            if (typeof query === 'string' && (isYoutube || query.startsWith('http'))) {
                // If generic HTTP stream (Radio), skip yt-dlp metadata fetch to save time/errors
                // Just return a track object immediately
                if (!isYoutube) {
                    return {
                        playlist: null,
                        tracks: [{
                            title: 'Radio Stream',
                            duration: 0,
                            thumbnail: null,
                            views: 0,
                            author: 'Radio',
                            source: 'arbitrary', // Mark as arbitrary
                            url: query
                        }]
                    };
                }

                // If YouTube, use yt-dlp for metadata
                const ytDlpPath = path.join(process.cwd(), 'yt-dlp.exe');
                const info = await new Promise((resolve, reject) => {
                    execFile(ytDlpPath, ['-J', '--no-warnings', '--geo-bypass', '--flat-playlist', query], { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
                        if (error) reject(error);
                        else {
                            try { resolve(JSON.parse(stdout)); }
                            catch (e) { reject(e); }
                        }
                    });
                });

                return {
                    playlist: null,
                    tracks: [{
                        title: info.title,
                        duration: formatDuration(info.duration || 0),
                        durationMS: (info.duration || 0) * 1000,
                        thumbnail: info.thumbnail,
                        views: info.view_count || 0,
                        author: info.uploader || info.channel || 'Unknown',
                        source: 'youtube',
                        url: info.webpage_url || query
                    }]
                };
            }

            // Search Queries
            else {
                const results = await play.search(query, {
                    limit: 1,
                    source: { youtube: 'video' }
                });

                if (!results || results.length === 0) return { playlist: null, tracks: [] };

                const vid = results[0];
                return {
                    playlist: null,
                    tracks: [{
                        title: vid.title,
                        duration: vid.durationRaw,
                        durationMS: vid.durationInSec * 1000,
                        thumbnail: vid.thumbnails[0]?.url,
                        views: vid.views,
                        author: vid.channel?.name || 'Unknown',
                        source: 'youtube',
                        url: vid.url
                    }]
                };
            }
        } catch (e) {
            console.error('[YtdlExtractor] Error handling query:', e);
            return { playlist: null, tracks: [] };
        }
    }

    async stream(info) {
        try {
            // Check source
            const isYoutube = info.source === 'youtube' || (info.url && ytdl.validateURL(info.url));

            if (isYoutube) {
                // USE YT-DLP FOR YOUTUBE
                const ytDlpPath = path.join(process.cwd(), 'yt-dlp.exe');
                if (!fs.existsSync(ytDlpPath)) throw new Error('yt-dlp.exe not found!');

                console.log(`[YtdlExtractor] Spawning yt-dlp for YouTube: ${info.url}`);

                const child = spawn(ytDlpPath, [
                    info.url,
                    '-o', '-',
                    '-q',
                    '-f', 'bestaudio',
                    '--no-playlist',
                    '--geo-bypass',
                    '--no-warnings'
                ]);

                if (!child || !child.stdout) throw new Error('Failed to spawn yt-dlp');

                child.stderr.on('data', d => console.error(`[yt-dlp] ${d.toString()}`));
                return child.stdout;

            } else {
                // USE FFMPEG FOR RADIO / GENERIC STREAMS – stable, minimal disconnect/reconnect
                console.log(`[YtdlExtractor] Radyo stream: ${info.url}`);

                const child = spawn(ffmpegPath, [
                    '-user_agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    '-headers', 'Icy-MetaData: 1\r\n',
                    '-reconnect', '1',
                    '-reconnect_streamed', '1',
                    '-reconnect_on_network_error', '1',
                    '-reconnect_on_http_error', '4xx,5xx',
                    '-reconnect_at_eof', '1',
                    '-reconnect_delay_max', '30',
                    '-analyzeduration', '5000000',
                    '-probesize', '5000000',
                    '-i', info.url,
                    '-vn',
                    '-acodec', 'libmp3lame',
                    '-f', 'mp3',
                    '-ac', '2',
                    '-ar', '44100',
                    '-'
                ]);

                if (!child || !child.stdout) throw new Error('Failed to spawn ffmpeg');

                // Sadece hata / reconnect mesajlarını logla; sürekli "size=... speed=..." yazmasın
                child.stderr.on('data', (d) => {
                    const line = d.toString().trim();
                    if (!line) return;
                    const lower = line.toLowerCase();
                    if (lower.includes('error') || lower.includes('failed') || lower.includes('reconnect') || lower.includes('invalid')) {
                        console.warn(`[ffmpeg] ${line}`);
                    }
                });

                return child.stdout;
            }
        } catch (e) {
            console.error('[YtdlExtractor] Error streaming:', e);
            throw e;
        }
    }
}

function formatDuration(seconds) {
    if (!seconds) return '00:00';
    const num = Math.floor(seconds);
    const min = Math.floor(num / 60);
    const sec = num % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

module.exports = YtdlExtractor;
