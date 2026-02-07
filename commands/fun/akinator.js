const { Akinator } = require("@aqul/akinator-api");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require("discord.js");

/**
 * Normalize answers from API
 */
function normalizeAnswers(answers) {
  if (!answers || !answers.length) {
    return ["Yes", "No", "Don't know", "Probably", "Probably not"];
  }

  return answers
    .map(a => (typeof a === "string" ? a : a.answer))
    .slice(0, 5);
}

module.exports = {
  name: "akinator",
  description: "Play Akinator - the mind-reading genie!",
  usage: "akinator",
  cooldown: 5,

  async execute(message, args, client) {
    try {
      const aki = new Akinator({ region: "en", childMode: false });
      await aki.start();

      let answers = normalizeAnswers(aki.possibleAnswers);

      const embed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle("🧞‍♂️ Akinator")
        .setDescription(`**Question:** ${aki.question}`)
        .addFields({
          name: "Progress",
          value: `${Math.round(aki.progress)}%`,
          inline: true
        })
        .setFooter({ text: "Think of a character!" });

      const row = new ActionRowBuilder().addComponents(
        answers.map((answer, index) =>
          new ButtonBuilder()
            .setCustomId(`aki_${message.author.id}_${index}`)
            .setLabel(answer)
            .setStyle(ButtonStyle.Primary)
        )
      );

      const gameMessage = await message.channel.send({
        embeds: [embed],
        components: [row]
      });

      const collector = gameMessage.createMessageComponentCollector({
        time: 5 * 60 * 1000,
        filter: i => i.user.id === message.author.id
      });

      collector.on("collect", async interaction => {
        try {
          // ✅ VERY IMPORTANT — ACKNOWLEDGE IMMEDIATELY
          await interaction.deferUpdate();

          const index = Number(interaction.customId.split("_")[2]);
          await aki.answer(index);

          // 🎯 WIN CONDITION
          if (aki.isWin) {
            const win = aki.suggestion;

            const winEmbed = new EmbedBuilder()
              .setColor(0x2ecc71)
              .setTitle("🎯 I got it!")
              .setDescription(
                `**${win?.name || aki.sugestion_name}**\n${win?.description || ""}`
              )
              .setImage(win?.photo || null)
              .setFooter({
                text: `Guessed in ${aki.step + 1} questions`
              });

            await gameMessage.edit({
              embeds: [winEmbed],
              components: []
            });

            collector.stop("win");
            return;
          }

          // 🔁 NEXT QUESTION
          answers = normalizeAnswers(aki.possibleAnswers);

          const newEmbed = new EmbedBuilder()
            .setColor(0x3498db)
            .setTitle("🧞‍♂️ Akinator")
            .setDescription(`**Question:** ${aki.question}`)
            .addFields({
              name: "Progress",
              value: `${Math.round(aki.progress)}%`,
              inline: true
            })
            .setFooter({ text: `Question ${aki.step + 1}` });

          const newRow = new ActionRowBuilder().addComponents(
            answers.map((answer, i) =>
              new ButtonBuilder()
                .setCustomId(`aki_${message.author.id}_${i}`)
                .setLabel(answer)
                .setStyle(ButtonStyle.Primary)
            )
          );

          await gameMessage.edit({
            embeds: [newEmbed],
            components: [newRow]
          });

        } catch (err) {
          console.error("Akinator step error:", err);
          collector.stop("error");
        }
      });

      collector.on("end", (_, reason) => {
        if (reason !== "win") {
          gameMessage.edit({
            embeds: [
              new EmbedBuilder()
                .setColor(0xe74c3c)
                .setTitle("⌛ Game Ended")
                .setDescription("Akinator game timed out.")
            ],
            components: []
          }).catch(() => {});
        }
      });

    } catch (err) {
      console.error("Akinator start error:", err);
      message.channel.send("❌ Failed to start Akinator. Try again.");
    }
  }
};