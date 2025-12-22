import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Activity, Sparkles, Target } from 'lucide-react';
import { AnalysisResult } from '../types';

interface AnalysisPanelProps {
  latestAnalysis: AnalysisResult | null;
  isAnalyzing: boolean;
  onRunAnalysis: () => void;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ latestAnalysis, isAnalyzing }) => {
  if (!latestAnalysis && !isAnalyzing) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-center p-8 bg-gray-900 rounded-2xl border border-gray-800 border-dashed">
        <Activity className="text-indigo-500/20 mb-3" size={48} />
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">No Intelligence Data</h3>
        <p className="text-[10px] text-gray-600 mt-1 uppercase tracking-tighter">Initiate scan to begin</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 flex-1 overflow-y-auto shadow-sm relative min-h-[400px]">
        {isAnalyzing && (
            <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-md flex items-center justify-center z-10 rounded-2xl">
                <div className="flex flex-col items-center">
                    <Sparkles className="text-indigo-400 mb-4 animate-spin-slow" size={48} />
                    <span className="text-indigo-300 font-mono font-bold tracking-widest animate-pulse">GEMINI THINKING...</span>
                </div>
            </div>
        )}
        
        {latestAnalysis && (
          <div className="animate-in fade-in duration-700">
            <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                    <Target className="text-indigo-500" size={16} />
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Feed Analysis</span>
                </div>
                <h2 className="text-3xl font-bold text-white tracking-tight">
                  Discord Pulse Report
                </h2>
                <p className="text-gray-500 text-xs mt-2 font-mono flex items-center gap-2">
                   <Activity size={12} /> {latestAnalysis.timestamp.toLocaleTimeString()}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <div className={`text-4xl font-mono font-bold ${
                    latestAnalysis.sentimentScore > 0 ? 'text-emerald-400' : 
                    latestAnalysis.sentimentScore < 0 ? 'text-rose-400' : 'text-gray-400'
                }`}>
                    {latestAnalysis.sentimentScore > 0 ? '+' : ''}{latestAnalysis.sentimentScore.toFixed(2)}
                </div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Sentiment Score</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
              {latestAnalysis.themes.map((theme, idx) => (
                <span key={idx} className="bg-indigo-950/40 text-indigo-300 px-4 py-1.5 rounded-lg text-xs font-bold border border-indigo-900/30">
                  #{theme.replace(/\s+/g, '-').toLowerCase()}
                </span>
              ))}
            </div>

            <div className="prose prose-invert prose-sm max-w-none text-gray-300 prose-headings:text-white prose-a:text-indigo-400 leading-relaxed">
              <ReactMarkdown>{latestAnalysis.summary}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};