const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "remove",
    aliases: ["rm"],
    description: "Remove a song from the queue by its index (0 = current song)",
    usage: "remove <index>",

    async execute(message, args, client) {
        if (message.deletable) message.delete().catch(() => {});

        const player = client.riffy.players.get(message.guild.id);

        if (!player || (!player.queue || player.queue.size === 0) && !player.current) {
            return message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#ff0000")
                        .setTitle("No Music Playing")
                        .setDescription("There's no song to remove!")
                        .setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                        .setTimestamp()
                ]
            }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));
        }

        const index = parseInt(args[0], 10);

        if (isNaN(index) || index < 0 || index > player.queue.size) {
            return message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#ffaa00")
                        .setTitle("Invalid Index")
                        .setDescription(`Please provide a number between **0** and **${player.queue.size}**.\n(0 = currently playing)`)
                        .setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                        .setTimestamp()
                ]
            }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));
        }

        // Removing currently playing song
        if (index === 0) {
            const removedTrack = player.current;
            player.stop(); // Skips the current track
            return message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#00ff00")
                        .setTitle("⏭ Skipped Current Song")
                        .setDescription(`Skipped **[${removedTrack.info.title}](${removedTrack.info.uri})**`)
                        .setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                        .setTimestamp()
                ]
            }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));
        }

        // Adjust for 1-based queue indexing
        const removedTrack = player.queue[index - 1];
        player.queue.splice(index - 1, 1);

        return message.channel.send({
            embeds: [
                new EmbedBuilder()
                    .setColor("#00ff00")
                    .setTitle("✅ Track Removed")
                    .setDescription(`Removed **[${removedTrack.info.title}](${removedTrack.info.uri})** from the queue.`)
                    .setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                    .setTimestamp()
            ]
        }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));
    }
};
