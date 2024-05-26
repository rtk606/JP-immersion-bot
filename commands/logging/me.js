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

    let uniqueDateLabels = [];
    let date = new Date(startDate);
    while (date <= endDate) {
      uniqueDateLabels.push(
        date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      );
      date.setDate(date.getDate() + 1);
    }

    const chart = new QuickChart();
    chart.setConfig({
      type: "bar", // Show a bar chart
      data: {
        labels: uniqueDateLabels, // Set X-axis labels
        datasets: [
          {
            label: "Yea boiiiii", //
            data: [120, 60, 50, 180, 120], // User xp here
          },
        ],
      },
      options: {
        scales: {
          xAxes: [
            {
              ticks: {
                autoSkip: false, // Ensures all labels are displayed
                fontColor: "rgb(0, 0, 0)",
              },
            },
          ],
          yAxes: [
            {
              ticks: {
                fontColor: "rgb(0, 0, 0)",
              },
              scaleLabel: {
                display: true,
                fontColor: "#000000",
                fontSize: 20,
                fontStyle: "bold",
                labelString: "Points",
              },
            },
          ],
        },
      },
    });
    chart.setWidth(800).setHeight(400);
    await chart.toFile(__dirname + "/chart.png");
    const image = new AttachmentBuilder(__dirname + "/chart.png");

    let times = {};
    logs.forEach((log) => {
      times[log.mediaType] += log.duration;
    });

    //.setDescription(`Total time: 0h 0m`)
    //const user = await User.findByPk(userId);
    //const userXp = user.userXp;

    //let breakdown = Object.entries()

    const embed = new EmbedBuilder()
      .setTitle("Monthly Overview")
      .setThumbnail(interaction.user.avatarURL())
      .setColor("#00b7ff")
      .setImage("attachment://chart.png")
      .addFields(
        { name: "User", value: interaction.user.username, inline: true },
        { name: "Timeframe", value: range, inline: true },
        { name: "Points", value: "0", inline: true }
      )
      .addFields({
        name: "**Breakdown**",
        value: "test\ntest\n",
        inline: false,
      });

    await interaction.reply({ embeds: [embed], files: [image] });
    fs.unlinkSync(__dirname + "/chart.png");

    console.log(uniqueDateLabels);
  },
};
