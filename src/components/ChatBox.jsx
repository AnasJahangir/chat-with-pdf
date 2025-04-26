import React, { useState } from "react";

const ChatBox = ({ onSend }) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    onSend(message);
    setMessage("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-3 w-full animate-fade-up"
    >
      <input
        type="text"
        placeholder="Ask something from the PDF..."
        className="flex-1 p-4 rounded-2xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button
        type="submit"
        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-2xl hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg"
      >
        Send
      </button>
    </form>
  );
};

export default ChatBox;
