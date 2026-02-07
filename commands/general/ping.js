const { 
    ContainerBuilder,
    SectionBuilder,
    TextDisplayBuilder,
    ThumbnailBuilder,
    MessageFlags
} = require("discord.js");

module.exports = {
    name: "ping",
    aliases: ["latency"],
    description: "Show bot latency",
    usage: "ping",
    
    async execute(message, args, client) {
        const sent = await message.reply("🏓 Pinging...");
        const timeDiff = sent.createdTimestamp - message.createdTimestamp;
        const apiLatency = Math.round(client.ws.ping);
        
   
        const getLatencyStatus = (latency) => {
            if (latency < 100) return { status: "Excellent", color: 0x00FF00 };
            if (latency < 600) return { status: "Good", color: 0xFFFF00 };
            if (latency < 1000) return { status: "Fair", color: 0xFF8000 };
            return { status: "Poor", color: 0xFF0000 };
        };
        
        const messageStatus = getLatencyStatus(timeDiff);
        const apiStatus = getLatencyStatus(apiLatency);
        
        const pingContainer = new ContainerBuilder()
            .setAccentColor(messageStatus.color)
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(`# 🏓 Pong!\nLatency information for ${client.user.username}`)
            )
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder()
                            .setContent(`**📨 Message Latency:** ${timeDiff}ms *(${messageStatus.status})*\n**💓 API Latency:** ${apiLatency}ms *(${apiStatus.status})*\n**🕐 Response Time:** ${new Date().toLocaleTimeString()}`)
                    )
                    .setThumbnailAccessory(
                        new ThumbnailBuilder()
                            .setURL(client.user.displayAvatarURL({ dynamic: true }))
                            .setDescription(`${client.user.username} bot status`)
                    )
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(`*Requested by ${message.author.tag} • ${new Date().toLocaleString()}*`)
            );
        
        sent.edit({ 
            content: null, 
            components: [pingContainer], 
            flags: MessageFlags.IsComponentsV2 
        });
    },
};
