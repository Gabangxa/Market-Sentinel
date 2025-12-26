import React, { useState, useEffect } from 'react';
import { X, Lock, Hash, CheckCircle2, Server, Globe, Megaphone, Activity, RefreshCw, AlertCircle, ShieldCheck, Copy, Info, ListChecks, Play, Circle, CheckCircle, ArrowRight, Wand2 } from 'lucide-react';
import { DiscordConfig } from '../types';
import { testProxyConnection, runHandshakeDiagnostic, DiagnosticResult } from '../services/discordService';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (config: DiscordConfig) => void;
  currentConfig: DiscordConfig | null;
}

const DRAFT_STORAGE_KEY = 'ms_gateway_draft';

export const ConnectModal: React.FC<ConnectModalProps> = ({ isOpen, onClose, onConnect, currentConfig }) => {
  const [token, setToken] = useState('');
  const [channelId, setChannelId] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [proxyUrl, setProxyUrl] = useState('');
  const [cfAccessId, setCfAccessId] = useState('');
  const [cfAccessSecret, setCfAccessSecret] = useState('');
  const [autoPost, setAutoPost] = useState(false);
  const [outputChannelId, setOutputChannelId] = useState('');
  
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);
  const [useWildcard, setUseWildcard] = useState(true);

  const currentOrigin = window.location.origin;
  const wildcardOrigin = "https://*.scf.usercontent.goog";
  const displayOrigin = useWildcard ? wildcardOrigin : currentOrigin;

  useEffect(() => {
    if (isOpen) {
        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        let initialData: any = null;
        if (savedDraft) {
            try { initialData = JSON.parse(savedDraft); } catch (e) { initialData = currentConfig; }
        } else { initialData = currentConfig; }

        if (initialData) {
            setToken(initialData.botToken || '');
            setChannelId(initialData.channelId || '');
            setProxyUrl(initialData.proxyUrl || '');
            setCfAccessId(initialData.cfAccessId || '');
            setCfAccessSecret(initialData.cfAccessSecret || '');
            setAutoPost(initialData.autoPost ?? false);
            setOutputChannelId(initialData.outputChannelId || '');
        }
        setTestResult(null);
        setDiagnostics([]);
    }
  }, [isOpen, currentConfig]);

  useEffect(() => {
    if (!isOpen) return;
    const draft: Partial<DiscordConfig> = {
        botToken: token, channelId, useProxy: true, proxyUrl, cfAccessId, cfAccessSecret, autoPost, outputChannelId
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [token, channelId, proxyUrl, cfAccessId, cfAccessSecret, autoPost, outputChannelId, isOpen]);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const result = await testProxyConnection(proxyUrl, cfAccessId, cfAccessSecret);
    setTestResult(result);
    setIsTesting(false);
  };

  const startDiagnostic = async () => {
    setIsRunningDiagnostic(true);
    const results = await runHandshakeDiagnostic(proxyUrl, cfAccessId, cfAccessSecret);
    setDiagnostics(results);
    setIsRunningDiagnostic(false);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token && channelId) {
      onConnect({ 
          botToken: token, channelId, useProxy: true, proxyUrl,
          cfAccessId, cfAccessSecret, autoPost, outputChannelId: outputChannelId || channelId 
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
        
        <div className="bg-gray-850 p-5 border-b border-gray-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Server size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Gateway Setup</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Discord Proxy Configuration</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-gray-800 p-2 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          {/* Left Side: Form */}
          <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-6 overflow-y-auto border-r border-gray-800">
            <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={12} className="text-indigo-500" />
                    1. Identity & Bot Auth
                </h3>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Discord Channel ID</label>
                    <input type="text" value={channelId} onChange={(e) => setChannelId(e.target.value)} placeholder="e.g. 1451..." className="w-full bg-black/40 border border-gray-800 text-gray-100 p-3 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none transition-all font-mono text-xs" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Discord Bot Token</label>
                    <input type={showToken ? "text" : "password"} value={token} onChange={(e) => setToken(e.target.value)} placeholder="MTA..." className="w-full bg-black/40 border border-gray-800 text-gray-100 p-3 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none transition-all font-mono text-xs" required />
                  </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <Globe size={12} className="text-indigo-500" />
                        2. Cloudflare Zero Trust
                    </h3>
                    <button type="button" onClick={handleTestConnection} disabled={isTesting || !proxyUrl} className="text-[9px] font-bold text-indigo-400 flex items-center gap-1 hover:underline disabled:opacity-30">
                        {isTesting ? <RefreshCw size={10} className="animate-spin" /> : <Activity size={10} />}
                        TEST
                    </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Worker URL</label>
                    <input type="text" value={proxyUrl} onChange={(e) => setProxyUrl(e.target.value)} placeholder="https://your-worker.workers.dev" className="w-full bg-black/40 border border-gray-800 text-indigo-300 p-3 rounded-xl text-xs font-mono focus:border-indigo-500 outline-none" required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[8px] text-gray-500 uppercase font-bold">Access Client ID</label>
                        <input type="password" value={cfAccessId} onChange={(e) => setCfAccessId(e.target.value)} placeholder="...id" className="w-full bg-black/40 border border-gray-800 text-gray-400 p-3 rounded-xl text-[10px] font-mono outline-none" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[8px] text-gray-500 uppercase font-bold">Access Secret</label>
                        <input type="password" value={cfAccessSecret} onChange={(e) => setCfAccessSecret(e.target.value)} placeholder="...secret" className="w-full bg-black/40 border border-gray-800 text-gray-400 p-3 rounded-xl text-[10px] font-mono outline-none" />
                    </div>
                  </div>
                </div>
                
                {testResult && (
                    <div className={`p-3 rounded-xl text-[10px] font-medium leading-relaxed border ${
                        testResult.ok ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/5 text-rose-400 border-rose-500/20'
                    }`}>
                        <div className="flex items-center gap-2 font-bold mb-1 uppercase">
                          {testResult.ok ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                          {testResult.ok ? "Handshake Success" : "Handshake Failed"}
                        </div>
                        {testResult.message}
                    </div>
                )}
            </div>

            <div className="pt-4 sticky bottom-0 bg-gray-900 py-4 border-t border-gray-800">
               <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-xl shadow-indigo-900/40 flex items-center justify-center gap-2 text-xs uppercase tracking-widest active:scale-[0.98]">
                  <CheckCircle2 size={16} /> Activate Proxy Link
               </button>
            </div>
          </form>

          {/* Right Side: Troubleshooting & Wildcard Strategy */}
          <div className="w-full lg:w-72 bg-gray-950/50 p-6 overflow-y-auto space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-400">
                <Wand2 size={16} />
                <h4 className="text-xs font-bold uppercase tracking-widest">The "Set & Forget" Fix</h4>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tight">CORS Origin URL</p>
                    <button 
                        onClick={() => setUseWildcard(!useWildcard)}
                        className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase transition-colors ${useWildcard ? 'bg-indigo-500/20 text-indigo-400' : 'bg-gray-800 text-gray-500'}`}
                    >
                        {useWildcard ? 'Wildcard' : 'Specific'}
                    </button>
                </div>
                
                <div className="bg-gray-900 border border-gray-800 p-2.5 rounded-lg flex items-center justify-between group hover:border-indigo-500/50 transition-colors">
                  <code className="text-[8px] font-mono text-gray-400 truncate pr-2 select-all">{displayOrigin}</code>
                  <button onClick={() => navigator.clipboard.writeText(displayOrigin)} className="text-gray-500 hover:text-white shrink-0">
                    <Copy size={12} />
                  </button>
                </div>

                <div className={`p-2 rounded-lg flex items-start gap-2 transition-all ${useWildcard ? 'bg-emerald-500/5 border border-emerald-500/10' : 'bg-amber-500/5 border border-amber-500/10'}`}>
                    {useWildcard ? <CheckCircle2 size={12} className="text-emerald-500 shrink-0 mt-0.5" /> : <AlertCircle size={12} className="text-amber-500 shrink-0 mt-0.5" />}
                    <p className="text-[8px] text-gray-500 leading-tight">
                        {useWildcard ? (
                            <>Paste the <strong className="text-white">Wildcard</strong> Origin above into Cloudflare to handle all future AI Studio sessions automatically.</>
                        ) : (
                            <>The <strong className="text-amber-400">Specific</strong> origin changes every time you restart. Use Wildcard to avoid manual updates.</>
                        )}
                    </p>
                </div>
              </div>

              {/* Handshake Diagnostic */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-3 space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Preflight Test</span>
                    <button onClick={startDiagnostic} disabled={isRunningDiagnostic || !proxyUrl} className="p-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded transition-colors disabled:opacity-20">
                        {isRunningDiagnostic ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
                    </button>
                </div>
                <div className="space-y-2">
                    {diagnostics.map((d, idx) => (
                        <div key={idx} className="flex gap-2 items-start">
                            {d.status === 'success' ? <CheckCircle size={10} className="text-emerald-500 mt-0.5" /> : d.status === 'error' ? <AlertCircle size={10} className="text-rose-500 mt-0.5" /> : <Circle size={10} className="text-gray-700 mt-0.5" />}
                            <div className="min-w-0">
                                <p className={`text-[9px] font-bold uppercase tracking-tighter ${d.status === 'error' ? 'text-rose-400' : 'text-gray-400'}`}>{d.step}</p>
                                <p className="text-[8px] text-gray-500 leading-tight break-words">{d.details}</p>
                            </div>
                        </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-800">
              <div className="flex items-center gap-2 text-amber-400">
                <ShieldCheck size={16} />
                <h4 className="text-xs font-bold uppercase tracking-widest">Access Toggles</h4>
              </div>
              <p className="text-[8px] text-gray-500 leading-normal">
                In Cloudflare <strong>Access &gt; Advanced Settings</strong>, ensure this is <strong className="text-white">ON</strong>:
              </p>
              <div className="flex items-center justify-between bg-gray-900 p-2 rounded border border-gray-800">
                <span className="text-[8px] text-gray-400 font-bold uppercase">Bypass OPTIONS requests</span>
                <div className="w-6 h-3 bg-indigo-600 rounded-full flex items-center justify-end px-0.5">
                    <div className="w-2 h-2 bg-white rounded-full shadow-sm" />
                </div>
              </div>
              <p className="text-[7px] text-gray-600 leading-tight italic">
                This lets your code handle preflights so wildcard origins work with credentials.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};