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

// A function to calculate points based on media type and duration
function calculatePoints(mediaType, duration) {
  let points;
  switch (mediaType.toLowerCase()) {
    case "book":
      points = duration;
      break;
    case "manga":
      points = duration * 5;
      break;
    case "visual novel":
      points = duration * 350;
      break;
    case "anime":
      points = duration / 9.5;
      break;
    case "listening":
      points = duration / 0.45;
      break;
    case "readtime":
      points = duration / 0.45;
      break;
    case "reading":
      points = duration * 350;
      break;
    default:
      throw new Error(`Unknown media type: ${mediaType}`);
  }
  return points;
}

// A method for creating a new log entry and calculating XP
Log.newLog = async function (title, userId, duration, mediaType) {
  try {
    const user = await User.findByPk(userId);
    const points = calculatePoints(mediaType, duration);
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
