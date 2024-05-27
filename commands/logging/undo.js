const { SlashCommandBuilder } = require("discord.js");
const User = require("../../models/User.js");
const Log = require("../../models/Log.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("undo")
    .setDescription("Undo your more recent log entry"),
  async execute(interaction) {
    const userId = interaction.user.id;

    // Ensure user exists
    const userExits = await User.findByPk(userId);
    if (!userExits) {
      await interaction.reply("Error: user doesn't exist.");
      return;
    }

    // Find latest log
    const latestLog = await Log.findOne({
      where: { userId: userId },
      order: [["createdAt", "DESC"]],
    });

    if (!latestLog) {
      await interaction.reply("Error: no logs found.");
      return;
    }

    // Reverse XP gain
    const user = await User.findByPk(userId);
    const pointsToRemove = Log.calculatePoints(
      latestLog.mediaType,
      latestLog.duration
    );
    user.userXp -= pointsToRemove;
    await user.save();

    // Delete the latest log
    await latestLog.destroy();

    // Inform the user
    await interaction.reply({
      content: "Your latest log entry has been undone.",
      ephemeral: false,
    });
  },
};
