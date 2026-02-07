const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
    name: "truthordare",
    aliases: ["tod"],
    description: "Play Truth or Dare with buttons",
    usage: "truthordare",

    async execute(message) {
        if (message.deletable) message.delete().catch(() => {});

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("tod_truth")
                .setLabel("Truth")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("tod_dare")
                .setLabel("Dare")
                .setStyle(ButtonStyle.Danger)
        );

        const msg = await message.channel.send({
            embeds: [
                new EmbedBuilder()
                    .setColor("#ffcc00")
                    .setTitle("🎯 Truth or Dare")
                    .setDescription("Click one of the buttons below to get your question!")
            ],
            components: [row]
        });

        const collector = msg.createMessageComponentCollector({ time: 300000 }); // 5 min session

        collector.on("collect", async interaction => {
            if (interaction.user.id !== message.author.id) {
                return interaction.reply({
                    content: "❌ This is not your game!",
                    ephemeral: true
                });
            }

            if (interaction.customId === "tod_truth") {
                const truths = JSON.parse(
                    fs.readFileSync(path.join(__dirname, "../../data/truth.json"), "utf8")
                );
                const question = truths[Math.floor(Math.random() * truths.length)];

                await interaction.update({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("#3498db")
                            .setTitle("🟦 Truth")
                            .setDescription(question)
                            .setFooter({ text: "Click again for another question!" })
                    ],
                    components: [row]
                });
            } else if (interaction.customId === "tod_dare") {
                const dares = JSON.parse(
                    fs.readFileSync(path.join(__dirname, "../../data/dare.json"), "utf8")
                );
                const question = dares[Math.floor(Math.random() * dares.length)];

                await interaction.update({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("#e74c3c")
                            .setTitle("🟥 Dare")
                            .setDescription(question)
                            .setFooter({ text: "Click again for another challenge!" })
                    ],
                    components: [row]
                });
            }
        });

        collector.on("end", () => {
            if (msg.editable) msg.edit({ components: [] }).catch(() => {});
        });
    }
};
