import React from "react";
import { createRoot } from "react-dom/client";
import ChatBot from "./ChatBot";

const ChatBotWidget = ({ userToken, onClose }) => {
  return (
    <div
      id="chatbot-widget"
      className="fixed bottom-4 right-4 w-80 h-96 bg-white border rounded-lg shadow-lg"
    >
      <button
        onClick={onClose}
        className="absolute top-2 right-4 text-gray-500 hover:text-gray-700"
      >
        &times;
      </button>
      <ChatBot userToken={userToken} />
    </div>
  );
};

export const renderChatBotWidget = (elementId, userToken) => {
  const container = document.getElementById(elementId);
  if (container) {
    const root = createRoot(container);
    const handleClose = () => {
      root.unmount();
    };
    root.render(<ChatBotWidget userToken={userToken} onClose={handleClose} />);
  }
};

window.renderChatBotWidget = renderChatBotWidget;
