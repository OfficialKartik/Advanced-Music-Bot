const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "jump",
    aliases: ["skipto"],
    description: "Jump to a specific song in the queue (0 = current song)",
    usage: "jump <index>",

    async execute(message, args, client) {
        if (message.deletable) message.delete().catch(() => {});

        const player = client.riffy.players.get(message.guild.id);

        if (!player || (!player.queue || player.queue.size === 0) && !player.current) {
            return message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#ff0000")
                        .setTitle("No Music Playing")
                        .setDescription("There's no song to jump to!")
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
                        .setDescription(`Please provide a number between **0** and **${player.queue.size}**.\n(0 = restart current song)`)
                        .setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                        .setTimestamp()
                ]
            }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));
        }

       
        if (index === 0) {
            const currentTrack = player.current;
            player.stop(); 
            return message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#00ff00")
                        .setTitle("🔄 Restarted Current Song")
                        .setDescription(`Restarted **[${currentTrack.info.title}](${currentTrack.info.uri})**`)
                        .setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                        .setTimestamp()
                ]
            }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));
        }

      
        const jumpTo = index - 1; 
        const jumpedTrack = player.queue[jumpTo];
        player.queue.splice(0, jumpTo); 
        player.stop(); 

        return message.channel.send({
            embeds: [
                new EmbedBuilder()
                    .setColor("#00ff00")
                    .setTitle("⏩ Jumped to Song")
                    .setDescription(`Now playing **[${jumpedTrack.info.title}](${jumpedTrack.info.uri})**`)
                    .setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                    .setTimestamp()
            ]
        }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));
    }
};
