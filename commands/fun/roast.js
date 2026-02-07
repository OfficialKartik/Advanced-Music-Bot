const { EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
    name: "roast",
    aliases: ["insult"],
    description: "Roast someone or yourself",
    usage: "roast [@user]",

    async execute(message) {
        if (message.deletable) message.delete().catch(() => {});

        const roasts = JSON.parse(
            fs.readFileSync(path.join(__dirname, "../../data/roasts.json"), "utf8")
        );
        const roast = roasts[Math.floor(Math.random() * roasts.length)];

        let target = message.mentions.users.first() || message.author;

        const embed = new EmbedBuilder()
            .setColor("#ff0000")
            .setTitle("🔥 Roast Time!")
            .setDescription(`${target}, ${roast}`)
            .setFooter({ text: `Roasted by ${message.author.username}` })
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }
};
