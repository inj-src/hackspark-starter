import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Plus, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  type ChatMessage,
  type ChatSession,
  fetchSessionHistory,
  fetchSessions,
  sendChatMessage,
  deleteSession,
} from '../lib/chat';

interface ChatWindowProps {
  onClose: () => void;
}

const QUICK_PROMPTS = [
  'is there any portable station available?',
  'is there any cycle available?',
  'what do you know about Pro Tool #7',
];

function createSessionId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `session-${Date.now()}`;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ onClose }) => {
  const queryClient = useQueryClient();
  const [inputValue, setInputValue] = useState('');
  const [activeSessionId, setActiveSessionId] = useState<string>(createSessionId());
  const [localMessagesBySession, setLocalMessagesBySession] = useState<Record<string, ChatMessage[]>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sessionsQuery = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: fetchSessions,
  });

  const sessions = useMemo(() => sessionsQuery.data?.sessions ?? [], [sessionsQuery.data]);
  const sessionExists = useMemo(
    () => sessions.some((s) => s.sessionId === activeSessionId),
    [activeSessionId, sessions]
  );
  const resolvedSessionId = activeSessionId;

  const historyQuery = useQuery({
    queryKey: ['chat-history', resolvedSessionId],
    queryFn: () => fetchSessionHistory(resolvedSessionId),
    enabled: sessionExists,
    retry: false,
  });

  const sendMutation = useMutation({
    mutationFn: sendChatMessage,
    onSuccess: ({ reply }) => {
      const now = new Date().toISOString();
      setLocalMessagesBySession((current) => {
        const existing = current[resolvedSessionId] ?? historyQuery.data?.messages ?? [];
        return { ...current, [resolvedSessionId]: [...existing, { role: 'assistant', content: reply, timestamp: now }] };
      });
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['chat-history', resolvedSessionId] });
    },
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send message');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSession,
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
      if (resolvedSessionId === sessionId) {
        setActiveSessionId(createSessionId());
      }
      setLocalMessagesBySession((current) => {
        if (!current[sessionId]) return current;
        const next = { ...current };
        delete next[sessionId];
        return next;
      });
    },
  });

  const messages = useMemo(() => {
    if (historyQuery.isError) return [];
    return localMessagesBySession[resolvedSessionId] ?? historyQuery.data?.messages ?? [];
  }, [historyQuery.data?.messages, historyQuery.isError, localMessagesBySession, resolvedSessionId]);

  const submitMessage = (rawText: string) => {
    const text = rawText.trim();
    if (!text || sendMutation.isPending) return;

    setErrorMessage(null);
    setInputValue('');

    const now = new Date().toISOString();
    setLocalMessagesBySession((current) => {
      const existing = current[resolvedSessionId] ?? historyQuery.data?.messages ?? [];
      return { ...current, [resolvedSessionId]: [...existing, { role: 'user', content: text, timestamp: now }] };
    });
    sendMutation.mutate({ sessionId: resolvedSessionId, message: text });
  };

  const handleSend = (event: React.FormEvent) => {
    event.preventDefault();
    submitMessage(inputValue);
  };

  const handleNewChat = () => {
    setErrorMessage(null);
    setInputValue('');
    setActiveSessionId(createSessionId());
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="flex bg-white dark:bg-slate-800 shadow-2xl dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-slate-700 rounded-2xl overflow-hidden"
      style={{ width: '720px', height: '460px', marginRight: '20px' }}
    >
      <aside className="w-64 border-r border-slate-100 dark:border-slate-700 flex flex-col bg-slate-50 dark:bg-slate-900">
        <div className="p-3 border-b border-slate-100 dark:border-slate-700">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-sm font-semibold"
          >
            <Plus size={16} />
            New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {sessionsQuery.isLoading && <p className="text-xs text-slate-500 p-2">Loading sessions...</p>}
          {!sessionsQuery.isLoading && sessions.length === 0 && <p className="text-xs text-slate-500 p-2">No previous chats</p>}
          {sessions.map((session: ChatSession) => (
            <div
              key={session.sessionId}
              className={`group rounded-lg p-2 cursor-pointer border ${
                session.sessionId === resolvedSessionId
                  ? 'border-green-500 bg-green-50 dark:bg-slate-800'
                  : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700'
              }`}
              onClick={() => setActiveSessionId(session.sessionId)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{session.name}</p>
                  <p className="text-xs text-slate-500 truncate">{new Date(session.lastMessageAt).toLocaleString()}</p>
                </div>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    deleteMutation.mutate(session.sessionId);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500"
                  aria-label="Delete session"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <div className="flex flex-col flex-1">
        <div className="flex justify-between items-center bg-green-500 p-4 text-white">
          <div className="flex items-center space-x-2">
            <div className="relative flex w-3 h-3">
              <span className="inline-flex absolute bg-white opacity-75 rounded-full w-full h-full animate-ping"></span>
              <span className="inline-flex relative bg-white rounded-full w-3 h-3"></span>
            </div>
            <span className="font-semibold">RentPi Assistant</span>
          </div>
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.2)' }}
            whileTap={{ scale: 0.9 }}
            className="p-1 rounded-md text-white transition-colors"
          >
            <X size={18} />
          </motion.button>
        </div>

        <div className="flex flex-col flex-1 space-y-3 bg-slate-50 dark:bg-slate-900 p-4 overflow-y-auto">
          {historyQuery.isLoading && <p className="text-sm text-slate-500">Loading messages...</p>}
          {!historyQuery.isLoading && messages.length === 0 && (
            <div className="bg-white dark:bg-slate-800 shadow-sm p-3 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-sm max-w-[85%] text-slate-700 dark:text-slate-300 text-sm">
              Ask me about rentals, availability, trends, categories, or discounts.
            </div>
          )}
          {messages.map((message, index) => {
            const isUser = message.role === 'user';
            return (
              <div key={`${message.timestamp}-${index}`} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    isUser
                      ? 'bg-green-500 text-white rounded-br-sm'
                      : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-tl-sm'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            );
          })}
          {sendMutation.isPending && <p className="text-xs text-slate-500">Assistant is thinking...</p>}
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 border-slate-100 dark:border-slate-700 border-t">
          <div className="flex flex-wrap gap-2 mb-3">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => submitMessage(prompt)}
                disabled={sendMutation.isPending}
                className="text-xs px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 disabled:opacity-60"
              >
                {prompt}
              </button>
            ))}
          </div>
          <form onSubmit={handleSend} className="flex items-center space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-slate-50 dark:bg-slate-700 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-900 dark:text-slate-100 text-sm placeholder-slate-400 dark:placeholder-slate-500"
            />
            <motion.button
              type="submit"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="bg-green-500 hover:bg-green-600 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 text-white transition-colors disabled:opacity-60"
              disabled={sendMutation.isPending}
            >
              <Send size={16} />
            </motion.button>
          </form>
          {errorMessage && <p className="text-xs text-red-500 mt-2">{errorMessage}</p>}
        </div>
      </div>
    </motion.div>
  );
};

export default ChatWindow;
