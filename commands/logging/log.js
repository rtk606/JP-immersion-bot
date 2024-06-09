const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../../models/User.js");
const Log = require("../../models/Log.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("log")
    .setDescription("Log your immersion")
    .addStringOption((option) =>
      option.setName("title").setDescription("title").setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("media_type")
        .setDescription("Options")
        .setRequired(true)
        .addChoices(
          { name: "visual novel", value: "visual novel" },
          { name: "anime", value: "anime" },
          { name: "manga", value: "manga" },
          { name: "listening", value: "listening" },
          { name: "reading", value: "reading" },
          { name: "readtime", value: "readtime" },
          { name: "book", value: "book" }
        )
    )
    .addNumberOption((option) =>
      option
        .setName("amount")
        .setDescription("Enter the amount")
        .setRequired(true)
    ),
  async execute(interaction) {
    const title = interaction.options.getString("title");
    const mediaType = interaction.options.getString("media_type");
    const amount = interaction.options.getNumber("amount");
    const userId = interaction.user.id;
    const username = interaction.user.username;

    if (amount < 1) {
      await interaction.reply({
        content: "The amount must be greater than 0.",
        ephemeral: false,
      });
      return;
    }

    let user = await User.findByPk(userId);
    if (!user) {
      user = await User.create({ userId: userId, userXp: 0 });
    }

    try {
      const log = await Log.newLog(title, userId, amount, mediaType);
      const xpEarned = Log.calculatePoints(mediaType, amount);
      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(`${username} logged immersion 🥳`)
        .setDescription(
          "Immersion logged. Use /me to view your immersion history.\n Use /leaderboard to view the global immersion leaderboard."
        )
        .setThumbnail(interaction.user.avatarURL())
        .setImage(
          "https://www.menudo-fansub.com/mkportal/modules/proyectos/archivos/314_por_bannerpeliwapa2.png"
        )
        .addFields(
          { name: "Title: ", value: title, inline: true },
          { name: "Media Type: ", value: mediaType, inline: true },
          { name: "XP Earned: ", value: `${xpEarned} XP` }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: false });
    } catch (error) {
      console.error("Error during log creation:", error);
      await interaction.reply({
        content: "There was an error logging your immersion.",
        ephemeral: true,
      });
    }
  },
};
