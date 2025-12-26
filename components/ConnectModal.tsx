import React, { useState, useEffect } from 'react';
import { X, Lock, Hash, CheckCircle2, Server, Globe, Megaphone, Activity, RefreshCw, AlertCircle, ShieldCheck, Copy, Info, ListChecks, Play, Circle, CheckCircle, ArrowRight, Wand2, Code2, Cpu } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'config' | 'worker'>('config');
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

  const workerCode = `/**
 * Market Sentinel - Cloudflare Bridge
 * Paste this into your Cloudflare Worker
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");

    // Dynamic CORS for Google AI Studio
    const corsHeaders = {
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, CF-Access-Client-Id, CF-Access-Client-Secret",
      "Access-Control-Allow-Credentials": "true",
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok" }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    if (url.pathname.startsWith("/api/discord/")) {
      const discordPath = url.pathname.replace("/api/discord/", "");
      const discordUrl = \`https://discord.com/api/v10/\${discordPath}\${url.search}\`;
      
      const response = await fetch(discordUrl, {
        method: request.method,
        headers: {
          "Authorization": request.headers.get("Authorization"),
          "Content-Type": "application/json",
        },
        body: request.method === "POST" ? await request.text() : null,
      });

      const data = await response.text();
      return new Response(data, {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response("Not Found", { status: 404 });
  }
};`;

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
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        <div className="bg-gray-850 p-4 border-b border-gray-800 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Server size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-sm">Gateway Setup</h2>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Environment: Google AI Studio</p>
              </div>
            </div>
            
            <nav className="flex bg-black/40 p-1 rounded-lg border border-gray-800">
                <button 
                    onClick={() => setActiveTab('config')}
                    className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'config' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    Settings
                </button>
                <button 
                    onClick={() => setActiveTab('worker')}
                    className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'worker' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    Worker Script
                </button>
            </nav>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-gray-800 p-1.5 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          {activeTab === 'config' ? (
            <>
              {/* Left Side: Form */}
              <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-6 overflow-y-auto border-r border-gray-800">
                <div className="space-y-4">
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck size={12} className="text-indigo-500" />
                        1. Discord Identity
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Channel ID</label>
                        <input type="text" value={channelId} onChange={(e) => setChannelId(e.target.value)} placeholder="1451..." className="w-full bg-black/40 border border-gray-800 text-gray-100 p-2.5 rounded-xl outline-none font-mono text-xs" required />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Bot Token</label>
                        <input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="MTA..." className="w-full bg-black/40 border border-gray-800 text-gray-100 p-2.5 rounded-xl outline-none font-mono text-xs" required />
                      </div>
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-800/50">
                    <div className="flex justify-between items-center">
                        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <Globe size={12} className="text-indigo-500" />
                            2. Cloudflare Connection
                        </h3>
                        <button type="button" onClick={handleTestConnection} disabled={isTesting || !proxyUrl} className="text-[9px] font-bold text-indigo-400 flex items-center gap-1 hover:underline disabled:opacity-30">
                            {isTesting ? <RefreshCw size={10} className="animate-spin" /> : <Activity size={10} />}
                            PING PROXY
                        </button>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Worker URL</label>
                        <input type="text" value={proxyUrl} onChange={(e) => setProxyUrl(e.target.value)} placeholder="https://ms-bridge.workers.dev" className="w-full bg-black/40 border border-gray-800 text-indigo-300 p-2.5 rounded-xl text-xs font-mono outline-none" required />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input type="password" value={cfAccessId} onChange={(e) => setCfAccessId(e.target.value)} placeholder="Client ID (Optional)" className="w-full bg-black/40 border border-gray-800 text-gray-400 p-2.5 rounded-xl text-[10px] font-mono outline-none" />
                        <input type="password" value={cfAccessSecret} onChange={(e) => setCfAccessSecret(e.target.value)} placeholder="Secret (Optional)" className="w-full bg-black/40 border border-gray-800 text-gray-400 p-2.5 rounded-xl text-[10px] font-mono outline-none" />
                      </div>
                    </div>
                    
                    {testResult && (
                        <div className={`p-3 rounded-xl text-[10px] font-medium leading-relaxed border animate-in slide-in-from-top-2 ${
                            testResult.ok ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/5 text-rose-400 border-rose-500/20'
                        }`}>
                            <div className="flex items-center gap-2 font-bold mb-1 uppercase">
                              {testResult.ok ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                              {testResult.ok ? "Ready" : "Connection Error"}
                            </div>
                            {testResult.message}
                        </div>
                    )}
                </div>

                <div className="pt-4 sticky bottom-0 bg-gray-900 py-4">
                   <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-xl shadow-indigo-900/40 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest active:scale-[0.98]">
                      <CheckCircle2 size={16} /> Save & Synchronize
                   </button>
                </div>
              </form>

              {/* Right Side: Quick Diagnostics */}
              <div className="w-full lg:w-72 bg-gray-950/50 p-6 overflow-y-auto space-y-6">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Wand2 size={12} className="text-indigo-400" />
                    CORS Strategy
                  </h4>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-[8px] font-bold text-gray-600 uppercase">Current Origin</span>
                        <button onClick={() => setUseWildcard(!useWildcard)} className="text-[8px] text-indigo-400 font-bold hover:underline">
                            {useWildcard ? 'SWITCH TO SPECIFIC' : 'SWITCH TO WILDCARD'}
                        </button>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 p-2 rounded-lg flex items-center justify-between group">
                      <code className="text-[8px] font-mono text-gray-400 truncate pr-2">{displayOrigin}</code>
                      <button onClick={() => navigator.clipboard.writeText(displayOrigin)} className="text-gray-500 hover:text-white"><Copy size={12} /></button>
                    </div>
                    <p className="text-[8px] text-gray-600 leading-tight">
                        Copy this into your Cloudflare <strong>CORS Settings</strong> to allow the browser to talk to your Worker.
                    </p>
                  </div>

                  <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-3 space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Live Handshake</span>
                        <button onClick={startDiagnostic} disabled={isRunningDiagnostic || !proxyUrl} className="p-1 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded disabled:opacity-20">
                            {isRunningDiagnostic ? <RefreshCw size={10} className="animate-spin" /> : <Play size={10} />}
                        </button>
                    </div>
                    <div className="space-y-1.5">
                        {diagnostics.length === 0 && <p className="text-[8px] text-gray-600 italic">Click play to test connectivity.</p>}
                        {diagnostics.map((d, idx) => (
                            <div key={idx} className="flex gap-2 items-start">
                                {d.status === 'success' ? <CheckCircle size={10} className="text-emerald-500 mt-0.5" /> : d.status === 'error' ? <AlertCircle size={10} className="text-rose-500 mt-0.5" /> : <Circle size={10} className="text-gray-700 mt-0.5" />}
                                <div className="min-w-0">
                                    <p className={`text-[8px] font-bold uppercase ${d.status === 'error' ? 'text-rose-400' : 'text-gray-400'}`}>{d.step}</p>
                                    <p className="text-[7px] text-gray-500 leading-tight truncate">{d.details}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Worker Code Tab */
            <div className="flex-1 flex flex-col p-6 space-y-4 overflow-hidden bg-gray-950">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <Code2 className="text-indigo-400" size={18} />
                            Cloudflare Worker Script
                        </h3>
                        <p className="text-[10px] text-gray-500 mt-1 max-w-md">
                            Standard Node.js libraries like <code>discord.js</code> don't work in browsers. 
                            Paste this script into a <strong className="text-gray-300">Cloudflare Worker</strong> to act as your Bot's gateway.
                        </p>
                    </div>
                    <button 
                        onClick={() => navigator.clipboard.writeText(workerCode)}
                        className="bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-600/20 transition-all flex items-center gap-2"
                    >
                        <Copy size={12} /> Copy Script
                    </button>
                </div>
                
                <div className="flex-1 bg-black border border-gray-800 rounded-xl overflow-hidden flex flex-col">
                    <div className="bg-gray-900 px-4 py-2 border-b border-gray-800 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[9px] text-gray-500 font-mono ml-2">worker.js</span>
                    </div>
                    <pre className="flex-1 p-4 font-mono text-[10px] text-indigo-300 overflow-auto leading-relaxed select-all">
                        {workerCode}
                    </pre>
                </div>

                <div className="bg-indigo-500/5 border border-indigo-500/20 p-4 rounded-xl flex gap-3">
                    <Cpu className="text-indigo-400 shrink-0" size={18} />
                    <p className="text-[10px] text-gray-400 leading-relaxed">
                        <strong className="text-indigo-300">Why no discord.js?</strong> This app is a "Remote Sentinel". Using the Discord REST API directly makes it 10x faster and compatible with browser-to-proxy environments like Google AI Studio.
                    </p>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};