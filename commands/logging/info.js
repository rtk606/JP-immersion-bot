const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("Get info about a user or a server!")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("user")
        .setDescription("Info about a user")
        .addUserOption((option) =>
          option.setName("target").setDescription("The user")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("server").setDescription("Info about the server")
    ),
  async execute(interaction) {
    if (interaction.options.getSubcommand() === "user") {
      const user = interaction.options.getUser("target");
      if (user) {
        // Reply with details of the specified user
        await interaction.reply(
          `Username: ${user.username}\nID: ${user.id}\nTag: ${
            user.tag
          }\nAvatar URL: ${user.displayAvatarURL()}`
        );
      } else {
        // If no user was specified, reply with details of the command issuer
        await interaction.reply(
          `Your username: ${interaction.user.username}\nYour ID: ${
            interaction.user.id
          }\nYour Tag: ${
            interaction.user.tag
          }\nYour Avatar URL: ${interaction.user.displayAvatarURL()}`
        );
      }
    } else if (interaction.options.getSubcommand() === "server") {
      // Reply with server details
      await interaction.reply(
        `Server name: ${interaction.guild.name}\nTotal members: ${interaction.guild.memberCount}`
      );
    }
  },
};
