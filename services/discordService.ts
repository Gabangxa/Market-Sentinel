import { ChatMessage, DiscordConfig, LogEntry } from "../types";

const FETCH_TIMEOUT = 12000;

type LogCallback = (level: LogEntry['level'], message: string) => void;

export interface DiagnosticResult {
  step: string;
  status: 'pending' | 'success' | 'error';
  details: string;
}

/**
 * Runs a granular diagnostic suite to identify precisely why a connection is failing.
 */
export const runHandshakeDiagnostic = async (
    url: string, 
    accessId?: string, 
    accessSecret?: string
): Promise<DiagnosticResult[]> => {
    const results: DiagnosticResult[] = [
        { step: 'URL Validation', status: 'pending', details: 'Checking format...' },
        { step: 'Connectivity', status: 'pending', details: 'Checking if host is reachable...' },
        { step: 'CORS & Headers', status: 'pending', details: 'Testing preflight acceptance...' },
        { step: 'Access Policy', status: 'pending', details: 'Verifying Service Auth...' }
    ];

    const baseUrl = (url || "").trim().replace(/\/$/, "");
    if (!baseUrl.startsWith('http')) {
        results[0] = { step: 'URL Validation', status: 'error', details: 'URL must start with http:// or https://' };
        return results;
    }
    results[0] = { step: 'URL Validation', status: 'success', details: 'URL format is valid.' };

    try {
        const headers: Record<string, string> = { 'Accept': 'application/json' };
        if (accessId && accessSecret) {
            headers['CF-Access-Client-Id'] = accessId.trim();
            headers['CF-Access-Client-Secret'] = accessSecret.trim();
        }

        // Test Health Endpoint
        const response = await fetch(`${baseUrl}/health`, { 
            method: 'GET',
            mode: 'cors',
            headers
        }).catch(err => err);

        if (response instanceof Error) {
            results[1] = { step: 'Connectivity', status: 'error', details: 'Failed to fetch. Host might be down or URL is wrong.' };
            results[2] = { step: 'CORS & Headers', status: 'error', details: 'Browser blocked the request (CORS).' };
            return results;
        }

        results[1] = { step: 'Connectivity', status: 'success', details: `Reachable (Status: ${response.status})` };

        if (response.status === 403) {
            results[2] = { step: 'CORS & Headers', status: 'error', details: '403 Forbidden. Usually means Allowed Headers are missing in CF Dash.' };
            results[3] = { step: 'Access Policy', status: 'error', details: 'Check if policy is set to "Service Auth".' };
        } else if (response.ok) {
            results[2] = { step: 'CORS & Headers', status: 'success', details: 'Headers accepted by gateway.' };
            results[3] = { step: 'Access Policy', status: 'success', details: 'Handshake complete.' };
        } else {
            results[2] = { step: 'CORS & Headers', status: 'error', details: `Unexpected status ${response.status}` };
        }

    } catch (e: any) {
        results[1] = { step: 'Connectivity', status: 'error', details: e.message };
    }

    return results;
};

/**
 * Standard test function used by the main connect flow.
 */
export const testProxyConnection = async (
    url: string, 
    accessId?: string, 
    accessSecret?: string,
    onLog?: LogCallback
): Promise<{ ok: boolean; message: string }> => {
    try {
        const baseUrl = url.trim().replace(/\/$/, "");
        if (!baseUrl) return { ok: false, message: "URL is required." };
        
        onLog?.('info', `Testing handshake: ${baseUrl}/health`);
        
        const headers: Record<string, string> = {};
        if (accessId && accessSecret) {
            headers['CF-Access-Client-Id'] = accessId.trim();
            headers['CF-Access-Client-Secret'] = accessSecret.trim();
        }

        const response = await fetch(`${baseUrl}/health`, { headers, mode: 'cors' });
        
        if (response.status === 403) {
            onLog?.('error', '403 Forbidden: Missing headers in Cloudflare dashboard.');
            return { ok: false, message: "403 Forbidden. Add 'CF-Access-Client-Id' to 'Allowed Headers' in your Cloudflare dashboard." };
        }

        if (response.ok) {
            onLog?.('success', 'Handshake successful!');
            return { ok: true, message: "Proxy is online and accessible." };
        }

        return { ok: false, message: `Proxy error ${response.status}.` };
    } catch (e: any) {
        onLog?.('error', `Connection failed: ${e.message}`);
        return { ok: false, message: "Network Error: Check CORS settings or Worker URL." };
    }
};

export const fetchDiscordMessages = async (config: DiscordConfig, onLog?: LogCallback): Promise<ChatMessage[]> => {
  const { botToken, channelId, proxyUrl, cfAccessId, cfAccessSecret } = config;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const headers: Record<string, string> = {
      "Authorization": `Bot ${botToken}`,
      "Content-Type": "application/json",
    };

    if (cfAccessId && cfAccessSecret) {
        headers['CF-Access-Client-Id'] = cfAccessId.trim();
        headers['CF-Access-Client-Secret'] = cfAccessSecret.trim();
    }

    let baseUrl = (proxyUrl || "").trim().replace(/\/$/, "");
    if (!baseUrl.startsWith('http')) baseUrl = `https://${baseUrl}`;
    const path = baseUrl.includes('/api/discord') ? '' : '/api/discord';
    const url = `${baseUrl}${path}/channels/${channelId}/messages?limit=50`;

    onLog?.('info', `Syncing feed...`);

    const response = await fetch(url, {
      signal: controller.signal,
      headers,
      mode: 'cors',
      redirect: 'manual'
    });

    clearTimeout(timeoutId);

    if (response.status === 403) {
        onLog?.('error', '403 Forbidden. Check CORS Allowed Headers.');
        throw new Error("403 Forbidden: Add 'CF-Access-Client-Id' to Allowed Headers in Cloudflare.");
    }

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    onLog?.('success', `Retrieved ${data.length} messages.`);
    return data.map((msg: any) => ({
      id: msg.id,
      author: msg.author.username,
      content: msg.content,
      timestamp: new Date(msg.timestamp),
      isBot: msg.author.bot,
    })).reverse();

  } catch (error: any) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const sendDiscordMessage = async (config: DiscordConfig, content: string, onLog?: LogCallback): Promise<boolean> => {
    const { botToken, outputChannelId, channelId, proxyUrl, cfAccessId, cfAccessSecret } = config;
    const targetChannel = outputChannelId || channelId;

    try {
        const headers: Record<string, string> = {
            "Authorization": `Bot ${botToken}`,
            "Content-Type": "application/json",
        };

        if (cfAccessId && cfAccessSecret) {
            headers['CF-Access-Client-Id'] = cfAccessId.trim();
            headers['CF-Access-Client-Secret'] = cfAccessSecret.trim();
        }

        let baseUrl = (proxyUrl || "").trim().replace(/\/$/, "");
        if (!baseUrl.startsWith('http')) baseUrl = `https://${baseUrl}`;
        const path = baseUrl.includes('/api/discord') ? '' : '/api/discord';
        const url = `${baseUrl}${path}/channels/${targetChannel}/messages`;

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({ content }),
            mode: 'cors',
            redirect: 'manual'
        });

        if (response.ok) {
            onLog?.('success', 'Report posted to Discord.');
        } else {
            onLog?.('error', `Post failed (Status: ${response.status})`);
        }

        return response.ok;
    } catch (error) {
        onLog?.('error', 'Network failure during message post.');
        return false;
    }
};