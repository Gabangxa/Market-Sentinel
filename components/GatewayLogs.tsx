import React, { useRef, useEffect } from 'react';
import { Terminal, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { LogEntry } from '../types';

interface GatewayLogsProps {
  logs: LogEntry[];
  onClear: () => void;
}

export const GatewayLogs: React.FC<GatewayLogsProps> = ({ logs, onClear }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = React.useState(true);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden flex flex-col shadow-inner">
      <div className="bg-gray-900 px-3 py-2 border-b border-gray-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-gray-500" />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gateway Diagnostics</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onClear} 
            className="text-gray-600 hover:text-rose-400 transition-colors"
            title="Clear Console"
          >
            <Trash2 size={12} />
          </button>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-600 hover:text-white transition-colors"
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div 
          ref={scrollRef}
          className="h-48 overflow-y-auto p-3 font-mono text-[10px] space-y-1.5 scroll-smooth bg-black/40"
        >
          {logs.length === 0 && (
            <div className="h-full flex items-center justify-center text-gray-700 italic">
              Console idle. Waiting for connection events...
            </div>
          )}
          {logs.map((log) => (
            <div key={log.id} className="flex gap-3 animate-in fade-in slide-in-from-left-1">
              <span className="text-gray-600 shrink-0 select-none">
                [{log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
              </span>
              <span className={`break-words ${
                log.level === 'error' ? 'text-rose-400 font-bold' :
                log.level === 'success' ? 'text-emerald-400' :
                log.level === 'warn' ? 'text-amber-400' : 'text-indigo-400/80'
              }`}>
                {log.level === 'error' ? '✖' : log.level === 'success' ? '✔' : 'ℹ'} {log.message}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};