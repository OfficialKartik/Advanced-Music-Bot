const PlayerUtils = require("../../player.js");
const emoji = require("../../Emojis/EmojiId.js");

module.exports = {
    name: "resume",
    aliases: ["unpause"],
    description: "Resume the paused song",
    usage: "resume",
    voiceChannel: true,
    sameVoiceChannel: true,
    
    async execute(message, args, client) {
        if (message.deletable) message.delete().catch(() => {});
        
        const player = client.riffy.players.get(message.guild.id);
        if (!player) {
            return message.channel.send("❌ No music is currently playing!")
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));
        }
        if (!player.paused) {
            return message.channel.send("❌ The music is not paused!")
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));
        }
        
        player.pause(false);
        
        const embed = PlayerUtils.createEmbed(
            "#00ff00",
            `${emoji.resume} Music Resumed`,
            `Resumed by ${message.author}`
        );
        
        message.channel.send({ embeds: [embed] })
            .then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));
    },
};
