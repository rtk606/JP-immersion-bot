const { Sequelize } = require("sequelize");

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./immersionlogs.db",
});

module.exports = sequelize;
