const PlayerUtils = require("../../player.js");
const emoji = require("../../Emojis/EmojiId.js");

module.exports = {
    name: "clear",
    aliases: ["empty"],
    description: "Clear the queue",
    usage: "clear",
    voiceChannel: true,
    sameVoiceChannel: true,
    
    async execute(message, args, client) {
        if (message.deletable) message.delete().catch(() => {});
        
        const player = client.riffy.players.get(message.guild.id);
        if (!player) {
            return message.channel.send("❌ No music is currently playing!")
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));
        }
        
        if (player.queue.length === 0) {
            return message.channel.send("❌ The queue is already empty!")
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));
        }
        
        const queueSize = player.queue.length;
        player.queue.clear();
        
        const embed = PlayerUtils.createEmbed(
            "#ff0000",
            `${emoji.clear} Queue Cleared`,
            `Cleared **${queueSize}** songs from queue\nCleared by ${message.author}`
        );
        
        message.channel.send({ embeds: [embed] })
            .then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));
    },
};
