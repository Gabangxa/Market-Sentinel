import React, { useState, useEffect, useCallback } from 'react';
import { 
  MessageSquare, 
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
import { analyzeChatHistory } from './services/geminiService';
import { fetchDiscordMessages, sendDiscordMessage } from './services/discordService';
import { ChatMessage, AnalysisResult, DiscordConfig } from './types';

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [discordConfig, setDiscordConfig] = useState<DiscordConfig | null>(null);
  const [isFetchingDiscord, setIsFetchingDiscord] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchMessagesFromDiscord = useCallback(async (config: DiscordConfig) => {
    setIsFetchingDiscord(true);
    try {
        const fetchedMessages = await fetchDiscordMessages(config);
        setMessages(fetchedMessages);
        setFetchError(null);
    } catch (error: any) {
        setFetchError(error.message);
    } finally {
        setIsFetchingDiscord(false);
    }
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (discordConfig) {
      fetchMessagesFromDiscord(discordConfig);
      interval = setInterval(() => fetchMessagesFromDiscord(discordConfig), 30000);
    }
    return () => clearInterval(interval);
  }, [discordConfig, fetchMessagesFromDiscord]);

  const runAnalysis = async () => {
    if (messages.length === 0) return;
    setIsAnalyzing(true);
    try {
      const chatLog = messages.slice(-50).map(m => `${m.author}: ${m.content}`).join('\n');
      const result = await analyzeChatHistory(chatLog);
      
      if (discordConfig?.autoPost) {
        const sentimentIcon = result.sentimentScore > 0 ? '📈' : '📉';
        const content = `**Market Pulse** ${sentimentIcon}\nScore: ${result.sentimentScore.toFixed(2)}\nThemes: ${result.themes.join(', ')}\n\n${result.summary}`;
        await sendDiscordMessage(discordConfig, content);
      }
      
      setHistory(prev => [...prev, result]);
    } catch (err) {
      console.error(err);
      alert("Analysis failed. Check console for details.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const latestAnalysis = history.length > 0 ? history[history.length - 1] : null;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans flex flex-col">
      <ConnectModal 
        isOpen={isConnectModalOpen} 
        onClose={() => setIsConnectModalOpen(false)}
        onConnect={(config) => { setDiscordConfig(config); }}
        currentConfig={discordConfig}
      />

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

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold flex items-center gap-2 text-indigo-400">
                <TrendingUp size={18} /> Sentiment History
              </h3>
            </div>
            {history.length > 1 ? (
              <SentimentChart data={history} />
            ) : (
               <div className="h-64 flex flex-col items-center justify-center text-gray-600 border border-dashed border-gray-800 rounded-xl bg-gray-950/50 gap-3">
                  <Activity size={32} className="opacity-10" />
                  <p className="text-xs uppercase tracking-widest font-bold opacity-40">Awaiting Signal Data</p>
               </div>
            )}
          </div>

          <AnalysisPanel latestAnalysis={latestAnalysis} isAnalyzing={isAnalyzing} onRunAnalysis={runAnalysis} />
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="flex-1 flex flex-col min-h-[500px]">
              <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Live Feed</span>
                  {fetchError ? (
                    <span className="text-[10px] text-rose-400 animate-pulse font-bold">● OFFLINE</span>
                  ) : (
                    messages.length > 0 && <span className="text-[10px] text-emerald-400 animate-pulse font-bold">● CONNECTED</span>
                  )}
              </div>
              <ChatSimulator messages={messages} onSendMessage={() => {}} />
              {fetchError && (
                  <div className="mt-4 p-4 bg-rose-950/20 border border-rose-900/50 rounded-xl">
                      <h4 className="text-xs font-bold text-rose-400 mb-1">Gateway Error</h4>
                      <p className="text-[10px] text-rose-300 leading-relaxed">
                          Proxy unreachable. If running locally, ensure 'server.ts' is active on port 3001.
                      </p>
                  </div>
              )}
          </div>

          <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl">
                <button
                    onClick={runAnalysis}
                    disabled={isAnalyzing || messages.length === 0}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-800 text-white py-4 rounded-xl font-bold transition-all shadow-xl shadow-indigo-900/20 active:scale-95 flex items-center justify-center gap-2"
                >
                    {isAnalyzing ? <RefreshCw className="animate-spin" size={20} /> : <Zap size={20} />}
                    Analyze Feed
                </button>
                {messages.length === 0 && (
                  <p className="text-[10px] text-gray-500 text-center mt-3 italic">
                    Connect gateway to start analysis
                  </p>
                )}
          </div>
        </div>
      </main>
    </div>
  );
}