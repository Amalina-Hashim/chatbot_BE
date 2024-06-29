import React from "react";
import ReactDOM from "react-dom";
import ChatBot from "./ChatBot";

const ChatBotWidget = () => {
  return (
    <div
      id="chatbot-widget"
      className="fixed bottom-4 right-4 w-80 h-96 bg-white border rounded-lg shadow-lg"
    >
      <ChatBot />
    </div>
  );
};

// Export the widget as a standalone function
export const renderChatBotWidget = (elementId) => {
  ReactDOM.render(<ChatBotWidget />, document.getElementById(elementId));
};
