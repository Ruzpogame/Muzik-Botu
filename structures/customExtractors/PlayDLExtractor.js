const { BaseExtractor } = require('discord-player');
const play = require('play-dl');

class PlayDLExtractor extends BaseExtractor {
    static identifier = 'com.discord-player.playdlextractor';

    async validate(query, type) {
        try {
            return (await play.validate(query)) === 'yt_video';
        } catch (e) {
            return false;
        }
    }

    async handle(query, context) {
        try {
            if ((await play.validate(query)) === 'yt_video') {
                const info = await play.video_info(query);
                return {
                    playlist: null,
                    tracks: [{
                        title: info.video_details.title,
                        duration: info.video_details.durationInSec * 1000,
                        description: info.video_details.description,
                        thumbnail: info.video_details.thumbnails[0].url,
                        views: info.video_details.views,
                        author: info.video_details.channel.name,
                        requestedBy: context.requestedBy,
                        source: 'youtube',
                        url: info.video_details.url,
                        raw: info
                    }]
                };
            }
        } catch (e) {
            console.error('[PlayDLExtractor] Error handling query:', e);
            return { playlist: null, tracks: [] };
        }
        return { playlist: null, tracks: [] };
    }

    async stream(info) {
        try {
            const stream = await play.stream(info.url, {
                discordPlayerCompatibility: true
            });
            return stream.stream;
        } catch (e) {
            console.error('[PlayDLExtractor] Error streaming:', e);
            throw e;
        }
    }
}

module.exports = PlayDLExtractor;
