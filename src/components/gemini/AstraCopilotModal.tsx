import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Sparkles,
  Send,
  User,
  Plus,
  BookOpen,
  HelpCircle,
  Copy,
  Check,
  RefreshCw,
  Rocket,
} from 'lucide-react';
import { GeminiLogo } from '../common/GeminiLogo';
import { Subject, Mission } from '../../types';
import { sound } from '../../lib/audio';
import { triggerStrongButtonBurst } from '../particles/ClickBurst';

interface AstraCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  onCreateMissionFromText?: (title: string, description: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'astra';
  text: string;
  timestamp: string;
}

const QUICK_DOUBTS = [
  'Explain Kepler’s Three Laws of Planetary Motion simply',
  'How does Shor’s Algorithm achieve quantum exponential speedup?',
  'Draft a 3-day high-yield study flight plan for my finals',
  'How do I calculate delta-V for a Hohmann transfer orbit?',
  'Explain entropy and second law of thermodynamics intuitively',
];

export const AstraCopilotModal: React.FC<AstraCopilotModalProps> = ({
  isOpen,
  onClose,
  subjects,
  onCreateMissionFromText,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'astra',
      text: `Greetings Commander! I am **Astra**, your Gemini AI Flight Copilot & Academic Tutor.\n\nAsk me any academic doubt—whether it's complex derivations in physics, calculus problem sets, quantum computing, or structuring a multi-day study sprint. What trajectory shall we calculate today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.name || 'General STEM');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputText;
    if (!textToSend.trim() || isLoading) return;

    sound.playRocketSound(0.8);

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/ask-doubt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: textToSend.trim(),
          subject: selectedSubject,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Flight telemetry error.');
      }

      sound.playAccomplishedChime();

      const astraMsg: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        sender: 'astra',
        text: data.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, astraMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        sender: 'astra',
        text: `⚠️ **Orbital Communication Interrupted**: ${
          err.message || 'Unable to connect to Gemini flight computer. Check your network or API secrets.'
        }`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateMission = (messageText: string) => {
    if (!onCreateMissionFromText) return;
    const lines = messageText.split('\n').filter((l) => l.trim().length > 0);
    const title = (lines[0] || 'Study Mission from Astra').replace(/[#*`]/g, '').trim().slice(0, 70);
    onCreateMissionFromText(title, messageText);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md">
      <div className="glass-panel w-full max-w-3xl h-[88vh] rounded-3xl border border-[#38bdf8]/40 shadow-2xl flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#38bdf8]/25 bg-[#050b1a] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1d4ed8] via-[#2563eb] to-[#38bdf8] flex items-center justify-center text-white shadow-lg shadow-[#38bdf8]/30">
              <GeminiLogo className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-bebas text-2xl text-white font-bold tracking-wide">
                  GEMINI AI ACADEMIC TUTOR
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/40">
                  ONLINE
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Ask any academic doubt, solve problems step-by-step, or generate study plans.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Subject Context Selector */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="hidden sm:block px-3 py-1.5 rounded-xl bg-[#08122a] border border-[#38bdf8]/30 text-xs text-[#38bdf8] font-bold focus:outline-none"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.name}>
                  Orbit: {s.name}
                </option>
              ))}
              <option value="General STEM">Orbit: General STEM</option>
            </select>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#f8fafc]/60 hover:text-[#38bdf8] hover:bg-[#0c1a38] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isAstra = msg.sender === 'astra';

            return (
              <div
                key={msg.id}
                className={`flex items-start space-x-3 ${
                  isAstra ? 'justify-start' : 'justify-end'
                }`}
              >
                {isAstra && (
                  <div className="w-8 h-8 rounded-lg bg-[#38bdf8]/20 border border-[#38bdf8]/40 flex items-center justify-center text-[#38bdf8] shrink-0 mt-1">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isAstra
                      ? 'bg-[#08122a] border border-[#38bdf8]/30 text-[#f8fafc] shadow-md'
                      : 'bg-gradient-to-r from-[#1d4ed8] to-[#2563eb] text-white shadow-lg'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#38bdf8] mb-1.5 opacity-80">
                    <span className="font-bold">{isAstra ? 'ASTRA COPILOT' : 'COMMANDER'}</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  {/* Message body */}
                  <div className="whitespace-pre-wrap font-sans space-y-2">
                    {msg.text}
                  </div>

                  {/* Actions for Astra responses */}
                  {isAstra && msg.id !== 'welcome' && (
                    <div className="mt-3 pt-2.5 border-t border-[#38bdf8]/20 flex items-center justify-end space-x-3 text-[11px] font-mono">
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="text-[#38bdf8] hover:underline flex items-center space-x-1"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#34d399]" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Notes</span>
                          </>
                        )}
                      </button>

                      {onCreateMissionFromText && (
                        <button
                          onClick={() => handleCreateMission(msg.text)}
                          className="text-[#67e8f9] hover:underline flex items-center space-x-1 font-bold"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Convert to Mission</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {!isAstra && (
                  <div className="w-8 h-8 rounded-lg bg-[#2563eb] flex items-center justify-center text-white shrink-0 mt-1 shadow-md">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-[#38bdf8]/20 border border-[#38bdf8]/40 flex items-center justify-center text-[#38bdf8] shrink-0">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3 rounded-2xl bg-[#08122a] border border-[#38bdf8]/30 text-xs text-[#38bdf8] font-mono flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-ping" />
                <span>Astra is analyzing problem telemetry & synthesizing steps...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Doubts Suggestions Bar */}
        <div className="px-4 py-2 border-t border-[#38bdf8]/15 bg-[#040916] overflow-x-auto flex items-center space-x-2">
          <span className="text-[10px] font-mono text-[#38bdf8] font-bold uppercase shrink-0">
            QUICK DOUBTS:
          </span>
          {QUICK_DOUBTS.map((doubt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(doubt)}
              className="px-2.5 py-1 rounded-lg bg-[#07132c] hover:bg-[#0c1f44] border border-[#38bdf8]/25 text-[11px] text-[#f8fafc]/80 hover:text-white shrink-0 transition-colors truncate max-w-[240px]"
            >
              {doubt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-[#38bdf8]/25 bg-[#050b1a]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask an academic doubt, proof, concept explanation, or study strategy..."
              className="flex-1 px-4 py-3 rounded-xl bg-[#08122a] border border-[#38bdf8]/35 text-[#f8fafc] placeholder-[#f8fafc]/45 text-sm focus:outline-none focus:border-[#38bdf8]"
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="blue-gradient-btn px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 disabled:opacity-50 shrink-0"
            >
              <span>Transmit</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
