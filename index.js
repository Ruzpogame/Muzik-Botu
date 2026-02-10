require('dotenv').config();
const ExtendedClient = require('./structures/ExtendedClient');

const client = new ExtendedClient();

client.start();

// Process error handling to prevent crash
process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at:', p, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});
