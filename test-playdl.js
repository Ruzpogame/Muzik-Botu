const play = require('play-dl');

async function test() {
    console.log('Testing play-dl...');
    try {
        const url = 'https://www.youtube.com/watch?v=Ye0xXH66y7Y'; // Buz Sarkıtı or similar
        console.log(`Searching/Validating ${url}...`);

        if (await play.validate(url) !== 'yt_video') {
            console.error('Validation failed!');
            return;
        }

        console.log('Fetching video info...');
        const info = await play.video_info(url);
        console.log(`Title: ${info.video_details.title}`);

        console.log('Creating stream...');
        const stream = await play.stream(url, { discordPlayerCompatibility: true });
        console.log('Stream type:', stream.type);
        console.log('Stream created successfully!');
    } catch (e) {
        console.error('Error:', e);
    }
}

test();
