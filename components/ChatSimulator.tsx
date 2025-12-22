import React, { useRef, useEffect } from 'react';
import { User, Bot, Link2, RefreshCw, MessageCircle } from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatSimulatorProps {
  messages: ChatMessage[];
  onSendMessage: (content: string, author: string) => void;
  isReadOnly?: boolean;
}

export const ChatSimulator: React.FC<ChatSimulatorProps> = ({ messages, isReadOnly = true }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-xl border border-gray-800 overflow-hidden relative shadow-2xl">
      <div className="bg-gray-850 p-3 border-b border-gray-800 flex justify-between items-center px-4">
        <h3 className="text-gray-200 font-semibold flex items-center gap-2 text-sm">
          <span className="text-indigo-500 font-bold">#</span> 
          discord-monitor
          {messages.length > 0 && (
            <span className="flex items-center gap-1.5 ml-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold tracking-tight uppercase">Live</span>
            </span>
          )}
        </h3>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-sm scroll-smooth"
      >
        {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 px-6 opacity-60">
                <div className="bg-gray-800/50 p-4 rounded-full border border-gray-700">
                    <MessageCircle className="text-gray-600" size={32} />
                </div>
                <div>
                    <p className="text-sm text-gray-400 font-medium">No active stream found</p>
                    <p className="text-[11px] text-gray-600 mt-1 max-w-[200px] mx-auto">
                        Please connect your Discord bot to monitor real-time channel activity.
                    </p>
                </div>
            </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`group flex gap-3 ${msg.isBot ? 'bg-indigo-900/10 -mx-4 px-4 py-2 border-l-2 border-indigo-500' : 'hover:bg-gray-800/30 -mx-4 px-4 py-1.5 transition-colors'}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-inner ${
              msg.isBot ? 'bg-indigo-600' : 'bg-gray-800 border border-gray-700'
            }`}>
              {msg.isBot ? <Bot size={16} className="text-white" /> : <User size={16} className="text-gray-400" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className={`font-bold text-xs tracking-tight ${msg.isBot ? 'text-indigo-400' : 'text-gray-200'}`}>
                  {msg.author}
                </span>
                <span className="text-[10px] text-gray-600 font-mono">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {msg.isBot && (
                    <span className="bg-indigo-600/20 text-indigo-400 text-[9px] px-1.5 py-0.5 rounded border border-indigo-600/30 font-bold">SYSTEM</span>
                )}
              </div>
              <p className="text-gray-300 leading-relaxed break-words whitespace-pre-wrap mt-0.5">
                {msg.content}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 bg-gray-850 border-t border-gray-800">
        <div className="relative">
          <div className="w-full bg-gray-950 text-gray-500 p-3 pr-10 rounded-lg border border-gray-800 text-[11px] flex items-center gap-2 italic">
            <Link2 size={14} className="text-indigo-500/50" />
            {messages.length > 0 ? "Monitoring encrypted Discord stream..." : "Waiting for gateway handshake..."}
          </div>
        </div>
      </div>
    </div>
  );
};