import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { apiService } from '../services/api';
import { Send, User, Sparkles, MessageCircle, HelpCircle, Loader2 } from 'lucide-react';

interface TutorTabProps {
  extractedText: string;
}

export default function TutorTab({ extractedText }: TutorTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tutorMode, setTutorMode] = useState<string>('normal');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const modes = [
    { id: 'normal', label: 'Default Tutor', desc: 'Standard guidance' },
    { id: 'simple', label: 'Simple Words', desc: 'Plain English explanation' },
    { id: 'eli10', label: 'Like I\'m 10 (ELI10)', desc: 'Basic analogies & stories' },
    { id: 'mixed_tamil', label: 'Tamil-English Blend', desc: 'Conversational Tanglish explanation' },
    { id: 'exam_oriented', label: 'Exam Focus', desc: 'High-yield points & common traps' }
  ];

  const handleSend = async (e?: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    const msgText = customMsg || input;
    if (!msgText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content: msgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Gather history
      const historyPayload = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const result = await apiService.chatTutor(extractedText, historyPayload, msgText, tutorMode);

      const tutorMessage: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        role: 'model',
        content: result.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, tutorMessage]);
    } catch (e) {
      console.error('Chat error:', e);
      const errorMessage: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        role: 'model',
        content: 'I encountered an issue connecting to my network. Please make sure the backend Flask app is running.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    handleSend(undefined, question);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[600px] animate-slide-up">
      {/* Sidebar - Mode Selector */}
      <div className="lg:col-span-1 space-y-4 flex flex-col h-full">
        <div className="glass rounded-3xl p-5 shadow-sm space-y-4 flex-1 overflow-y-auto">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <Sparkles className="h-4.5 w-4.5 text-brand-500" />
            <h3 className="font-bold text-slate-850 dark:text-white text-[15px]">Tutor Style</h3>
          </div>
          
          <div className="space-y-2.5">
            {modes.map((m) => (
              <button
                key={m.id}
                onClick={() => setTutorMode(m.id)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-200 focus:outline-none ${
                  tutorMode === m.id
                    ? 'border-brand-500 bg-brand-500/5 text-brand-600 dark:text-brand-400 font-semibold shadow-sm shadow-brand-500/5'
                    : 'border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/10 text-slate-650 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="text-xs uppercase font-extrabold tracking-wider">{m.label}</div>
                <div className="text-[11px] opacity-75 mt-0.5 font-normal leading-normal">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Box */}
      <div className="lg:col-span-3 glass rounded-3xl shadow-sm border border-slate-200/50 dark:border-slate-800 flex flex-col h-full overflow-hidden">
        {/* Chat Header */}
        <div className="py-4 px-6 border-b border-slate-200/50 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
              <MessageCircle className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-[15px]">AI Study Copilot</h3>
              <p className="text-[11px] text-emerald-500 font-semibold flex items-center mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block mr-1.5 animate-pulse" />
                Context-Aware Mode
              </p>
            </div>
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
              <div className="h-16 w-16 rounded-3xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                <HelpCircle className="h-8 w-8 text-slate-400 dark:text-slate-600" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base">Ask anything about your notes</h4>
                <p className="text-xs text-slate-450 dark:text-slate-500 mt-1.5 leading-relaxed">
                  I have indexed your study material. Ask me to explain concepts, list facts, or explain them in Tanglish (Tamil-English) style.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full pt-4">
                <button 
                  onClick={() => handleQuickQuestion("Summarize the most important concept in 3 bullet points.")}
                  className="p-3 text-[12px] font-semibold text-slate-650 dark:text-slate-400 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-brand-500/30 text-center hover:bg-slate-50 dark:hover:bg-slate-900/40"
                >
                  "Summarize key concept"
                </button>
                <button 
                  onClick={() => handleQuickQuestion("What are the most likely questions from this material on an exam?")}
                  className="p-3 text-[12px] font-semibold text-slate-650 dark:text-slate-400 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-brand-500/30 text-center hover:bg-slate-50 dark:hover:bg-slate-900/40"
                >
                  "Expected exam questions"
                </button>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div 
                  key={msg.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div className={`flex items-start space-x-2.5 max-w-[85%] ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      isUser 
                        ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300' 
                        : 'bg-brand-500/10 text-brand-500'
                    }`}>
                      {isUser ? <User className="h-4 w-4" /> : 'PW'}
                    </div>
                    {/* Bubble */}
                    <div>
                      <div className={`py-3 px-4.5 rounded-2xl text-[14px] leading-relaxed whitespace-pre-wrap ${
                        isUser 
                          ? 'bg-brand-600 text-white rounded-tr-none font-medium' 
                          : 'bg-slate-100 dark:bg-slate-900/80 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/40 dark:border-slate-850/50'
                      }`}>
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block px-1 text-right">
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {isLoading && (
            <div className="flex justify-start items-center space-x-2.5">
              <div className="h-8 w-8 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center flex-shrink-0 text-xs">
                PW
              </div>
              <div className="bg-slate-100 dark:bg-slate-900/80 border border-slate-200/40 dark:border-slate-850/50 py-3 px-5 rounded-2xl rounded-tl-none flex items-center space-x-2 text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
                <span className="text-xs font-medium">Tutor is thinking...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-200/50 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/20">
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder={isLoading ? "Please wait..." : `Ask question (Style: ${modes.find(m => m.id === tutorMode)?.label})...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-550 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all duration-200"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:hover:bg-brand-600 text-white p-3.5 rounded-2xl transition-all duration-200 shadow-md shadow-brand-500/15 active:scale-95 focus:outline-none"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
