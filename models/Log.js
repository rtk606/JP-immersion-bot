const { DataTypes } = require("sequelize");
const sequelize = require("../database");

const Log = sequelize.define("Log", {
  logId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

Log.newLog = async function (userId, duration, mediaType) {
  try {
    const log = Log.create({
      userId: userId,
      duration: duration,
      mediaType: mediaType,
    });
  } catch (error) {
    console.error("Error creating log:", error);
  }
};

module.exports = Log;
