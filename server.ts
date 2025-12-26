import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001; 

/**
 * Enhanced CORS logic to handle dynamic Google AI Studio subdomains.
 * When credentials: true is set, the origin cannot be "*".
 * We must check the incoming origin and echo it back if it matches our pattern.
 */
const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        // If origin is undefined (like from a local script) or matches our wildcard pattern
        if (!origin || origin.endsWith('.scf.usercontent.goog') || origin.includes('localhost')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'CF-Access-Client-Id', 
        'CF-Access-Client-Secret'
    ]
};

app.use(cors(corsOptions));
app.use(express.json());

const DISCORD_API_BASE = "https://discord.com/api/v10";

// Health check to verify proxy is alive
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        port: PORT, 
        handshake: 'verified',
        timestamp: new Date().toISOString() 
    });
});

// Proxy endpoint for fetching channel messages
app.get('/api/discord/channels/:channelId/messages', async (req, res) => {
    const { channelId } = req.params;
    const authHeader = req.headers.authorization;
    const limit = req.query.limit || '50';

    if (!authHeader) {
        res.status(401).json({ error: 'Missing Authorization header' });
        return;
    }

    try {
        console.log(`[${new Date().toLocaleTimeString()}] Proxying GET: /channels/${channelId}/messages`);
        
        const response = await fetch(`${DISCORD_API_BASE}/channels/${channelId}/messages?limit=${limit}`, {
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            res.status(response.status).json(errorData);
            return;
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('Proxy Server Error:', error);
        res.status(500).json({ error: 'Internal Proxy Error' });
    }
});

// Proxy endpoint for SENDING messages
app.post('/api/discord/channels/:channelId/messages', async (req, res) => {
    const { channelId } = req.params;
    const authHeader = req.headers.authorization;
    const body = req.body;

    if (!authHeader) {
        res.status(401).json({ error: 'Missing Authorization header' });
        return;
    }

    try {
        console.log(`[${new Date().toLocaleTimeString()}] Proxying POST: /channels/${channelId}/messages`);
        
        const response = await fetch(`${DISCORD_API_BASE}/channels/${channelId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            res.status(response.status).json(errorData);
            return;
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('Proxy POST Error:', error);
        res.status(500).json({ error: 'Internal Proxy Error' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Proxy server running on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
    console.log(`   Forwarding requests to Discord API v10\n`);
});