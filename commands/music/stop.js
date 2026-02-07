const PlayerUtils = require("../../player.js");
const emoji = require("../../Emojis/EmojiId.js");

module.exports = {
    name: "stop",
    aliases: ["disconnect", "dc"],
    description: "Stop the music and disconnect the bot",
    usage: "stop",
    voiceChannel: true,
    sameVoiceChannel: true,
    
    async execute(message, args, client) {
        if (message.deletable) message.delete().catch(() => {});
        
        const player = client.riffy.players.get(message.guild.id);
        if (!player) {
            return message.channel.send("❌ No music is currently playing!")
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));
        }
        
        player.destroy();
        
        const embed = PlayerUtils.createEmbed(
            "#ff0000",
            `${emoji.leave} Music Stopped`,
            `Stopped by ${message.author}`
        );
        
        message.channel.send({ embeds: [embed] })
            .then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));
    },
};
