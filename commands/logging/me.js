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

    let startDate,
      endDate = new Date();
    let earliestLog;

    if (range === "yearly" || range === "monthly") {
      earliestLog = await Log.findOne({
        where: { userId: userId },
        order: [["createdAt", "ASC"]],
      });
    }

    switch (range) {
      case "weekly":
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 6); // Include today and go back 6 more days
        break;
      case "monthly":
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        break;
      case "yearly":
        if (earliestLog) {
          startDate = new Date(earliestLog.createdAt);
          startDate.setDate(1);
          startDate.setMonth(startDate.getMonth());
        } else {
          startDate = new Date(endDate.getFullYear(), 0, 1);
        }
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

    if (!logs.length) {
      await interaction.editReply({
        content: "No logs found for the specified time range.",
        ephemeral: false,
      });
      return;
    }

    let allDates = {};
    let mediaTypeDurations = {};
    let currentDate = new Date(startDate);
    let labelFormatOptions =
      range === "yearly"
        ? { month: "short", year: "numeric" }
        : { day: "2-digit", month: "short" };

    while (currentDate <= endDate) {
      let label = currentDate.toLocaleDateString("en-GB", labelFormatOptions);
      allDates[label] = {};
      if (range === "yearly") {
        currentDate.setMonth(currentDate.getMonth() + 1);
      } else {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    logs.forEach((log) => {
      const logDate = new Date(log.createdAt).toLocaleDateString(
        "en-GB",
        labelFormatOptions
      );
      const points = Log.calculatePoints(log.mediaType, log.duration);

      if (!allDates[logDate]) {
        allDates[logDate] = {};
      }
      allDates[logDate][log.mediaType] = points || 0;

      if (!mediaTypeDurations[log.mediaType]) {
        mediaTypeDurations[log.mediaType] = 0;
      }
      mediaTypeDurations[log.mediaType] += log.duration;
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

      Object.keys(allDates).forEach((date) => {
        dataset.data.push(allDates[date][mediaType] || 0);
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

    function formatPointsWithUnits(mediaType, duration) {
      const units = {
        "visual novel": "chars",
        anime: "episodes",
        manga: "pages",
        listening: "minutes",
        reading: "chars",
        readtime: "minutes",
        book: "pages",
      };
      const unit = units[mediaType] || "units";
      return `${Number(duration).toLocaleString()} ${unit}`;
    }

    let breakdown = datasets
      .map((ds) => {
        const totalPoints = ds.data.reduce((a, b) => a + b, 0);
        const totalDuration = mediaTypeDurations[ds.label] || 0;
        if (totalPoints > 0) {
          const formattedDuration = formatPointsWithUnits(
            ds.label,
            totalDuration
          );
          return `${ds.label.toUpperCase()}: ${formattedDuration} → ${totalPoints.toLocaleString(
            undefined,
            { minimumFractionDigits: 2, maximumFractionDigits: 2 }
          )} pts`; // Format the points with commas and two decimal places
        }
        return null;
      })
      .filter((ds) => ds) // Remove null entries for media types with 0 points
      .join("\n");

    const chart = new QuickChart();
    chart.setConfig({
      type: "bar",
      data: {
        labels: Object.keys(allDates),
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

    const embed = new EmbedBuilder()
      .setTitle(`${range[0].toUpperCase() + range.slice(1)} Overview`)
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
            .toLocaleString(undefined, {
              minimumFractionDigits: 4,
              maximumFractionDigits: 4,
            }),
          inline: true,
        },
        {
          name: "**Breakdown**",
          value: breakdown,
          inline: false,
        }
      );

    await interaction.editReply({ embeds: [embed], files: [image] });
    fs.unlinkSync(__dirname + "/chart.png");
  },
};
