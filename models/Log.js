const { DataTypes } = require("sequelize");
const sequelize = require("../database");

const Log = sequelize.define("Log", {
  logId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  mediaType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

Log.newLog = async function (title, userId, duration, mediaType) {
  try {
    const log = Log.create({
      userId: userId,
      title: title,
      duration: duration,
      mediaType: mediaType,
    });
  } catch (error) {
    console.error("Error creating log:", error);
  }
};

module.exports = Log;
