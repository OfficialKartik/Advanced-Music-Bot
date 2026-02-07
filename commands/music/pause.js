const PlayerUtils = require("../../player.js");
const emoji = require("../../Emojis/EmojiId.js");

module.exports = {
    name: "pause",
    aliases: [],
    description: "Pause the current song",
    usage: "pause",
    voiceChannel: true,
    sameVoiceChannel: true,
    
    async execute(message, args, client) {
        if (message.deletable) message.delete().catch(() => {});
        
        const player = client.riffy.players.get(message.guild.id);
        if (!player) {
            return message.channel.send("❌ No music is currently playing!")
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));
        }
        if (player.paused) {
            return message.channel.send("❌ The music is already paused!")
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));
        }
        
        player.pause(true);
        
        const embed = PlayerUtils.createEmbed(
            "#ffcc00",
            `${emoji.pause} Music Paused`,
            `Paused by ${message.author}`
        );
        
        message.channel.send({ embeds: [embed] })
            .then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));
    },
};
