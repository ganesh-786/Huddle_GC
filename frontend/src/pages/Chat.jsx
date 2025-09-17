import React, { useState, useEffect, useRef } from "react";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import {
  Send,
  MoreVertical,
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
import FriendRequests from "../components/FriendRequests";
import VoiceNoteFeed from "../components/VoiceNoteFeed";
import VoicePlayer from "../components/VoicePlayer";
import { useSocket } from "../hooks/useSocket";

const ChatApp = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState("chat");
  const [activeChat, setActiveChat] = useState(null);
  const [activeChatType, setActiveChatType] = useState("friends");
  const [message, setMessage] = useState("");
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const token = Cookies.get("token");
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  // Socket connection
  const getCurrentUserId = () => {
    try {
      const tokenPayload = JSON.parse(atob(token.split(".")[1]));
      return tokenPayload.id;
    } catch (e) {
      return null;
    }
  };

  const { sendMessage: sendSocketMessage, sendVoiceMessage } = useSocket(
    token,
    (newMessage) => {
      // Ignore if own message
      if (newMessage.sender._id === getCurrentUserId()) return;

      setChatMessages((prev) => {
        if (prev.some((m) => m._id === newMessage._id)) return prev; // prevent dupes
        return [...prev, { ...newMessage, isOwn: false }];
      });
      fetchConversations();
    },
    (newVoiceMessage) => {
      if (newVoiceMessage.sender._id === getCurrentUserId()) return;

      setChatMessages((prev) => {
        if (prev.some((m) => m._id === newVoiceMessage._id)) return prev;
        return [
          ...prev,
          { ...newVoiceMessage, isOwn: false, messageType: "voice" },
        ];
      });
      fetchConversations();
    }
  );

  useEffect(() => {
    if (activeTab === "chat") {
      fetchFriends();
      fetchConversations();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeChat && activeChatType === "friends") {
      fetchChatMessages(activeChat._id);
    }
  }, [activeChat, activeChatType]);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Auto-focus input after sending message
  useEffect(() => {
    if (messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, []); // only once

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchFriends = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/friends", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setFriends(data.data);
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch(
        "http://localhost:8080/api/messages/conversations",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setConversations(data.data);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const fetchChatMessages = async (recipientId) => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:8080/api/messages/conversation?recipientId=${recipientId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        const messagesWithOwnership = data.data.messages.map((msg) => ({
          ...msg,
          isOwn: msg.sender._id === getCurrentUserId(),
        }));
        setChatMessages(messagesWithOwnership);
      }
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  // Fixed message sending
  const handleSendMessage = async () => {
    if (message.trim() && activeChat && !sendingMessage) {
      const messageContent = message.trim();

      try {
        setSendingMessage(true);

        const response = await fetch(
          "http://localhost:8080/api/messages/text",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              recipient: activeChat._id,
              content: messageContent,
            }),
          }
        );

        const data = await response.json();
        if (data.success) {
          const newMessage = {
            ...data.data,
            isOwn: true,
          };

          // ✅ Only add if not already in chat
          setChatMessages((prev) => {
            if (prev.some((m) => m._id === newMessage._id)) return prev;
            return [...prev, newMessage];
          });

          // ✅ Send via socket so the *other user* gets it
          sendSocketMessage({
            recipientId: activeChat._id,
            content: messageContent,
            messageType: "text",
          });

          fetchConversations(); // refresh convo list
          setMessage(""); // clear input immediately
        } else {
          toast.error(data.message || "Failed to send message");
          setMessage(messageContent); // restore unsent text
        }
      } catch (error) {
        console.error("Error sending message:", error);
        toast.error("Failed to send message");
        setMessage(messageContent);
      } finally {
        setSendingMessage(false);
      }
    }
  };

  // Fixed voice message sending
  // const handleSendVoice = async (audioBlob, duration) => {
  //   if (!activeChat || !audioBlob) return;

  //   try {
  //     setLoading(true);

  //     // const formData = new FormData();
  //     // formData.append("voice", audioBlob, "voice-message.webm"); // field name must match backend
  //     const formData = new FormData();
  //     const blob = new Blob([audioBlob], { type: "audio/webm" });
  //     formData.append("voice", blob, "voice-message.webm");
  //     formData.append("recipient", activeChat._id);
  //     formData.append("duration", (duration || 0).toString());

  //     const response = await fetch("http://localhost:8080/api/voice/messages", {
  //       method: "POST",
  //       headers: { Authorization: `Bearer ${token}` }, // ❌ no Content-Type here
  //       body: formData,
  //     });

  //     const data = await response.json();
  //     if (data.success) {
  //       const voiceMessage = {
  //         ...data.data,
  //         isOwn: true,
  //         messageType: "voice",
  //       };

  //       setChatMessages((prev) => [...prev, voiceMessage]);

  //       // notifyVoiceMessageSent({
  //       //   recipientId: activeChat._id,
  //       //   message: voiceMessage,
  //       // });
  //       sendVoiceMessage({
  //         recipientId: activeChat._id,
  //         message: voiceMessage,
  //       });

  //       toast.success("Voice message sent!");
  //       fetchConversations();
  //       setShowVoiceRecorder(false);
  //     } else {
  //       toast.error(data.message || "Failed to send voice message");
  //     }
  //   } catch (error) {
  //     console.error("Error sending voice message:", error);
  //     toast.error("Failed to send voice message");
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const handleSendVoice = async (audioBlob, duration) => {
    if (!activeChat || !audioBlob) return;

    try {
      setLoading(true);

      const blob =
        audioBlob instanceof Blob
          ? audioBlob
          : new Blob([audioBlob], { type: "audio/webm" });

      const formData = new FormData();
      formData.append("voice", blob, "voice-message.webm");
      formData.append("recipient", activeChat._id);
      formData.append("duration", (duration || 0).toString()); // ✅ safe fallback

      const response = await fetch("http://localhost:8080/api/voice/messages", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        const voiceMessage = {
          ...data.data,
          isOwn: true,
          messageType: "voice",
        };

        setChatMessages((prev) => [...prev, voiceMessage]);

        sendVoiceMessage({
          recipientId: activeChat._id,
          ...voiceMessage,
        });

        toast.success("Voice message sent!");
        fetchConversations();
        setShowVoiceRecorder(false);
      } else {
        toast.error(data.message || "Failed to send voice message");
      }
    } catch (error) {
      console.error("Error sending voice message:", error);
      toast.error("Failed to send voice message");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectChat = (friend) => {
    setActiveChat(friend);
    setActiveChatType("friends");
    setChatMessages([]);
    setShowVoiceRecorder(false); // Close voice recorder when switching chats
  };

  // Sidebar component
  const Sidebar = () => (
    <div className="w-16 bg-white/80 backdrop-blur-md border-r border-slate-200 flex flex-col items-center py-4 space-y-6 shadow-sm">
      <nav className="flex flex-col space-y-4">
        <button
          onClick={() => setActiveTab("chat")}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 group ${
            activeTab === "chat"
              ? "bg-blue-600"
              : "bg-slate-100 hover:bg-indigo-50"
          }`}
        >
          <MessageCircle
            className={`w-5 h-5 ${
              activeTab === "chat"
                ? "text-white"
                : "text-slate-600 group-hover:text-blue-600"
            }`}
          />
        </button>
        <button
          onClick={() => setActiveTab("friends")}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 group ${
            activeTab === "friends"
              ? "bg-blue-600"
              : "bg-slate-100 hover:bg-indigo-50"
          }`}
        >
          <UserPlus
            className={`w-5 h-5 ${
              activeTab === "friends"
                ? "text-white"
                : "text-slate-600 group-hover:text-blue-600"
            }`}
          />
        </button>
        <button
          onClick={() => setActiveTab("feed")}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 group ${
            activeTab === "feed"
              ? "bg-blue-600"
              : "bg-slate-100 hover:bg-indigo-50"
          }`}
        >
          <Volume2
            className={`w-5 h-5 ${
              activeTab === "feed"
                ? "text-white"
                : "text-slate-600 group-hover:text-blue-600"
            }`}
          />
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

      <div className="flex-1" />

      <button className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all duration-200 hover:scale-105 group">
        <Settings className="w-5 h-5 text-slate-600 group-hover:text-slate-700" />
      </button>
    </div>
  );

  // ChatSelector component
  const ChatSelector = () => (
    <div
      className={`w-80 bg-slate-50 border-r border-slate-200 flex flex-col ${
        activeTab !== "chat" ? "hidden" : ""
      }`}
    >
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
              onClick={() => setActiveChatType("friends")}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                activeChatType === "friends"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-blue-50"
              }`}
            >
              Friends
            </button>
            <button
              onClick={() => setActiveChatType("group")}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                activeChatType === "group"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-blue-50"
              }`}
            >
              Groups
            </button>
          </div>

          <div className="space-y-2">
            {activeChatType === "friends" &&
              friends.map((friend) => (
                <div
                  key={friend._id}
                  onClick={() => selectChat(friend)}
                  className={`p-4 bg-white rounded-xl border border-slate-200 hover:shadow-md transition-all duration-200 cursor-pointer ${
                    activeChat?._id === friend._id
                      ? "ring-2 ring-blue-500 bg-blue-50"
                      : ""
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <img
                        src={
                          friend.profilePic ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            friend.username
                          )}`
                        }
                        alt={friend.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900 text-sm truncate">
                          {friend.username}
                        </h3>
                        <span className="text-xs text-slate-500">Online</span>
                      </div>
                      <p className="text-sm text-slate-600 truncate">
                        Click to start chatting
                      </p>
                    </div>
                  </div>
                </div>
              ))}

            {activeChatType === "group" && (
              <div className="p-4 bg-white rounded-xl border border-slate-200 hover:shadow-md transition-all duration-200 cursor-pointer">
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
                      Group feature coming soon...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeChatType === "friends" && friends.length === 0 && (
              <div className="text-center py-8">
                <p className="text-slate-500">No friends yet</p>
                <p className="text-sm text-slate-400 mt-1">
                  Add friends to start chatting
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // ChatHeader component
  const ChatHeader = () => (
    <div
      className={`bg-white border-b border-slate-200 px-6 py-4 ${
        activeTab !== "chat" ? "hidden" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {activeChat ? (
            <>
              <div className="relative">
                <img
                  src={
                    activeChat.profilePic ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      activeChat.username
                    )}`
                  }
                  alt={activeChat.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">
                  {activeChat.username}
                </h3>
                <p className="text-sm text-green-600">Online</p>
              </div>
            </>
          ) : (
            <div>
              <h3 className="font-semibold text-slate-900">
                Select a conversation
              </h3>
              <p className="text-sm text-slate-500">
                Choose a friend to start chatting
              </p>
            </div>
          )}
        </div>

        {activeChat && (
          <div className="flex items-center space-x-2">
            <button className="w-10 h-10 rounded-full bg-slate-100 hover:bg-indigo-50 flex items-center justify-center transition-all hover:scale-105 group">
              <Users className="w-5 h-5 text-slate-600 group-hover:text-blue-600" />
            </button>
            <button className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all hover:scale-105 group">
              <MoreVertical className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // MessageBubble component
  const MessageBubble = ({ msg }) => (
    <div
      className={`flex ${
        msg.isOwn ? "justify-end" : "justify-start"
      } mb-4 animate-fadeInUp`}
    >
      {!msg.isOwn && (
        <img
          src={
            msg.sender?.profilePic ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              msg.sender?.username || "User"
            )}`
          }
          alt={msg.sender?.username || "User"}
          className="w-8 h-8 rounded-full mr-3 mt-1 object-cover"
        />
      )}
      <div className={`max-w-xs lg:max-w-md ${msg.isOwn ? "mr-2" : ""}`}>
        {!msg.isOwn && (
          <p className="text-xs text-slate-500 mb-1 ml-2">
            {msg.sender?.username || "User"}
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
          {msg.time ||
            new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
          {msg.isOwn && <span className="text-blue-600">• Sent</span>}
        </p>
      </div>
    </div>
  );

  // ChatWindow component
  const ChatWindow = () => (
    <div
      className={`flex-1 flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 ${
        activeTab !== "chat" ? "hidden" : ""
      }`}
    >
      <ChatHeader />

      {activeChat ? (
        <>
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <MessageCircle className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Start a conversation
                </h3>
                <p className="text-slate-500 max-w-sm">
                  Send a message or voice note to {activeChat.username} to get
                  started
                </p>
              </div>
            ) : (
              chatMessages.map((msg) => (
                <MessageBubble key={msg.id || msg._id} msg={msg} />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {showVoiceRecorder && (
            <div className="px-6 pb-4">
              <VoiceRecorder
                onSendVoice={handleSendVoice}
                onCancel={() => setShowVoiceRecorder(false)}
                isGroup={false}
                recipientId={activeChat._id}
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
                <Mic
                  className={`w-5 h-5 ${
                    showVoiceRecorder
                      ? "text-red-600"
                      : "text-slate-600 group-hover:text-blue-600"
                  }`}
                />
              </button>
              <div className="flex-1">
                <input
                  ref={messageInputRef}
                  type="text"
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={showVoiceRecorder}
                  className="w-full px-4 py-2.5 bg-slate-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm disabled:opacity-50"
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!message.trim() || sendingMessage}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 ${
                  message.trim() && !sendingMessage
                    ? "bg-blue-600 hover:bg-blue-700 shadow-md"
                    : "bg-slate-200 cursor-not-allowed"
                }`}
              >
                {sendingMessage ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send
                    className={`w-5 h-5 ${
                      message.trim() ? "text-white" : "text-slate-400"
                    }`}
                  />
                )}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Select a conversation
            </h3>
            <p className="text-slate-500 max-w-sm">
              Choose a friend from the sidebar to start messaging
            </p>
          </div>
        </div>
      )}
    </div>
  );

  // MainContent component for Friends and Feed tabs
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
