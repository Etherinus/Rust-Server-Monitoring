'use strict';

const { Client, GatewayIntentBits, ActivityType, PresenceUpdateStatus } = require('discord.js');
const axios = require('axios');
const { AxiosError } = axios;
const dotenv = require('dotenv');

dotenv.config();

const config = {
    discordToken: process.env.DISCORD_TOKEN,
    battlemetricsServerId: process.env.BATTLEMETRICS_SERVER_ID,
    updateIntervalMs: parseInt(process.env.UPDATE_INTERVAL_SECONDS || '60', 10) * 1000,
    joiningPlayersField: process.env.BM_JOINING_FIELD || 'details.rust_queued_players',
    apiBaseUrl: 'https://api.battlemetrics.com/servers',
};

function validateConfig(cfg) {
    const required = ['discordToken', 'battlemetricsServerId'];
    const missing = required.filter(key => !cfg[key]);
    if (missing.length > 0) {
        logError(`Critical configuration missing: ${missing.join(', ')}. Please check your .env file or environment variables.`);
        process.exit(1);
    }
    if (isNaN(cfg.updateIntervalMs) || cfg.updateIntervalMs < 15000) {
        logError(`Invalid UPDATE_INTERVAL_SECONDS. Must be a number >= 15.`);
        process.exit(1);
    }
}

validateConfig(config);

function logInfo(message) {
    console.log(`[${new Date().toISOString()}] INFO: ${message}`);
}

function logError(message, error = null) {
    console.error(`[${new Date().toISOString()}] ERROR: ${message}${error ? `\n${error.stack || error}` : ''}`);
}

async function fetchBattleMetricsData(serverId) {
    const apiUrl = `${config.apiBaseUrl}/${serverId}`;
    logInfo(`Fetching data from BattleMetrics for server ${serverId}...`);
    try {
        const response = await axios.get(apiUrl, { timeout: 10000 });

        if (response.status !== 200 || !response.data?.data?.attributes) {
            logError(`Received invalid data structure or non-200 status (${response.status}) from BattleMetrics.`);
            return null;
        }
        return response.data.data.attributes;
    } catch (error) {
        if (error instanceof AxiosError) {
            logError(`HTTP error fetching BattleMetrics data: ${error.message}. Status: ${error.response?.status || 'N/A'}`);
        } else {
            logError('Failed to fetch BattleMetrics data.', error);
        }
        return null;
    }
}

function getNestedValue(obj, path) {
    return path.split('.').reduce((value, key) => (value && value[key] !== undefined) ? value[key] : undefined, obj);
}

function formatStatusText(players, maxPlayers, joiningPlayers) {
    let content = `${players}/${maxPlayers}`;
    if (joiningPlayers > 0) {
        content += ` - ${joiningPlayers} joining`;
    }
    return `[${content}]`;
}

const discordClient = new Client({
    intents: [GatewayIntentBits.Guilds],
});

async function updatePresence(activityName, activityType = ActivityType.Listening, status = PresenceUpdateStatus.Online) {
    try {
        await discordClient.user?.setPresence({
            activities: [{ name: activityName, type: activityType }],
            status: status,
        });
    } catch (error) {
        logError('Failed to update Discord presence.', error);
    }
}

async function refreshServerStatus() {
    const attributes = await fetchBattleMetricsData(config.battlemetricsServerId);

    if (!attributes) {
        await updatePresence('API Error', ActivityType.Watching, PresenceUpdateStatus.DoNotDisturb);
        return;
    }

    const players = attributes.players ?? 'N/A';
    const maxPlayers = attributes.maxPlayers ?? 'N/A';
    const serverName = attributes.name || 'Unknown Server';
    const joiningPlayers = getNestedValue(attributes, config.joiningPlayersField) ?? 0;

    if (players === 'N/A' || maxPlayers === 'N/A') {
        logError(`Could not extract player counts from API response for server ${serverName}`);
        await updatePresence('Data Error', ActivityType.Watching, PresenceUpdateStatus.DoNotDisturb);
        return;
    }

    const statusText = formatStatusText(players, maxPlayers, joiningPlayers);
    logInfo(`Server: ${serverName} | Status: ${statusText}`);
    await updatePresence(statusText, ActivityType.Listening, PresenceUpdateStatus.Online);
}

discordClient.once('ready', async (client) => {
    logInfo(`Logged in as ${client.user.tag}`);
    logInfo(`Starting status updates for server ID ${config.battlemetricsServerId} every ${config.updateIntervalMs / 1000} seconds.`);
    try {
        await refreshServerStatus();
        setInterval(refreshServerStatus, config.updateIntervalMs);
    } catch (error) {
        logError('Error during initial status update.', error);
        await updatePresence('Init Error', ActivityType.Watching, PresenceUpdateStatus.DoNotDisturb);
    }
});

discordClient.on('error', (error) => {
    logError('Discord client error:', error);
});

async function startBot() {
    try {
        logInfo('Attempting to log in to Discord...');
        await discordClient.login(config.discordToken);
    } catch (error) {
        logError('Failed to log in to Discord. Check the token.', error);
        process.exit(1);
    }
}

startBot();

process.on('SIGINT', () => {
    logInfo('SIGINT received. Shutting down bot...');
    discordClient.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    logInfo('SIGTERM received. Shutting down bot...');
    discordClient.destroy();
    process.exit(0);
});