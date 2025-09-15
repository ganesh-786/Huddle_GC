import React, { useState, useRef, useEffect } from "react";
import Cookies from "js-cookie";
import {
  Send,
  MoreVertical,
  Smile,
  Users,
  Hash,
  Search,
  Bell,
  Settings,
  Home,
  MessageCircle,
  User,
  Mic,
  UserPlus,
  Volume2,
} from "lucide-react";
import VoiceRecorder from "../components/VoiceRecorder";
import VoicePlayer from "../components/VoicePlayer";
import FriendRequests from "../components/FriendRequests";
import VoiceNoteFeed from "../components/VoiceNoteFeed";
import { useSocket } from "../hooks/useSocket";
import { toast } from "react-toastify";

const ChatApp = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState("chat");
  const [activeChat, setActiveChat] = useState("group");
  const [message, setMessage] = useState("");
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const token = Cookies.get("token");

  // Socket connection
  const { sendMessage: sendSocketMessage, notifyVoiceMessageSent } = useSocket(
    token,
    (newMessage) => {
      setChatMessages(prev => [...prev, newMessage]);
    },
    (newVoiceMessage) => {
      setChatMessages(prev => [...prev, newVoiceMessage]);
    }
  );

  const [messages, setMessages] = useState({
    group: [
      {
        id: 1,
        sender: "Liam",
        content:
          "Hey everyone, welcome to the group! Excited to chat with you all.",
        time: "10:00 AM",
        isOwn: false,
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      },
      {
        id: 2,
        sender: "Olivia",
        content: "Hi Liam, thanks for setting this up! Looking forward to it.",
        time: "10:01 AM",
        isOwn: false,
        avatar:
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      },
      {
        id: 3,
        sender: "You",
        content:
          "No problem, Olivia! Anyone else have any initial thoughts or topics to discuss?",
        time: "10:02 AM",
        isOwn: true,
      },
      {
        id: 4,
        sender: "Noah",
        content:
          "I'm in! Maybe we could start by sharing our favorite podcasts or audiobooks?",
        time: "10:03 AM",
        isOwn: false,
        avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      },
      {
        id: 5,
        sender: "Ava",
        content:
          "That's a great idea, Noah! I'll go first: I'm currently listening to 'The Daily' and really enjoying it.",
        time: "10:04 AM",
        isOwn: false,
        avatar:
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
      },
      {
        id: 6,
        sender: "You",
        content: "Nice! I'm a big fan of 'This American Life'. Anyone else?",
        time: "10:05 AM",
        isOwn: true,
      },
      {
        id: 7,
        sender: "Ethan",
        content:
          "I've been hooked on 'Radiolab' lately. Their sound design is incredible.",
        time: "10:06 AM",
        isOwn: false,
        avatar:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
      },
      {
        id: 8,
        sender: "Sophia",
        content:
          "Oh, I love 'Radiolab' too! Have you heard their episode on the color blue?",
        time: "10:07 AM",
        isOwn: false,
        avatar:
          "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      },
    ],
  });

  useEffect(() => {
    // Initialize with existing group messages
    setChatMessages(messages.group || []);
  }, []);

  useEffect(() => {
    if (activeTab === "chat") {
      fetchMessages();
    }
  }, [activeTab, activeChat]);

  const fetchMessages = async () => {
    // Fetch messages from API if needed
  };
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: messages[activeChat].length + 1,
        sender: "You",
        content: message,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isOwn: true,
      };

      // Send via socket
      sendSocketMessage({
        groupId: activeChat === "group" ? "product-design-team" : null,
        content: message,
        messageType: "text",
      });

      setChatMessages(prev => [...prev, newMessage]);
      setMessage("");
    }
  };

  const handleSendVoice = async (formData) => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8080/api/voice/messages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        const voiceMessage = data.data;
        setChatMessages(prev => [...prev, { ...voiceMessage, isOwn: true }]);
        notifyVoiceMessageSent({
          groupId: activeChat === "group" ? "product-design-team" : null,
          message: voiceMessage,
        });
        toast.success("Voice message sent!");
      }
    } catch (error) {
      toast.error("Failed to send voice message");
    } finally {
      setLoading(false);
    }
  };
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const Sidebar = () => (
    <div className="w-16 bg-white/80 backdrop-blur-md border-r border-slate-200 flex flex-col items-center py-4 space-y-6 shadow-sm">
      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
        <MessageCircle className="w-6 h-6 text-white" />
      </div>

      <nav className="flex flex-col space-y-4">
        <button 
          onClick={() => setActiveTab("chat")}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 group ${
            activeTab === "chat" ? "bg-blue-600" : "bg-slate-100 hover:bg-indigo-50"
          }`}
        >
          <MessageCircle className={`w-5 h-5 ${
            activeTab === "chat" ? "text-white" : "text-slate-600 group-hover:text-blue-600"
          }`} />
        </button>
        <button 
          onClick={() => setActiveTab("friends")}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 group ${
            activeTab === "friends" ? "bg-blue-600" : "bg-slate-100 hover:bg-indigo-50"
          }`}
        >
          <UserPlus className={`w-5 h-5 ${
            activeTab === "friends" ? "text-white" : "text-slate-600 group-hover:text-blue-600"
          }`} />
        </button>
        <button 
          onClick={() => setActiveTab("feed")}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 group ${
            activeTab === "feed" ? "bg-blue-600" : "bg-slate-100 hover:bg-indigo-50"
          }`}
        >
          <Volume2 className={`w-5 h-5 ${
            activeTab === "feed" ? "text-white" : "text-slate-600 group-hover:text-blue-600"
          }`} />
        </button>
      </nav>

        <button className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-indigo-50 flex items-center justify-center transition-all duration-200 hover:scale-105 group">
          <Home className="w-5 h-5 text-slate-600 group-hover:text-blue-600" />
        </button>
        <button className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-indigo-50 flex items-center justify-center transition-all duration-200 hover:scale-105 group">
          <Search className="w-5 h-5 text-slate-600 group-hover:text-blue-600" />
        </button>
        <button className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-indigo-50 flex items-center justify-center transition-all duration-200 hover:scale-105 group">
          <Bell className="w-5 h-5 text-slate-600 group-hover:text-blue-600" />
        </button>
        <button className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-indigo-50 flex items-center justify-center transition-all duration-200 hover:scale-105 group">
          <User className="w-5 h-5 text-slate-600 group-hover:text-blue-600" />
        </button>
      </nav>

      <div className="flex-1" />

      <button className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all duration-200 hover:scale-105 group">
        <Settings className="w-5 h-5 text-slate-600 group-hover:text-slate-700" />
      </button>
    </div>
  );

  const ChatSelector = () => (
    <div className={`w-80 bg-slate-50 border-r border-slate-200 flex flex-col ${
      activeTab !== "chat" ? "hidden" : ""
    }`}>
      <div className="p-6 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900">Messages</h2>
          <button className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-colors shadow-sm">
            <MessageCircle className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-0 rounded-xl text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-3">
          <div className="flex space-x-1 mb-4">
            <button
              onClick={() => setActiveChat("group")}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                activeChat === "group"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-blue-50"
              }`}
            >
              Groups
            </button>
            <button
              onClick={() => setActiveChat("p2p")}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                activeChat === "p2p"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-blue-50"
              }`}
            >
              Direct Messages
            </button>
          </div>

          <div className="space-y-2">
            {activeChat === "group" && (
              <div className="p-4 bg-white rounded-xl border border-slate-200 hover:shadow-md transition-all duration-200 cursor-pointer group">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Hash className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900 text-sm">
                        #product-design-team
                      </h3>
                      <span className="text-xs text-slate-500">10:07 AM</span>
                    </div>
                    <p className="text-sm text-slate-600 truncate">
                      Voice messages and text chat
                    </p>
                  </div>
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-semibold">3</span>
                  </div>
                </div>
              </div>
            )}

            {activeChat === "p2p" && (
              <div className="p-4 bg-white rounded-xl border border-slate-200 hover:shadow-md transition-all duration-200 cursor-pointer group">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={
                        user && user.profileImage
                          ? user.profileImage
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              user && user.username ? user.username : "User"
                            )}`
                      }
                      alt={user && user.username ? user.username : "User"}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-600 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900 text-sm">
                        {user && user.username ? user.username : "User"}
                      </h3>
                      <span className="text-xs text-slate-500">Active</span>
                    </div>
                    <p className="text-sm text-slate-600 truncate">
                      Direct messages
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const ChatHeader = () => (
    <div className={`bg-white border-b border-slate-200 px-6 py-4 ${activeTab !== "chat" ? "hidden" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {activeChat === "group" ? (
            <>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Hash className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">
                  #product-design-team
                </h3>
                <p className="text-sm text-slate-500">8 members</p>
              </div>
            </>
          ) : (
            <>
              <div className="relative">
                <img
                  src={
                    user?.profileImage ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user?.username || "User"
                    )}`
                  }
                  alt={user?.username || "User"}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-600 border-2 border-white rounded-full"></div>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">
                  {user?.username || "User"}
                </h3>
                {user?.email && (
                  <p className="text-xs text-slate-500">{user.email}</p>
                )}
                <p className="text-sm text-blue-600">Online</p>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {activeChat === "group" && (
            <>
              <button className="w-10 h-10 rounded-full bg-slate-100 hover:bg-indigo-50 flex items-center justify-center transition-all hover:scale-105 group">
                <Users className="w-5 h-5 text-slate-600 group-hover:text-blue-600" />
              </button>
            </>
          )}
          {activeChat === "p2p" && (
            <button className="w-10 h-10 rounded-full bg-slate-100 hover:bg-indigo-50 flex items-center justify-center transition-all hover:scale-105 group">
              <Users className="w-5 h-5 text-slate-600 group-hover:text-blue-600" />
            </button>
          )}
          <button className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all hover:scale-105 group">
            <MoreVertical className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>
    </div>
  );

  const MessageBubble = ({ msg }) => (
    <div
      className={`flex ${
        msg.isOwn ? "justify-end" : "justify-start"
      } mb-4 animate-fadeInUp`}
    >
      {!msg.isOwn && (
        <img
          src={
            msg.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender?.username || msg.sender || "User")}`
          }
          alt={msg.sender?.username || msg.sender || "User"}
          className="w-8 h-8 rounded-full mr-3 mt-1 object-cover"
        />
      )}
      <div className={`max-w-xs lg:max-w-md ${msg.isOwn ? "mr-2" : ""}`}>
        {!msg.isOwn && (
          <p className="text-xs text-slate-500 mb-1 ml-2">
            {msg.sender?.username || msg.sender || "User"}
          </p>
        )}
        
        {msg.messageType === "voice" || msg.voiceUrl ? (
          <div
            className={`px-4 py-3 rounded-2xl shadow-sm transition-all hover:shadow-md ${
              msg.isOwn
                ? "bg-blue-600 text-white rounded-br-lg"
                : "bg-slate-100 text-slate-800 rounded-bl-lg"
            }`}
          >
            <VoicePlayer
              audioUrl={`http://localhost:8080${msg.voiceUrl}`}
              duration={msg.voiceDuration}
              className="min-w-[200px]"
            />
          </div>
        ) : (
          <div
            className={`px-4 py-3 rounded-2xl shadow-sm transition-all hover:shadow-md ${
              msg.isOwn
                ? "bg-blue-600 text-white rounded-br-lg"
                : "bg-slate-100 text-slate-800 rounded-bl-lg"
            }`}
          >
            <p className="text-sm leading-relaxed">{msg.content}</p>
          </div>
        )}
        
        <p
          className={`text-xs text-slate-500 mt-1 ${
            msg.isOwn ? "text-right mr-2" : "ml-2"
          }`}
        >
          {msg.time || new Date(msg.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          {msg.isOwn && <span className="text-blue-600">• Sent</span>}
        </p>
      </div>
    </div>
  );

  const ChatWindow = () => (
    <div className={`flex-1 flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 ${activeTab !== "chat" ? "hidden" : ""}`}>
      <ChatHeader />
      <div className="flex-1 overflow-y-auto p-6">
        {chatMessages.map((msg) => (
          <MessageBubble key={msg.id || msg._id} msg={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {showVoiceRecorder && (
        <div className="px-6 pb-4">
          <VoiceRecorder
            onSendVoice={handleSendVoice}
            isGroup={activeChat === "group"}
            groupId={activeChat === "group" ? "product-design-team" : null}
            recipientId={activeChat === "p2p" ? user?.id : null}
          />
        </div>
      )}
      
      <div className="border-t border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 group ${
              showVoiceRecorder 
                ? "bg-red-100 hover:bg-red-200" 
                : "bg-slate-100 hover:bg-indigo-50"
            }`}
          >
            <Mic className={`w-5 h-5 ${
              showVoiceRecorder 
                ? "text-red-600" 
                : "text-slate-600 group-hover:text-blue-600"
            }`} />
          </button>
          <div className="flex-1">
            <input
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={showVoiceRecorder}
              className="w-full px-4 py-2.5 bg-slate-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 ${
              message.trim()
                ? "bg-blue-600 hover:bg-blue-700 shadow-md"
                : "bg-slate-200 cursor-not-allowed"
            }`}
          >
            <Send
              className={`w-5 h-5 ${
                message.trim() ? "text-white" : "text-slate-400"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );

  const MainContent = () => {
    if (activeTab === "friends") {
      return (
        <div className="flex-1 p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <FriendRequests token={token} />
        </div>
      );
    }

    if (activeTab === "feed") {
      return (
        <div className="flex-1 p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <VoiceNoteFeed token={token} />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="w-full bg-white/80 py-4 px-8 flex items-center justify-between border-b border-slate-200">
        <h2 className="text-2xl font-bold text-blue-700">
          Welcome{user?.username ? `, ${user.username}` : ""}!
        </h2>
        <button
          onClick={onLogout}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Logout
        </button>
      </div>
      <div className="flex flex-1">
        <Sidebar />
        {activeTab === "chat" && <ChatSelector />}
        {activeTab === "chat" && <ChatWindow />}
        {activeTab !== "chat" && <MainContent />}
      </div>
    </div>
  );
};

export default ChatApp;
