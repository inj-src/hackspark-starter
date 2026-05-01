import React from 'react';
import ChatWindow from '../components/ChatWindow';

const ChatPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 px-4 py-8 flex justify-center">
      <ChatWindow onClose={() => undefined} />
    </div>
  );
};

export default ChatPage;
