/**
 * App Store Server-to-Server Notifications Handler
 * This service processes App Store server-to-server notifications for in-app purchases
 * and forwards them to multiple notification platforms (Telegram, Discord, Slack)
 */

const functions = require("@google-cloud/functions-framework");
const axios = require("axios");
const base64url = require("base64url");
const jwt = require("jsonwebtoken");
const getCountryISO2 = require("country-iso-3-to-2");
const { formatInTimeZone } = require('date-fns-tz');

// ============= CONFIG =============
const CONFIG = {
  general: {
    allowSandboxNotifications: true, // Whether to send notifications for sandbox environment
    retryAttempts: 3, // Number of retry attempts for failed API calls
    retryDelay: 1000, // Initial delay between retries in milliseconds
    timezone: "Europe/Istanbul", // Default timezone for date formatting
    dateFormat: "dd.MM.yyyy HH:mm:ss" // Default date format
  },
  telegram: {
    enabled: true,
    botToken: "YOUR_TELEGRAM_BOT_TOKEN",
    chatId: "YOUR_TELEGRAM_CHAT_ID"
  },
  discord: {
    enabled: true,
    webhookUrl: "YOUR_DISCORD_WEBHOOK_URL"
  },
  slack: {
    enabled: false,
    webhookUrl: "YOUR_SLACK_WEBHOOK_URL",
    channel: "#app-store-notifications", // Optional: Override default channel
    username: "App Store Bot", // Optional: Override default username
    icon_emoji: ":apple:" // Optional: Override default bot icon
  }
};

// ============= UTILS =============
/**
 * Utility functions for formatting and handling common operations
 */
const formatUtils = {
  /**
   * Formats a date according to the configured timezone and format
   * @param {number|string|Date} date - The date to format
   * @param {string} [timezone] - Optional timezone (defaults to CONFIG.general.timezone)
   * @param {string} [format] - Optional format string (defaults to CONFIG.general.dateFormat)
   * @returns {string} Formatted date string
   */
  formatDate: (date, timezone = CONFIG.general.timezone, dateFormat = CONFIG.general.dateFormat) => {
    if (!date) return '';
    try {
      // Convert to milliseconds if timestamp is in seconds
      const timestamp = typeof date === 'number' && date < 1e12 ? date * 1000 : date;
      return formatInTimeZone(timestamp, timezone, dateFormat);
    } catch (error) {
      console.error('Error formatting date:', error);
      return String(date);
    }
  },

  /**
   * Converts country code to flag emoji based on platform
   * @param {string} countryCode - Two-letter country code
   * @param {string} platform - Target platform (telegram, discord, or slack)
   * @returns {string} Flag emoji for the country
   */
  getFlagEmoji: (countryCode, platform = 'telegram') => {
    if (!countryCode) return '';
    countryCode = countryCode.toUpperCase();
    
    // Platform specific emoji formats
    switch (platform) {
      case 'discord':
        return `:flag_${countryCode.toLowerCase()}:`;
      case 'slack':
        return `:flag-${countryCode.toLowerCase()}:`;
      default: // telegram
        const OFFSET = 127397;
        return String.fromCodePoint(countryCode.charCodeAt(0) + OFFSET) + 
               String.fromCodePoint(countryCode.charCodeAt(1) + OFFSET);
    }
  },

  /**
   * Escapes special characters in text for markdown formatting
   * @param {string} text - Text to escape
   * @returns {string} Escaped text safe for markdown
   */
  escapeMarkdown: (text) => {
    if (!text) return '';
    return text
      .toString()
      .replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
  },

  /**
   * Formats price with currency
   * @param {number} price - Price in smallest currency unit (e.g., cents)
   * @param {string} currency - Currency code
   * @returns {string} Formatted price with currency
   */
  formatPrice: (price, currency) => {
    return typeof price === "number" ? `${String(price / 1000)} ${currency}` : "";
  }
};

// ============= NOTIFICATION SERVICES =============
/**
 * Base class for notification services
 * Implements common functionality for sending notifications
 */
class NotificationService {
  constructor(config) {
    this.config = config;
  }

  async send(payload) {
    try {
      return await axiosWithRetry(this.buildRequest(payload));
    } catch (error) {
      console.error(`Error in ${this.constructor.name}:`, error);
      throw error;
    }
  }

  buildRequest(payload) {
    throw new Error('buildRequest must be implemented');
  }
}

/**
 * Telegram notification service
 * Formats and sends notifications to Telegram using Bot API
 */
class TelegramNotification extends NotificationService {
  buildRequest(payload) {
    const message = this.formatMessage(payload);
    console.log('Telegram message:', message); // For debugging purposes
    return {
      method: 'post',
      url: `https://api.telegram.org/bot${this.config.botToken}/sendMessage`,
      data: {
        chat_id: this.config.chatId,
        text: message,
        parse_mode: "MarkdownV2",
        disable_web_page_preview: false
      }
    };
  }

  formatMessage({title, items, subItems, appAppleId, bundleId, data}) {
    const formatItem = ({name, value}) => {
      const emoji = {
        Event: "📊",
        Product: "🏷",
        Country: "🌍",
        Price: "💰"
      }[name] || "";

      if (name === "Country" && value.includes(":flag_")) {
        const match = value.match(/:flag_(\w+):/);
        if (match) {
          const countryCode = match[1];
          const countryName = value.split(":flag_")[1].split(":")[1].trim();
          value = `${formatUtils.getFlagEmoji(countryCode)} ${countryName}`;
        }
      }

      return `${emoji} *${this.escapeMarkdownV2(name)}:* ${this.escapeMarkdownV2(value)}`;
    };
    
    return [
      `${this.escapeMarkdownV2(bundleId)}`,
      this.escapeMarkdownV2(title),
      "",
      ...items
        .filter(({value}) => Boolean(value))
        .map(formatItem),
      "",
      "ℹ️ *Additional Info:*",
      ...subItems
        .filter(({value}) => Boolean(value))
        .map(({name, value}) => 
          `• *${this.escapeMarkdownV2(name)}:* ${this.escapeMarkdownV2(value || "")}`
        ),
      ""
    ].join("\n");
  }

  /**
   * Escapes special characters for Telegram's MarkdownV2 format
   * @param {string} text - Text to escape
   * @returns {string} Escaped text safe for MarkdownV2
   */
  escapeMarkdownV2(text) {
    if (!text) return '';
    return text
      .toString()
      .replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
  }
}

/**
 * Discord notification service
 * Formats and sends notifications to Discord using Webhooks
 */
class DiscordNotification extends NotificationService {
  buildRequest(payload) {
    return {
      method: 'post',
      url: this.config.webhookUrl,
      data: this.formatMessage(payload)
    };
  }

  formatMessage({title, items, subItems, appAppleId, bundleId}) {
    return {
      username: "IAP Events",
      content: title,
      embeds: [{
        title: bundleId,
        url: `https://apps.apple.com/tr/app/id${appAppleId}`,
        color: 15258703,
        fields: items
          .filter(({value}) => Boolean(value))
          .map(({name, value}) => ({
            name,
            value: value.replace(/:flag_(\w+):/, (_, code) => formatUtils.getFlagEmoji(code, 'discord')),
            inline: true
          })),
        thumbnail: {
          url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/App_Store_%28iOS%29.svg/512px-App_Store_%28iOS%29.svg.png"
        },
        footer: {
          text: subItems
            .filter(({value}) => Boolean(value))
            .map(({name, value}) => `${name}: ${value}`)
            .join("\n")
        }
      }]
    };
  }
}

/**
 * Slack notification service
 * Formats and sends notifications to Slack using Webhooks
 */
class SlackNotification extends NotificationService {
  buildRequest(payload) {
    return {
      method: 'post',
      url: this.config.webhookUrl,
      data: this.formatMessage(payload)
    };
  }

  formatMessage({title, items, subItems, appAppleId, bundleId}) {
    const formatField = ({name, value}) => {
      if (name === "Country" && value.includes(":flag_")) {
        const match = value.match(/:flag_(\w+):/);
        if (match) {
          const countryCode = match[1];
          value = value.split(":flag_")[1].split(":")[1].trim();
          return `${formatUtils.getFlagEmoji(countryCode, 'slack')} ${value}`;
        }
      }
      return value;
    };

    const fields = items
      .filter(({value}) => Boolean(value))
      .map(item => ({
        name: item.name,
        value: formatField(item),
        short: true
      }));

    const additionalInfo = subItems
      .filter(({value}) => Boolean(value))
      .map(({name, value}) => `*${name}:* ${value}`)
      .join("\n");

    return {
      channel: this.config.channel,
      username: this.config.username,
      icon_emoji: this.config.icon_emoji,
      attachments: [{
        color: "#007AFF",
        title: bundleId,
        title_link: `https://apps.apple.com/app/id${appAppleId}`,
        text: title,
        fields: fields,
        footer: additionalInfo,
        footer_icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/App_Store_%28iOS%29.svg/512px-App_Store_%28iOS%29.svg.png"
      }]
    };
  }
}

// ============= NOTIFICATION MANAGER =============
/**
 * Manages multiple notification services and handles sending notifications
 */
class NotificationManager {
  constructor(config) {
    this.services = [];
    
    if (config.telegram.enabled) {
      this.services.push(new TelegramNotification(config.telegram));
    }
    if (config.discord.enabled) {
      this.services.push(new DiscordNotification(config.discord));
    }
    if (config.slack.enabled) {
      this.services.push(new SlackNotification(config.slack));
    }
  }

  async sendAll(payload) {
    const results = await Promise.allSettled(
      this.services.map(service => service.send(payload))
    );

    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length > 0) {
      console.error('Some notifications failed:', failed);
    }

    return results;
  }
}

// ============= HELPER FUNCTIONS =============
/**
 * Makes HTTP requests with retry capability for rate limiting
 * @param {Object} config - Axios request configuration
 * @param {number} retries - Number of retry attempts remaining
 * @param {number} delay - Delay between retries in milliseconds
 */
const axiosWithRetry = async (config, retries = CONFIG.general.retryAttempts, delay = CONFIG.general.retryDelay) => {
  try {
    return await axios(config);
  } catch (error) {
    if (retries === 0 || error.response?.status !== 429) {
      throw error;
    }
    
    const retryAfter = error.response?.headers?.['retry-after'];
    const waitTime = retryAfter ? retryAfter * 1000 : delay;
    
    console.log(`Rate limited, waiting ${waitTime}ms before retry. Retries left: ${retries}`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    
    return axiosWithRetry(config, retries - 1, delay * 2);
  }
};

/**
 * Decodes and processes the raw event data from Apple
 * @param {string} signedPayload - JWT encoded payload from Apple
 * @returns {Object} Decoded and processed event data
 */
const decodeRawEvent = (signedPayload) => {
  if (!signedPayload?.includes(".")) throw new Error("invalid signedPayload");

  let event;
  try {
    event = JSON.parse(base64url.decode(signedPayload.split(".")[1]));
  } catch (error) {
    throw new Error("decode event" + error.message);
  }

  if (event?.data?.signedTransactionInfo) {
    console.log("\n=== TRANSACTION INFO ===");
    const transactionInfo = jwt.decode(event.data.signedTransactionInfo);
    console.log(JSON.stringify(transactionInfo, null, 2));
    
    if (transactionInfo.originalTransactionId) {
      event.data.transactionInfo = transactionInfo;
      delete event?.data?.signedTransactionInfo;
    }
  }

  if (event?.data?.signedRenewalInfo) {
    console.log("\n=== RENEWAL INFO ===");
    const renewalInfo = jwt.decode(event.data.signedRenewalInfo);
    console.log(JSON.stringify(renewalInfo, null, 2));
    
    if (renewalInfo.originalTransactionId) {
      event.data.renewalInfo = renewalInfo;
      delete event?.data?.signedRenewalInfo;
    }
  }

  console.log("\n=== FINAL PROCESSED EVENT ===");
  console.log(JSON.stringify(event, null, 2));

  return event;
};

// ============= MAIN FUNCTION =============
/**
 * Main HTTP function that handles incoming App Store notifications
 * Processes the notification and distributes it to configured platforms
 */
functions.http("main", async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).end("Only POST method is accepted");
    return;
  }

  try {
    const {notificationType, subtype, data} = decodeRawEvent(req.body.signedPayload);
    const {transactionInfo, appAppleId, bundleId} = data;

    // Check if sandbox notifications are allowed
    if (transactionInfo?.environment === "Sandbox" && !CONFIG.general.allowSandboxNotifications) {
      res.status(200).send("Sandbox notifications are disabled");
      return;
    }

    const countryCode = getCountryISO2(transactionInfo?.storefront);
    const flagEmoji = formatUtils.getFlagEmoji(countryCode, 'discord');
    const priceWithCurrency = formatUtils.formatPrice(transactionInfo.price, transactionInfo.currency);

    const payload = {
      title: `🔔 ${notificationType || ""} ${priceWithCurrency} 💵`,
      items: [
        {name: "Event", value: subtype},
        {name: "Product", value: transactionInfo?.productId},
        {name: "Country", value: `${flagEmoji} ${transactionInfo?.storefront}`},
        {name: "Price", value: priceWithCurrency}
      ],
      subItems: [
        {name: "Environment", value: transactionInfo?.environment},
        {name: "ID", value: transactionInfo?.originalTransactionId},
        {name: "Type", value: transactionInfo?.type},
        {name: "Expires Date", value: formatUtils.formatDate(transactionInfo?.expiresDate)}
      ],
      appAppleId,
      bundleId,
      data
    };

    const notificationManager = new NotificationManager(CONFIG);
    await notificationManager.sendAll(payload);

    res.status(200).send("Notifications sent successfully");
  } catch (error) {
    console.error("Error sending notifications", error);
    res.status(500).send("Internal Server Error");
  }
});