import React, { useState, useEffect, useCallback } from 'react';
import { 
  RefreshCw, 
  Zap,
  Settings,
  Activity,
  TrendingUp
} from 'lucide-react';
import { ChatSimulator } from './components/ChatSimulator';
import { AnalysisPanel } from './components/AnalysisPanel';
import { SentimentChart } from './components/SentimentChart';
import { ConnectModal } from './components/ConnectModal';
import { GatewayLogs } from './components/GatewayLogs';
import { analyzeChatHistory } from './services/geminiService';
import { fetchDiscordMessages, sendDiscordMessage } from './services/discordService';
import { ChatMessage, AnalysisResult, DiscordConfig, LogEntry } from './types';

/**
 * LocalStorage key for persisting gateway settings.
 */
const STORAGE_KEY = 'ms_gateway_config';

export default function App() {
  // Global App State
  const [messages, setMessages] = useState<ChatMessage[]>([]); // Current live chat feed
  const [history, setHistory] = useState<AnalysisResult[]>([]); // Historical sentiment analyses
  const [isAnalyzing, setIsAnalyzing] = useState(false); // UI loading state for AI
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false); // Settings visibility
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  // Persistent Gateway Configuration (Hydrated from LocalStorage)
  const [discordConfig, setDiscordConfig] = useState<DiscordConfig | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [fetchError, setFetchError] = useState<string | null>(null);

  /**
   * Diagnostic Logger
   */
  const addLog = useCallback((level: LogEntry['level'], message: string) => {
    setLogs(prev => [...prev.slice(-99), {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        level,
        message
    }]);
  }, []);

  /**
   * Action: Fetch latest messages from the Discord API via the configured proxy.
   */
  const fetchMessagesFromDiscord = useCallback(async (config: DiscordConfig) => {
    try {
        const fetchedMessages = await fetchDiscordMessages(config, addLog);
        setMessages(fetchedMessages);
        setFetchError(null);
    } catch (error: any) {
        setFetchError(error.message);
        addLog('error', `Gateway fetch error: ${error.message}`);
    }
  }, [addLog]);

  /**
   * Lifecycle: Manage the polling interval for live Discord updates.
   * Runs every 30 seconds when a valid config exists.
   */
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (discordConfig) {
      addLog('info', 'Gateway polling started (30s interval).');
      fetchMessagesFromDiscord(discordConfig);
      interval = setInterval(() => fetchMessagesFromDiscord(discordConfig), 30000);
    }
    return () => clearInterval(interval);
  }, [discordConfig, fetchMessagesFromDiscord, addLog]);

  /**
   * Handler: Updates configuration and persists it to the browser.
   */
  const handleConnect = (config: DiscordConfig) => {
    setDiscordConfig(config);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    addLog('success', 'New gateway configuration applied and persisted.');
  };

  /**
   * Action: Triggers the Gemini AI analysis on the current message buffer.
   */
  const runAnalysis = async () => {
    if (messages.length === 0) return;
    
    setIsAnalyzing(true);
    addLog('info', 'Starting Gemini Intelligence scan...');
    try {
      // Prepare message context (Last 50 messages)
      const chatLog = messages.slice(-50).map(m => `${m.author}: ${m.content}`).join('\n');
      
      // Request AI Report
      const result = await analyzeChatHistory(chatLog);
      addLog('success', `AI Analysis complete (Score: ${result.sentimentScore})`);
      
      // Side Effect: Auto-post to Discord if enabled
      if (discordConfig?.autoPost) {
        addLog('info', 'Auto-posting report to Discord...');
        const sentimentIcon = result.sentimentScore > 0 ? '📈' : '📉';
        const report = `**Market Pulse** ${sentimentIcon}\nScore: ${result.sentimentScore.toFixed(2)}\nThemes: ${result.themes.join(', ')}\n\n${result.summary}`;
        await sendDiscordMessage(discordConfig, report, addLog);
      }
      
      // Update history for chart visualization
      setHistory(prev => [...prev, result]);
    } catch (err) {
      console.error(err);
      addLog('error', 'Intelligence scan failed.');
      alert("Analysis failed. Verify your Gemini API Key in the environment.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Helper for rendering the latest report in the panel
  const latestAnalysis = history.length > 0 ? history[history.length - 1] : null;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans flex flex-col">
      <ConnectModal 
        isOpen={isConnectModalOpen} 
        onClose={() => setIsConnectModalOpen(false)}
        onConnect={handleConnect}
        currentConfig={discordConfig}
      />

      {/* Navigation Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50 px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="text-white" size={20} />
            </div>
            <h1 className="font-bold text-lg">Market Sentinel</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
                onClick={() => setIsConnectModalOpen(true)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all flex items-center gap-2"
            >
                <Settings size={18} />
                <span className="text-xs font-bold hidden sm:block">Gateway Settings</span>
            </button>
          </div>
      </header>

      {/* Primary Dashboard Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Analytics & Reports */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold flex items-center gap-2 text-indigo-400">
                <TrendingUp size={18} /> Sentiment Trend
              </h3>
            </div>
            {history.length > 1 ? (
              <SentimentChart data={history} />
            ) : (
               <div className="h-64 flex flex-col items-center justify-center text-gray-600 border border-dashed border-gray-800 rounded-xl bg-gray-950/50 gap-3">
                  <Activity size={32} className="opacity-10" />
                  <p className="text-xs uppercase tracking-widest font-bold opacity-40">Awaiting Data Points</p>
               </div>
            )}
          </div>

          <AnalysisPanel latestAnalysis={latestAnalysis} isAnalyzing={isAnalyzing} onRunAnalysis={runAnalysis} />
        </div>

        {/* Right Column: Live Feed & Actions */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="flex-1 flex flex-col gap-4">
              <div className="flex-1 flex flex-col min-h-[400px]">
                <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Discord Live Feed</span>
                    {fetchError ? (
                      <span className="text-[10px] text-rose-400 animate-pulse font-bold">● OFFLINE</span>
                    ) : (
                      messages.length > 0 && <span className="text-[10px] text-emerald-400 animate-pulse font-bold">● CONNECTED</span>
                    )}
                </div>
                <ChatSimulator messages={messages} onSendMessage={() => {}} />
              </div>

              {/* New Gateway Logs Component */}
              <GatewayLogs logs={logs} onClear={() => setLogs([])} />
          </div>

          {/* Primary Action Button */}
          <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl">
                <button
                    onClick={runAnalysis}
                    disabled={isAnalyzing || messages.length === 0}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-800 text-white py-4 rounded-xl font-bold transition-all shadow-xl shadow-indigo-900/20 active:scale-95 flex items-center justify-center gap-2"
                >
                    {isAnalyzing ? <RefreshCw className="animate-spin" size={20} /> : <Zap size={20} />}
                    Scan Feed for Intelligence
                </button>
                {messages.length === 0 && (
                  <p className="text-[10px] text-gray-500 text-center mt-3 italic">
                    Configure Gateway to activate AI Analysis
                  </p>
                )}
          </div>
        </div>
      </main>
    </div>
  );
}