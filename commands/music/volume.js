const PlayerUtils = require("../../player.js");
const emoji = require("../../Emojis/EmojiId.js");

module.exports = {
    name: "volume",
    aliases: ["vol", "v"],
    description: "Set or show the volume",
    usage: "volume [1-100]",
    voiceChannel: true,
    sameVoiceChannel: true,
    
    async execute(message, args, client) {
        if (message.deletable) message.delete().catch(() => {});
        
        const player = client.riffy.players.get(message.guild.id);
        if (!player) {
            return message.channel.send("❌ No music is currently playing!")
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));
        }
        
        if (!args[0]) {
            return message.channel.send(`🔊 Current volume: **${player.volume}%**`)
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));
        }
        
        const volume = parseInt(args[0]);
        if (isNaN(volume) || volume < 1 || volume > 100) {
            return message.channel.send("❌ Volume must be between 1 and 100!")
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));
        }
        
        player.setVolume(volume);
        
        const embed = PlayerUtils.createEmbed(
            "#0099ff",
            `${emoji.vol_up} Volume Changed`,
            `Volume set to **${volume}%** by ${message.author}`
        );
        
        message.channel.send({ embeds: [embed] })
            .then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));
    },
};
