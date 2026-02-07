const { EmbedBuilder } = require("discord.js");
module.exports = {
    name: "coinflip",
    aliases: ["coin", "flip", "cf"],
    description: "Flip a coin",
    usage: "coinflip",
    
    async execute(message, args, client) {
        const result = Math.random() < 0.5 ? "Heads" : "Tails";
        const emoji = result === "Heads" ? "🪙" : "🥉";
        
        const embed = new EmbedBuilder()
            .setColor("#ffd700")
            .setTitle("🪙 Coin Flip")
            .setDescription(`${emoji} The coin landed on **${result}**!`)
            .setFooter({ text: `Flipped by ${message.author.username}` })
            .setTimestamp();
        
        message.channel.send({ embeds: [embed] });
    },
};
