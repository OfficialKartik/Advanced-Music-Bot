const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "loop",
    aliases: ["repeat"],
    description: "Set loop mode: none, track, or queue",
    usage: "loop <none|track|queue>",

    async execute(message, args, client) {
        // Delete the user's command message if possible
        if (message.deletable) message.delete().catch(() => {});

        const player = client.riffy.players.get(message.guild.id);

        if (!player || !player.current) {
            return message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#ff0000")
                        .setTitle("No Music Playing")
                        .setDescription("You need to play some music first!")
                        .setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                        .setTimestamp()
                ]
            }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));
        }

        if (!args[0]) {
            return message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#ffaa00")
                        .setTitle("Missing Loop Mode")
                        .setDescription("Please specify one of the following:\n`none`, `track`, `queue`")
                        .setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                        .setTimestamp()
                ]
            }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));
        }

        const mode = args[0].toLowerCase();
        let modeName;

        switch (mode) {
            case "none":
                player.setLoop("none");
                modeName = "Loop Disabled";
                break;
            case "track":
                player.setLoop("track");
                modeName = "Looping Current Track";
                break;
            case "queue":
                player.setLoop("queue");
                modeName = "Looping Entire Queue";
                break;
            default:
                return message.channel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("#ffaa00")
                            .setTitle("Invalid Mode")
                            .setDescription("Valid options: `none`, `track`, `queue`")
                            .setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                            .setTimestamp()
                    ]
                }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));
        }

        return message.channel.send({
            embeds: [
                new EmbedBuilder()
                    .setColor("#00ff00")
                    .setTitle("🔁 Loop Mode Changed")
                    .setDescription(`Mode set to: **${modeName}**`)
                    .setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                    .setTimestamp()
            ]
        }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));
    }
};
