const PlayerUtils = require("../../player.js");

module.exports = {
    name: "queue",
    aliases: ["q"],
    description: "Show the full music queue",
    usage: "queue",

    async execute(message, args, client) {
 
        if (message.deletable) message.delete().catch(() => {});

        const player = client.riffy.players.get(message.guild.id);
        if (!player || (!player.queue || player.queue.size === 0) && !player.current) {
            return message.channel.send("❌ No music is currently playing!")
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));
        }

        const tracksPerEmbed = 10;
        const queueList = player.queue.map((track, i) =>
            `**${i + 1}.** [${track.info.title}](${track.info.uri}) — \`${PlayerUtils.formatDuration(track.info.length)}\` | Requested by: **${track.info.requester.username}**`
        );

        const currentTrack = player.current
            ? `🎶 **Now Playing:** [${player.current.info.title}](${player.current.info.uri}) — \`${PlayerUtils.formatDuration(player.current.info.length)}\`\n`
            : "";

        
        for (let i = 0; i < queueList.length; i += tracksPerEmbed) {
            const chunk = queueList.slice(i, i + tracksPerEmbed);
            const embed = {
                color: 0x00AE86,
                title: `📜 Music Queue (${i + 1} - ${Math.min(i + tracksPerEmbed, queueList.length)})`,
                description: (i === 0 ? currentTrack + "\n" : "") + chunk.join("\n"),
                footer: { text: `Total Songs: ${player.queue.size} | Volume: ${player.volume}%` },
                timestamp: new Date()
            };

          
            await new Promise(res => setTimeout(res, i === 0 ? 0 : 1500));
            message.channel.send({ embeds: [embed] })
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000));
        }
    },
};
