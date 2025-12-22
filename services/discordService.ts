import { ChatMessage, DiscordConfig } from "../types";

const FETCH_TIMEOUT = 12000;

export const fetchDiscordMessages = async (config: DiscordConfig): Promise<ChatMessage[]> => {
  const { botToken, channelId, useProxy, proxyUrl } = config;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    let url = '';
    
    if (useProxy) {
      // Ensure the proxy URL is properly formatted
      const baseUrl = (proxyUrl || "http://localhost:3001/api/discord").replace(/\/$/, "");
      url = `${baseUrl}/channels/${channelId}/messages?limit=50`;
    } else {
      url = `https://discord.com/api/v10/channels/${channelId}/messages?limit=50`;
    }

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
        if (response.status === 401) throw new Error("Unauthorized: Invalid Bot Token.");
        if (response.status === 403) throw new Error("Forbidden: Bot lacks channel access.");
        if (response.status === 404) throw new Error("Not Found: Incorrect Channel ID.");
        
        const err = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(err.message || `HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
        throw new Error("Gateway error: Received invalid response format.");
    }

    return data.map((msg: any) => ({
      id: msg.id,
      author: msg.author.username,
      content: msg.content,
      timestamp: new Date(msg.timestamp),
      isBot: msg.author.bot,
    })).reverse();

  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
        throw new Error("Connection Timeout: The gateway is taking too long to respond.");
    }

    if (error instanceof TypeError || error.message.toLowerCase().includes('failed to fetch')) {
        throw new Error(`Gateway Unreachable: Check your Proxy URL settings.`);
    }
    
    throw error;
  }
};

export const sendDiscordMessage = async (config: DiscordConfig, content: string): Promise<boolean> => {
    const { botToken, outputChannelId, channelId, useProxy, proxyUrl } = config;
    const targetChannel = outputChannelId || channelId;

    try {
        let url = '';
        if (useProxy) {
            const baseUrl = (proxyUrl || "http://localhost:3001/api/discord").replace(/\/$/, "");
            url = `${baseUrl}/channels/${targetChannel}/messages`;
        } else {
            url = `https://discord.com/api/v10/channels/${targetChannel}/messages`;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bot ${botToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ content }),
        });

        return response.ok;
    } catch (error) {
        console.error("Error sending message via gateway:", error);
        return false;
    }
};