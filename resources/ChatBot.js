import React, { useState } from "react";
import axios from "axios";

const API_URL = "https://chatbot-widget88.azurewebsites.net";

const sendMessage = async (message, userToken) => {
  if (!userToken) {
    throw new Error("No token provided");
  }
  const response = await axios.post(
    `${API_URL}/chat`,
    { message },
    {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    }
  );
  return response.data;
};

const ChatBot = ({ userToken }) => {
  const [message, setMessage] = useState("");
  const [chatLog, setChatLog] = useState([]);
  const [audioPath, setAudioPath] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    setLoading(true);
    try {
      const response = await sendMessage(message, userToken);
      setChatLog([
        ...chatLog,
        { sender: "user", text: message },
        { sender: "bot", text: response.choices[0].message.content },
      ]);
      setMessage("");
      setAudioPath(response.audioPath);
    } catch (error) {
      console.error("Error sending message:", error);
    }
    setLoading(false);
  };

  const handlePlayAudio = () => {
    const audio = new Audio(
      `https://chatbot-widget88.azurewebsites.net/${audioPath}`
    );
    audio.play();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="p-4 flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        {chatLog.map((entry, index) => (
          <div
            key={index}
            className={`mb-2 ${
              entry.sender === "user" ? "text-right" : "text-left"
            }`}
          >
            <span
              className={`inline-block p-2 rounded ${
                entry.sender === "user" ? "bg-blue-100" : "bg-gray-100"
              }`}
            >
              {entry.text}
            </span>
          </div>
        ))}
        {loading && (
          <div className="text-left mb-2">
            <span className="inline-block p-2 rounded bg-gray-100 animate-pulse">
              ...
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 p-2 border rounded-l"
          style={{ minWidth: 0 }}
        />
        <button
          onClick={handleSendMessage}
          className="px-4 py-2 text-white rounded-r"
          style={{ backgroundColor: "#0000FF", flexShrink: 0 }}
          disabled={loading}
        >
          Send
        </button>
      </div>
      {audioPath && (
        <button
          onClick={handlePlayAudio}
          className="mt-4 px-4 py-2 text-white rounded"
          style={{ backgroundColor: "#9999ef", flexShrink: 0 }}
        >
          Play Audio Response
        </button>
      )}
    </div>
  );
};

export default ChatBot;
