const { SlashCommandBuilder } = require("discord.js");
const User = require("../../models/User.js");
const Log = require("../../models/Log.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("log")
    .setDescription("Log your immersion")
    .addStringOption((option) =>
      option
        .setName("media_type")
        .setDescription("Options")
        .setRequired(true)
        .addChoices(
          { name: "vn", value: "visual novel" },
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
    const mediaType = interaction.options.getString("media_type");
    const amount = interaction.options.getNumber("amount");
    const userId = interaction.user.id;

    // Sanity check
    if (amount < 1) {
      await interaction.reply({
        content: "The amount must be greater than 0.",
        ephemeral: false,
      });
      return;
    }

    // Ensure the user exists in the data base
    let user = await User.findByPk(userId);
    if (!user) {
      user = await User.create({ userId: userId, userXp: 0 });
    }

    // Store in database
    try {
      await Log.newLog(userId, amount, mediaType);
      await interaction.reply({
        content: "Log successfully created in database.",
        ephemeral: false,
      });
    } catch (error) {
      await interaction.reply({
        content: "There was an error logging your immersion.",
        ephemeral: false,
      });
    }
  },
};
