import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Send } from "lucide-react";

interface ChatWindowProps {
  onClose: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ onClose }) => {
  const [inputValue, setInputValue] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setInputValue("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="flex flex-col bg-white dark:bg-slate-800 shadow-2xl dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-slate-700 rounded-2xl w-80 overflow-hidden"
      style={{ height: "400px", marginRight: "20px" }}
    >
      {/* Header */}
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
          whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.2)" }}
          whileTap={{ scale: 0.9 }}
          className="p-1 rounded-md text-white transition-colors"
        >
          <X size={18} />
        </motion.button>
      </div>

      {/* Messages Area */}
      <div className="flex flex-col flex-1 space-y-4 bg-slate-50 dark:bg-slate-900 p-4 overflow-y-auto">
        <div className="bg-white dark:bg-slate-800 shadow-sm p-3 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-sm max-w-[85%] text-slate-700 dark:text-slate-300 text-sm">
          Hi there! 👋 I'm your RentPi Assistant.
        </div>
        <div className="bg-white dark:bg-slate-800 shadow-sm p-3 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-sm max-w-[85%] text-slate-700 dark:text-slate-300 text-sm">
          How can I help you find the perfect rental today?
        </div>
      </div>

      {/* Footer / Input */}
      <div className="bg-white dark:bg-slate-800 p-3 border-slate-100 dark:border-slate-700 border-t">
        <form onSubmit={handleSend} className="flex items-center space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-slate-50 dark:bg-slate-700 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-900 dark:text-slate-100 text-sm placeholder-slate-400 dark:placeholder-slate-500"
          />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="bg-green-500 hover:bg-green-600 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 text-white transition-colors"
          >
            <Send size={16} />
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
};

export default ChatWindow;
