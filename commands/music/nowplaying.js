const PlayerUtils = require("../../player.js");
const emoji = require("../../Emojis/EmojiId.js");

module.exports = {
    name: "nowplaying",
    aliases: ["np", "current"],
    description: "Show the currently playing song",
    usage: "nowplaying",
    
    async execute(message, args, client) {
        // Delete user's command instantly
        if (message.deletable) message.delete().catch(() => {});

        const player = client.riffy.players.get(message.guild.id);
        
        if (!player || !player.current) {
            return message.channel.send("❌ No music is currently playing!")
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));
        }
        
        const embed = PlayerUtils.createNowPlayingEmbed(player.current, player);
        embed.title = `${emoji.play} Now Playing`; // Add emoji to title

        message.channel.send({ embeds: [embed] })
            .then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000)); // Auto delete after 5 sec
    },
};
