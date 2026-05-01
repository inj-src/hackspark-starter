import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Send } from 'lucide-react';

interface ChatWindowProps {
  onClose: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ onClose }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setInputValue('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="bg-white dark:bg-slate-800 w-80 rounded-2xl shadow-2xl dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col border border-slate-100 dark:border-slate-700"
      style={{ height: '400px' }}
    >
      {/* Header */}
      <div className="bg-green-500 p-4 flex items-center justify-between text-white">
        <div className="flex items-center space-x-2">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </div>
          <span className="font-semibold">RentPi Assistant</span>
        </div>
        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.2)' }}
          whileTap={{ scale: 0.9 }}
          className="text-white p-1 rounded-md transition-colors"
        >
          <X size={18} />
        </motion.button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 bg-slate-50 dark:bg-slate-900 p-4 overflow-y-auto flex flex-col space-y-4">
        <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-sm shadow-sm text-sm text-slate-700 dark:text-slate-300 max-w-[85%] border border-slate-100 dark:border-slate-700">
          Hi there! 👋 I'm your RentPi Assistant.
        </div>
        <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-sm shadow-sm text-sm text-slate-700 dark:text-slate-300 max-w-[85%] border border-slate-100 dark:border-slate-700">
          How can I help you find the perfect rental today?
        </div>
      </div>

      {/* Footer / Input */}
      <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
        <form onSubmit={handleSend} className="flex items-center space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-slate-50 dark:bg-slate-700 px-3 py-2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
          />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
          >
            <Send size={16} />
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
};

export default ChatWindow;
