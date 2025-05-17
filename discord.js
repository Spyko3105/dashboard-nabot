const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

client.on('messageCreate', message => {
    if (message.author.bot) return;
    if (message.content === '!ping') {
        message.reply('Pong !');
    }
});

client.login('MTM2MTgyNjQ1NTQwNjc3MjQwOA.GKEBEB.KRlPUV814vek0vyHAEL-iAq0Rp11AiPu6oX9-Q');
