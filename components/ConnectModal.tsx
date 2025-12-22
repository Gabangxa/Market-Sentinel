import React, { useState } from 'react';
import { X, Lock, Hash, CheckCircle2, Server, Globe, Megaphone, Info } from 'lucide-react';
import { DiscordConfig } from '../types';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (config: DiscordConfig) => void;
  currentConfig: DiscordConfig | null;
}

export const ConnectModal: React.FC<ConnectModalProps> = ({ isOpen, onClose, onConnect, currentConfig }) => {
  const [token, setToken] = useState(currentConfig?.botToken || '');
  const [channelId, setChannelId] = useState(currentConfig?.channelId || '');
  const [showToken, setShowToken] = useState(false);
  
  const [useProxy, setUseProxy] = useState(currentConfig?.useProxy ?? true);
  const [proxyUrl, setProxyUrl] = useState(currentConfig?.proxyUrl || '');

  const [autoPost, setAutoPost] = useState(currentConfig?.autoPost ?? false);
  const [outputChannelId, setOutputChannelId] = useState(currentConfig?.outputChannelId || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token && channelId) {
      onConnect({ 
          botToken: token, 
          channelId, 
          useProxy, 
          proxyUrl: proxyUrl || 'http://localhost:3001/api/discord',
          autoPost,
          outputChannelId: outputChannelId || channelId 
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        
        <div className="bg-gray-850 p-4 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-white font-semibold flex items-center gap-2 text-sm">
            <Server size={16} className="text-indigo-500" />
            Gateway Configuration
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-2">1. Credentials</h3>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1">
                   <Hash size={10} /> Discord Channel ID
                </label>
                <input
                  type="text"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  placeholder="e.g. 123456789012345678"
                  className="w-full bg-gray-950 border border-gray-800 text-gray-100 p-3 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none transition-all font-mono text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1">
                   <Lock size={10} /> Bot Token
                </label>
                <div className="relative">
                    <input
                    type={showToken ? "text" : "password"}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="MTA..."
                    className="w-full bg-gray-950 border border-gray-800 text-gray-100 p-3 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none transition-all font-mono text-xs pr-16"
                    required
                    />
                    <button 
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold"
                    >
                        {showToken ? "HIDE" : "SHOW"}
                    </button>
                </div>
              </div>
          </div>

          <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-2">2. Production Gateway</h3>
              
              <div className="p-3 bg-indigo-900/10 border border-indigo-500/20 rounded-lg space-y-2">
                <div className="flex gap-2 text-indigo-300">
                    <Info size={14} className="shrink-0 mt-0.5" />
                    <p className="text-[10px] leading-relaxed">
                        To connect without a local terminal, deploy the Proxy to a <b>Cloudflare Worker</b>. 
                    </p>
                </div>
              </div>

              <div className="space-y-2">
                    <label className="text-[10px] font-medium text-gray-400 flex items-center gap-1 uppercase tracking-wider">
                       <Globe size={10} /> Cloud Proxy URL
                    </label>
                    <input
                      type="text"
                      value={proxyUrl}
                      onChange={(e) => setProxyUrl(e.target.value)}
                      placeholder="https://your-worker.workers.dev/api/discord"
                      className="w-full bg-gray-950 border border-gray-800 text-gray-300 p-3 rounded-lg text-xs font-mono focus:border-indigo-500 outline-none"
                    />
                    <p className="text-[9px] text-gray-600 italic">Leave blank for default: http://localhost:3001/api/discord</p>
              </div>
          </div>

          <div className="space-y-4 pt-2">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-2">3. Automation</h3>
              <div className="flex items-center gap-2">
                  <input 
                      type="checkbox" 
                      id="autopost"
                      checked={autoPost} 
                      onChange={(e) => setAutoPost(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-700 bg-gray-950 accent-indigo-600"
                  />
                  <label htmlFor="autopost" className="text-[10px] font-bold text-gray-300 uppercase tracking-wider cursor-pointer">
                      Auto-Post Analysis to Discord
                  </label>
              </div>

              {autoPost && (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-1">
                    <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1">
                       <Megaphone size={10} /> Output Channel ID
                    </label>
                    <input
                      type="text"
                      value={outputChannelId}
                      onChange={(e) => setOutputChannelId(e.target.value)}
                      placeholder="Optional: Different channel ID"
                      className="w-full bg-gray-950 border border-gray-800 text-gray-100 p-3 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none transition-all font-mono text-xs"
                    />
                </div>
              )}
          </div>

          <div className="pt-2">
             <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-xl shadow-indigo-900/20 flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
             >
                <CheckCircle2 size={16} />
                Establish Connection
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};