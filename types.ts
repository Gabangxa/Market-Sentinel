export interface ChatMessage {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
  isBot?: boolean;
}

export interface AnalysisResult {
  id: string;
  timestamp: Date;
  sentimentScore: number; // -1.0 to 1.0
  summary: string;
  groundingUrls: string[];
  themes: string[];
}

export interface MarketTheme {
  theme: string;
  sentiment: number;
}

export interface DiscordConfig {
  botToken: string;
  channelId: string;
  useProxy: boolean;
  proxyUrl?: string;
  autoPost: boolean;
  outputChannelId?: string;
}