const { SlashCommandBuilder } = require("discord.js");
const QuickChart = require("quickchart-js");
const { Op } = require("sequelize");
const Log = require("../../models/Log");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("me")
    .setDescription("View your immersion logs")
    .addStringOption((option) =>
      option
        .setName("range")
        .setDescription("Immersion log time range")
        .addChoices(
          { name: "weekly", value: "weekly" },
          { name: "monthly", value: "monthly" },
          { name: "yearly", value: "yearly" }
        )
    ),
  async execute(interaction) {
    const userId = interaction.user.id;
    const range = interaction.options.getString("range");

    let startDate;
    let endDate = new Date(); // Current date and time

    switch (range) {
      case "weekly":
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "monthly":
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        break;
      case "yearly":
        startDate = new Date(endDate.getFullYear(), 0, 1);
        break;
    }

    const logs = await Log.findAll({
      where: {
        userId: userId,
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
      },
    });

    // Map media types to colors
    const mediaTypeColors = {
      "visual novel": "red",
      anime: "blue",
    };

    // Extract data from logs for the chart
    const dates = logs.map((log) => log.createdAt.toDateString());
    const values = logs.map((log) => log.duration);
    const colors = logs.map((log) => mediaTypeColors[log.mediaType] || "gray");

    // Create chart
    const chart = new QuickChart();
    chart.setConfig({
      type: "bar",
      data: {
        labels: dates,
        datasets: [
          {
            label: "Immersion Log",
            data: values,
            backgroundColor: colors,
          },
        ],
      },
      options: {
        scales: {
          x: {
            type: "category",
            title: {
              display: true,
              text: "Date",
            },
          },
          y: {
            title: {
              display: true,
              text: "Duration",
            },
          },
        },
      },
    });

    const chartUrl = chart.getUrl();

    // Send the chart to the user
    await interaction.reply(`Here is your immersion log chart: ${chartUrl}`);
  },
};
