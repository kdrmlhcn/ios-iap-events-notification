/**
 * App Store Server-to-Server Notifications Handler for Cloudflare Workers
 * This service processes App Store server-to-server notifications for in-app purchases
 * and forwards them to multiple notification platforms (Telegram, Discord, Slack)
 */

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
      channel: "#app-store-notifications",
      username: "App Store Bot",
      icon_emoji: ":apple:"
    }
  };
  
  // ============= UTILS =============
  const formatUtils = {
    formatDate: (date) => {
      if (!date) return '';
      try {
        const timestamp = typeof date === 'number' && date < 1e12 ? date * 1000 : date;
        const dt = new Date(timestamp);
        return dt.toLocaleString('tr-TR', { 
          timeZone: CONFIG.general.timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      } catch (error) {
        console.error('Error formatting date:', error);
        return String(date);
      }
    },
  
    getFlagEmoji: (countryCode, platform = 'telegram') => {
      if (!countryCode) return '';
      countryCode = countryCode.toUpperCase();
      
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
  
    escapeMarkdown: (text) => {
      if (!text) return '';
      return text
        .toString()
        .replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
    },
  
    formatPrice: (price, currency) => {
      return typeof price === "number" ? `${String(price / 1000)} ${currency}` : "";
    }
  };
  
  // ============= NOTIFICATION SERVICES =============
  class NotificationService {
    constructor(config) {
      this.config = config;
    }
  
    async send(payload) {
      try {
        return await this.makeRequest(this.buildRequest(payload));
      } catch (error) {
        console.error(`Error in ${this.constructor.name}:`, error);
        throw error;
      }
    }
  
    async makeRequest(config, retries = CONFIG.general.retryAttempts, delay = CONFIG.general.retryDelay) {
      try {
        const response = await fetch(config.url, {
          method: config.method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(config.data)
        });
  
        if (!response.ok) {
          if (response.status === 429 && retries > 0) {
            const retryAfter = response.headers.get('retry-after');
            const waitTime = retryAfter ? retryAfter * 1000 : delay;
            
            console.log(`Rate limited, waiting ${waitTime}ms before retry. Retries left: ${retries}`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            
            return this.makeRequest(config, retries - 1, delay * 2);
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        return await response.json();
      } catch (error) {
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.makeRequest(config, retries - 1, delay * 2);
        }
        throw error;
      }
    }
  
    buildRequest(payload) {
      throw new Error('buildRequest must be implemented');
    }
  }
  
  class TelegramNotification extends NotificationService {
    buildRequest(payload) {
      const message = this.formatMessage(payload);
      return {
        method: 'POST',
        url: `https://api.telegram.org/bot${this.config.botToken}/sendMessage`,
        data: {
          chat_id: this.config.chatId,
          text: message,
          parse_mode: "MarkdownV2",
          disable_web_page_preview: false
        }
      };
    }
  
    formatMessage({title, items, subItems, appAppleId, bundleId}) {
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
  
    escapeMarkdownV2(text) {
      if (!text) return '';
      return text
        .toString()
        .replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
    }
  }
  
  class DiscordNotification extends NotificationService {
    buildRequest(payload) {
      return {
        method: 'POST',
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
  
  class SlackNotification extends NotificationService {
    buildRequest(payload) {
      return {
        method: 'POST',
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
  const decodeRawEvent = (signedPayload) => {
    if (!signedPayload?.includes(".")) throw new Error("invalid signedPayload");
  
    let event;
    try {
      const base64Url = signedPayload.split(".")[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
  
      event = JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error("decode event: " + error.message);
    }
  
    if (event?.data?.signedTransactionInfo) {
      console.log("\n=== TRANSACTION INFO ===");
      const transactionInfo = decodeJWT(event.data.signedTransactionInfo);
      console.log(JSON.stringify(transactionInfo, null, 2));
      
      if (transactionInfo.originalTransactionId) {
        event.data.transactionInfo = transactionInfo;
        delete event?.data?.signedTransactionInfo;
      }
    }
  
    if (event?.data?.signedRenewalInfo) {
      console.log("\n=== RENEWAL INFO ===");
      const renewalInfo = decodeJWT(event.data.signedRenewalInfo);
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
  
  const decodeJWT = (token) => {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  
    return JSON.parse(jsonPayload);
  };
  
  // ============= MAIN HANDLER =============
  addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
  });
  
  async function handleRequest(request) {
    if (request.method !== "POST") {
      return new Response("Only POST method is accepted", { status: 405 });
    }
  
    try {
      const body = await request.json();
      const {notificationType, subtype, data} = decodeRawEvent(body.signedPayload);
      const {transactionInfo, appAppleId, bundleId} = data;
  
      // Check if sandbox notifications are allowed
      if (transactionInfo?.environment === "Sandbox" && !CONFIG.general.allowSandboxNotifications) {
        return new Response("Sandbox notifications are disabled", { status: 200 });
      }
  
      // Get country code from storefront (you might need to implement getCountryISO2 function)
      const countryCode = transactionInfo?.storefront?.slice(0, 2);
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
  
      return new Response("Notifications sent successfully", {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    } catch (error) {
      console.error("Error sending notifications:", error);
      return new Response("Internal Server Error", {
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  } 