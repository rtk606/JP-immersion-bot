# :japan: Japanese - Immersion Logging/Tracking Discord Bot

A Discord bot for logging/tracking Japanese language learning immersion. Log immersion, earn XP, keep track of your progress and compete in a monthly leaderboard.

## Screenshot Preview

### 📊 Statistics
- Generate graphs of your immersion logs
- Generate by weekly, monthly or yearly

![Preview](previewimage1.png)

### 📖 Immersion tracking with /log
- Log your immersion time by media type
- Gain XP and compete with others

![Preview](previewimage2.png)

### 🏆 Leaderboard
- See rankings based on immersion time
- Sort by day, week, or month

![image](https://github.com/rtk606/JP-immersion-bot/assets/132792358/48c6755a-03a5-4169-b2ef-d10ae250425e)

## 💾 Installation

Run the following:

```
git clone https://github.com/rtk606/Japanese-immersion-bot.git
cd JP-immersion-bot
npm install
```

Create `config.json` in the root project folder and fill it in:
```
{
  "token": "YOUR_TOKEN_HERE",
  "clientId": "YOUR_CLIENTID_HERE",
  "guildId": "YOUR_GUILDID_HERE"
}
```

You can deploy the commands with:

```
node deploy-commands.js
```

You can start the bot with:

```
node index.js
```


