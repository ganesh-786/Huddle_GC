import React, { useState, useEffect } from "react";
import { UserPlus, Check, X, Search } from "lucide-react";
import { toast } from "react-toastify";

const FriendRequests = ({ token }) => {
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [activeTab, setActiveTab] = useState("requests");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFriendRequests();
    fetchFriends();
  }, []);

  const fetchFriendRequests = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/friends/requests", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setFriendRequests(data.data);
      }
    } catch (error) {
      console.error("Error fetching friend requests:", error);
    }
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

  const searchUsers = async (query) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8080/api/friends/search?query=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setSearchResults(data.data);
      }
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (recipientId) => {
    try {
      const response = await fetch("http://localhost:8080/api/friends/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ recipientId }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Friend request sent!");
        // Remove user from search results
        setSearchResults(prev => prev.filter(user => user._id !== recipientId));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast.error("Failed to send friend request");
    }
  };

  const acceptFriendRequest = async (requestId) => {
    try {
      const response = await fetch("http://localhost:8080/api/friends/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Friend request accepted!");
        fetchFriendRequests();
        fetchFriends();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast.error("Failed to accept friend request");
    }
  };

  const rejectFriendRequest = async (requestId) => {
    try {
      const response = await fetch("http://localhost:8080/api/friends/reject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Friend request rejected");
        fetchFriendRequests();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      toast.error("Failed to reject friend request");
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchUsers(query);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Friends</h2>
        
        <div className="flex space-x-1 mb-4">
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "requests"
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Requests ({friendRequests.length})
          </button>
          <button
            onClick={() => setActiveTab("friends")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "friends"
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab("search")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "search"
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Find Friends
          </button>
        </div>

        {activeTab === "search" && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search users by username or email..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      <div className="p-6">
        {activeTab === "requests" && (
          <div className="space-y-4">
            {friendRequests.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No friend requests</p>
            ) : (
              friendRequests.map((request) => (
                <div
                  key={request._id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={
                        request.from.profilePic ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          request.from.username
                        )}`
                      }
                      alt={request.from.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-medium text-slate-900">
                        {request.from.username}
                      </h3>
                      <p className="text-sm text-slate-500">{request.from.email}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => acceptFriendRequest(request._id)}
                      className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => rejectFriendRequest(request._id)}
                      className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "friends" && (
          <div className="space-y-4">
            {friends.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No friends yet</p>
            ) : (
              friends.map((friend) => (
                <div
                  key={friend._id}
                  className="flex items-center space-x-3 p-4 bg-slate-50 rounded-lg"
                >
                  <img
                    src={
                      friend.profilePic ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        friend.username
                      )}`
                    }
                    alt={friend.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900">{friend.username}</h3>
                    <p className="text-sm text-slate-500">{friend.email}</p>
                    {friend.bio && (
                      <p className="text-sm text-slate-600 mt-1">{friend.bio}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "search" && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-slate-500 mt-2">Searching...</p>
              </div>
            ) : searchResults.length === 0 && searchQuery.length >= 2 ? (
              <p className="text-slate-500 text-center py-8">No users found</p>
            ) : (
              searchResults.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={
                        user.profilePic ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          user.username
                        )}`
                      }
                      alt={user.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-medium text-slate-900">{user.username}</h3>
                      <p className="text-sm text-slate-500">{user.email}</p>
                      {user.bio && (
                        <p className="text-sm text-slate-600 mt-1">{user.bio}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => sendFriendRequest(user._id)}
                    className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendRequests;