# 📊 Rust Server Monitor Bot

[![Author](https://img.shields.io/badge/Author-Etherinus-blue.svg)](https://github.com/Etherinus) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A simple Discord bot that displays the current player count and queue for your game server (e.g., Rust) in its status, using data from the BattleMetrics API.

![Bot Status Example](https://i.imgur.com/XPppyWV.png)

---

## ✨ Features

*   **Real-time Status:** Displays the player count `[current/max]` in the bot's status.
*   **Queue Display:** Shows the number of players in the queue (`joining`) if it's greater than zero.
*   **BattleMetrics API:** Fetches up-to-date data directly from BattleMetrics.
*   **Configurable Interval:** Easily configure the status update frequency.
*   **Simplicity:** Easy to set up and run.

---

## 📋 Prerequisites

*   **Node.js:** Version 18.x or higher ([download](https://nodejs.org/))
*   **npm:** Usually comes with Node.js
*   **Discord Bot Token:** Your bot's token ([create/get here](https://discord.com/developers/applications))
*   **BattleMetrics Server ID:** The ID of your game server on BattleMetrics (found in the server page URL).

---

## 🚀 Installation & Setup

1.  **Clone the repository (or download ZIP):**
    ```bash
    git clone https://github.com/etherinus/rust-server-monitoring.git
    cd rust-server-monitoring
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create the configuration file:**
    *   Create a file named `.env` in the project's root directory.
    *   Copy the following content into it:

    ```dotenv
    # .env

    # === Required Variables ===

    # Your Discord bot token
    DISCORD_TOKEN=YOUR_DISCORD_BOT_TOKEN_HERE

    # Your server's ID on BattleMetrics
    BATTLEMETRICS_SERVER_ID=YOUR_BATTLEMETRICS_SERVER_ID_HERE

    # === Optional Variables ===

    # Status update interval in seconds (default: 60)
    # Do not set too low (< 15) to avoid Discord API rate limits
    UPDATE_INTERVAL_SECONDS=60

    # Field in the BattleMetrics API response to get queue data
    # For Rust, it's usually 'details.rust_queued_players'.
    # Check the API response for your specific game if the queue isn't displayed.
    BM_JOINING_FIELD=details.rust_queued_players
    ```

4.  **Fill the `.env` file:**
    *   Replace `YOUR_DISCORD_BOT_TOKEN_HERE` with your actual bot token. **Never share this token!**
    *   Replace `YOUR_BATTLEMETRICS_SERVER_ID_HERE` with your server's ID.
    *   Adjust `UPDATE_INTERVAL_SECONDS` and `BM_JOINING_FIELD` if needed.

---

## ▶️ Running the Bot

*   **For regular launch:**
    ```bash
    npm start
    ```

*   **For development mode (with auto-restart on file changes):**
    *   Make sure `nodemon` is installed (`npm install` should have done this as it's in `devDependencies`).
    ```bash
    npm run dev
    ```

*   **For stable operation (recommended for production):**
    *   Use a process manager like `pm2`.
    *   Install `pm2` globally: `npm install pm2 -g`
    *   Start the bot via `pm2`: `pm2 start index.js --name rust-monitor`
    *   To manage: `pm2 list`, `pm2 logs rust-monitor`, `pm2 stop rust-monitor`, `pm2 restart rust-monitor`.

---

## 📄 License

Distributed under the MIT License. See the `LICENSE` file (if available) for more information or visit [MIT License](https://opensource.org/licenses/MIT).
