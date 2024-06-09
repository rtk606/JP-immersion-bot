const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Log = require("../../models/Log.js");
const { Op } = require("sequelize");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription(
      "Displays the monthly leaderboard for Japanese immersion tracking."
    ),
  async execute(interaction, client) {
    await interaction.deferReply();
    const leaderboardData = await getMonthlyLeaderboard(client);
    const embed = formatLeaderboardMessage(leaderboardData, interaction.user);
    await interaction.editReply({ embeds: [embed] });
  },
};

async function getMonthlyLeaderboard(client) {
  const startDate = new Date();
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setMonth(startDate.getMonth() + 1);

  try {
    const logs = await Log.findAll({
      where: {
        createdAt: {
          [Op.gte]: startDate,
          [Op.lt]: endDate,
        },
      },
      attributes: ["userId", "mediaType", "duration"],
    });

    const userPoints = {};
    for (let log of logs) {
      const points = Log.calculatePoints(log.mediaType, log.duration);
      if (!userPoints[log.userId]) {
        userPoints[log.userId] = {
          userId: log.userId,
          points: 0,
        };
      }
      userPoints[log.userId].points += points;
    }

    // Fetch usernames from Discord API
    const userIds = Object.keys(userPoints);
    for (let userId of userIds) {
      const user = await client.users.fetch(userId); // Fetch user from Discord
      userPoints[userId].username = user ? user.username : "Unknown User"; // Set username or default
    }

    // Convert to array and sort
    const leaderboard = Object.values(userPoints)
      .sort((a, b) => b.points - a.points)
      .slice(0, 10);

    return leaderboard;
  } catch (error) {
    console.error("Error fetching monthly leaderboard:", error);
    return [];
  }
}

function formatLeaderboardMessage(leaderboardData, user) {
  const embed = new EmbedBuilder()
    .setColor("#0099ff")
    .setTitle("Monthly Immersion Leaderboard")
    .setThumbnail(user.avatarURL())
    .setDescription("🏆 Top users by points for this month:");

  if (leaderboardData.length === 0) {
    embed.addFields({
      name: "No data available",
      value: "There are no logs for this month's leaderboard.",
    });
  } else {
    leaderboardData.forEach((item, index) => {
      embed.addFields({
        name: `${index + 1}. ${item.username}`,
        value: `${item.points.toFixed(2)} Points`,
        inline: true,
      });
    });
  }

  return embed;
}
