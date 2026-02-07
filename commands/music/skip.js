const PlayerUtils = require("../../player.js");
const emoji = require("../../Emojis/EmojiId.js");

module.exports = {
    name: "skip",
    aliases: ["s", "next"],
    description: "Skip the current song",
    usage: "skip",
    voiceChannel: true,
    sameVoiceChannel: true,
    
    async execute(message, args, client) {
        if (message.deletable) message.delete().catch(() => {});
        
        const player = client.riffy.players.get(message.guild.id);
        if (!player) {
            return message.channel.send("❌ No music is currently playing!")
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));
        }
        if (!player.queue.length && !player.current) {
            return message.channel.send("❌ There are no songs to skip!")
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));
        }
        
        const currentTrack = player.current;
        player.stop();
        
        const embed = PlayerUtils.createEmbed(
            "#0099ff",
            `${emoji.skip} Song Skipped`,
            `Skipped **${currentTrack.info.title}**\nSkipped by ${message.author}`
        );
        
        message.channel.send({ embeds: [embed] })
            .then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));
    },
};
