const { DataTypes } = require("sequelize");
const sequelize = require("../database");
const User = require("./User");

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

// A function to calculate points based on media type and duration
Log.calculatePoints = function (mediaType, duration) {
  let points;
  switch (mediaType.toLowerCase()) {
    case "book":
      // "1 point per page" means 1 point for each unit of duration.
      points = duration;
      break;
    case "manga":
      // "0.2 points per page" means each unit of duration is worth 0.2 points.
      points = duration * 0.2;
      break;
    case "visual novel":
      // "1/350 points/character" means each unit of duration is worth 1/350 points.
      points = duration / 350;
      break;
    case "anime":
      // "9.5 points per episode" means each unit of duration is worth 9.5 points.
      points = duration * 9.5;
      break;
    case "listening":
      // "0.45 points/min of listening" means each unit of duration is worth 0.45 points.
      points = duration * 0.45;
      break;
    case "readtime":
      // "0.45 points/min of reading time" means each unit of duration is worth 0.45 points.
      points = duration * 0.45;
      break;
    case "reading":
      // "1/350 points/character of reading" means each unit of duration is worth 1/350 points.
      points = duration / 350;
      break;
    default:
      throw new Error(`Unknown media type: ${mediaType}`);
  }
  return points;
};

// A method for creating a new log entry and calculating XP
Log.newLog = async function (title, userId, duration, mediaType) {
  try {
    const user = await User.findByPk(userId);
    const points = Log.calculatePoints(mediaType, duration);
    // Update user's XP
    user.userXp += points;
    await user.save();

    const log = await Log.create({
      userId: userId,
      title: title,
      duration: duration,
      mediaType: mediaType,
    });

    return log;
  } catch (error) {
    console.error("Error creating log:", error);
    throw error;
  }
};

module.exports = Log;
