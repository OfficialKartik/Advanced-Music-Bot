const PlayerUtils = require("../../player.js");
const emoji = require("../../Emojis/EmojiId.js");

module.exports = {
    name: "shuffle",
    aliases: ["mix"],
    description: "Shuffle the queue",
    usage: "shuffle",
    voiceChannel: true,
    sameVoiceChannel: true,
    
    async execute(message, args, client) {
        if (message.deletable) message.delete().catch(() => {});

        const player = client.riffy.players.get(message.guild.id);
        if (!player) {
            return message.channel.send("❌ No music is currently playing!")
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));
        }
        
        if (player.queue.length < 2) {
            return message.channel.send("❌ Need at least 2 songs in queue to shuffle!")
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));
        }
        
        const shuffled = PlayerUtils.shuffleArray(player.queue);
        player.queue.clear();
        shuffled.forEach(track => player.queue.add(track));
        
        const embed = PlayerUtils.createEmbed(
            "#0099ff",
            `${emoji.shuffle} Queue Shuffled`,
            `Queue shuffled by ${message.author}`
        );


        message.channel.send({ embeds: [embed] })
            .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000));
    },
};
