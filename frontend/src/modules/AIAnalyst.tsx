import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  HelpCircle,
  Table,
  CheckCircle2,
  User,
  ArrowRight,
  Database
} from 'lucide-react';
import { api } from '../services/api';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  data_table?: any[];
  insights?: string[];
  timestamp: string;
}

export const AIAnalyst: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getAnalystSuggestions()
      .then(setSuggestions)
      .catch(console.error);

    // Initial greeting message
    setMessages([
      {
        id: 'msg-0',
        sender: 'assistant',
        text: "Hello! I am your **i95Dev Customer Intelligence AI Analyst**. I execute real-time queries against our active SQLite database and computed analytical tables to answer questions about customer segments, stalled opportunities, project values, and campaign conversions without hallucinating. What would you like to investigate today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (queryText?: string) => {
    const q = queryText || inputQuery;
    if (!q.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await api.chatAnalyst(q);
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        sender: 'assistant',
        text: res.answer,
        data_table: res.data_table,
        insights: res.insights,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMsg]);
      setLoading(false);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        sender: 'assistant',
        text: `Error processing query: ${err.message || 'Unable to connect to analytics engine.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Conversational AI Analyst
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Ask natural-language analytical questions. The assistant performs live database aggregation and presents supporting data tables.
        </p>
      </div>

      {/* Suggested Prompts Bar */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" /> Suggested Inquiries:
        </span>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((sug, i) => (
            <button
              key={i}
              onClick={() => handleSend(sug)}
              className="text-xs px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-slate-700 rounded-lg text-left shadow-sm transition-colors"
            >
              {sug}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Stream Window */}
      <div className="saas-card flex flex-col h-[600px] overflow-hidden">
        {/* Messages List */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-3xl rounded-2xl p-4 text-xs space-y-3 leading-relaxed shadow-sm ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-slate-50 text-slate-900 border border-slate-200/80 rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-line font-normal">{m.text}</div>

                {/* Supporting Data Table */}
                {m.data_table && m.data_table.length > 0 && (
                  <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100/80 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                        <tr>
                          {Object.keys(m.data_table[0]).map((col) => (
                            <th key={col} className="py-2 px-3">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {m.data_table.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-50">
                            {Object.values(row).map((val: any, cIdx) => (
                              <td key={cIdx} className="py-2 px-3 text-slate-800">
                                {String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Supporting Insights */}
                {m.insights && m.insights.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/70 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Analyst Grounded Takeaways:
                    </span>
                    {m.insights.map((ins, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-slate-700 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{ins}</span>
                      </div>
                    ))}
                  </div>
                )}

                <span className={`block text-[10px] ${m.sender === 'user' ? 'text-blue-200' : 'text-slate-400'} text-right mt-1`}>
                  {m.timestamp}
                </span>
              </div>

              {m.sender === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start items-center text-xs text-slate-500 pl-11">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce delay-100"></div>
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce delay-200"></div>
              <span className="text-slate-400">Executing database aggregation...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="Ask an analytical question (e.g. Which segment has the highest conversion?)..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
            />
            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="px-5 py-2.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask Analyst</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
