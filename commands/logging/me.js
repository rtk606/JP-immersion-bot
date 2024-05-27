const {
  SlashCommandBuilder,
  EmbedBuilder,
  AttachmentBuilder,
} = require("discord.js");
const QuickChart = require("quickchart-js");
const { Op } = require("sequelize");
const Log = require("../../models/Log");
const fs = require("node:fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("me")
    .setDescription("View your immersion logs")
    .addStringOption((option) =>
      option
        .setName("range")
        .setDescription("Immersion log time range")
        .setRequired(true)
        .addChoices(
          { name: "weekly", value: "weekly" },
          { name: "monthly", value: "monthly" },
          { name: "yearly", value: "yearly" }
        )
    ),
  async execute(interaction) {
    await interaction.deferReply();

    const userId = interaction.user.id;
    const range = interaction.options.getString("range");

    let startDate;
    let endDate = new Date();

    switch (range) {
      case "weekly":
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "monthly":
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        break;
      // TODO change this to all
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

    // Safety check, check if logs array is empty
    if (!logs.length) {
      await interaction.editReply({
        content: "No logs found for the specified time range.",
        ephemeral: false,
      });
      return;
    }

    let uniqueDateLabels = {};
    logs.forEach((log) => {
      const logDate = new Date(log.createdAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const points = Log.calculatePoints(log.mediaType, log.duration);
      if (!uniqueDateLabels[logDate]) {
        uniqueDateLabels[logDate] = {};
      }
      if (!uniqueDateLabels[logDate][log.mediaType]) {
        uniqueDateLabels[logDate][log.mediaType] = 0;
      }
      uniqueDateLabels[logDate][log.mediaType] += points;
    });

    let datasets = [];
    const mediaTypes = [
      "visual novel",
      "anime",
      "manga",
      "listening",
      "reading",
      "readtime",
      "book",
    ];

    mediaTypes.forEach((mediaType) => {
      const dataset = {
        label: mediaType,
        data: [],
        backgroundColor: getBackgroundColor(mediaType),
        stack: "stack 0",
      };

      Object.keys(uniqueDateLabels).forEach((date) => {
        dataset.data.push(uniqueDateLabels[date][mediaType] || 0);
      });

      datasets.push(dataset);
    });

    function getBackgroundColor(mediaType) {
      const colors = {
        "visual novel": "#FF6384",
        anime: "#36A2EB",
        manga: "#FFCE56",
        listening: "#4BC0C0",
        reading: "#9966FF",
        readtime: "#FF9F40",
        book: "#C9CBCF",
      };
      return colors[mediaType] || "#FFFFFF";
    }

    const chart = new QuickChart();
    chart.setConfig({
      type: "bar",
      data: {
        labels: Object.keys(uniqueDateLabels),
        datasets: datasets,
      },
      options: {
        scales: {
          xAxes: [
            {
              stacked: true,
              ticks: {
                autoSkip: false,
                fontColor: "rgb(0, 0, 0)",
              },
            },
          ],
          yAxes: [
            {
              stacked: true,
              ticks: {
                fontColor: "rgb(0, 0, 0)",
              },
              scaleLabel: {
                display: true,
                labelString: "Points",
                fontColor: "rgb(0, 0, 0)",
                fontSize: 20,
                fontStyle: "bold",
              },
            },
          ],
        },
      },
    });

    chart.setWidth(800).setHeight(400);
    await chart.toFile(__dirname + "/chart.png");
    const image = new AttachmentBuilder(__dirname + "/chart.png");

    let breakdown = datasets
      .map((ds) => {
        const totalPoints = ds.data.reduce((a, b) => a + b, 0);
        return {
          label: ds.label,
          points: totalPoints,
        };
      })
      .filter((ds) => ds.points > 0) // Filter out datasets where total points are 0
      .map((ds) => `${ds.label}: ${ds.points.toFixed(2)} pts`) // Format points to two decimal places
      .join("\n");

    const embed = new EmbedBuilder()
      .setTitle("Monthly Overview")
      .setThumbnail(interaction.user.avatarURL())
      .setColor("#00b7ff")
      .setImage("attachment://chart.png")
      .addFields(
        { name: "User", value: interaction.user.username, inline: true },
        { name: "Timeframe", value: range, inline: true },
        {
          name: "Points",
          value: datasets
            .map((ds) => ds.data.reduce((a, b) => a + b, 0))
            .reduce((a, b) => a + b, 0)
            .toFixed(2)
            .toString(),
          inline: true,
        },
        { name: "**Breakdown**", value: breakdown, inline: false }
      );

    await interaction.editReply({ embeds: [embed], files: [image] });
    fs.unlinkSync(__dirname + "/chart.png");
  },
};
