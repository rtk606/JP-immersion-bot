const { DataTypes } = require("sequelize");
const sequelize = require("../database");

const User = sequelize.define("user", {
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
  },
  userXp: {
    type: DataTypes.NUMBER,
    allowNull: false,
  },
});

module.exports = User;
