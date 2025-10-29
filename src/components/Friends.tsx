import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Check,
  X,
  Search,
  UserCheck,
  Clock,
  Mail,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Friend, FriendRequest, UserProfile } from "../types";

interface FriendsProps {
  isVisible: boolean;
  onClose: () => void;
  currentUserId: string;
}

const Friends: React.FC<FriendsProps> = ({
  isVisible,
  onClose,
  currentUserId,
}) => {
  const [activeTab, setActiveTab] = useState<
    "friends" | "requests" | "discover"
  >("friends");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isVisible) {
      loadFriendsData();
    }
  }, [isVisible, currentUserId]);

  const loadFriendsData = async () => {
    try {
      await Promise.all([
        loadFriends(),
        loadPendingRequests(),
        loadSentRequests(),
        loadAllUsers(),
      ]);
    } catch (error) {
      console.error("Error loading friends data:", error);
    }
  };

  const loadFriends = async () => {
    const { data, error } = await supabase.rpc("get_user_friends", {
      user_uuid: currentUserId,
    });

    if (error) {
      console.error("Error loading friends:", error);
      return;
    }

    setFriends(data || []);
  };

  const loadPendingRequests = async () => {
    const { data, error } = await supabase.rpc("get_pending_friend_requests", {
      user_uuid: currentUserId,
    });

    if (error) {
      console.error("Error loading pending requests:", error);
      return;
    }

    setPendingRequests(data || []);
  };

  const loadSentRequests = async () => {
    const { data, error } = await supabase.rpc("get_sent_friend_requests", {
      user_uuid: currentUserId,
    });

    if (error) {
      console.error("Error loading sent requests:", error);
      return;
    }

    setSentRequests(data || []);
  };

  const loadAllUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, name, avatar_url, created_at")
      .neq("id", currentUserId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading users:", error);
      return;
    }

    setAllUsers(data || []);
  };

  const sendFriendRequest = async (receiverId: string) => {
    try {
      const { error } = await supabase.from("friend_requests").insert({
        sender_id: currentUserId,
        receiver_id: receiverId,
      });

      if (error) {
        console.error("Error sending friend request:", error);
        alert("Failed to send friend request");
        return;
      }

      // Reload data
      await loadSentRequests();
      await loadAllUsers();
    } catch (error) {
      console.error("Error sending friend request:", error);
      alert("Failed to send friend request");
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    try {
      const { data, error } = await supabase.rpc("accept_friend_request", {
        request_id: requestId,
      });

      if (error || !data) {
        console.error("Error accepting friend request:", error);
        alert("Failed to accept friend request");
        return;
      }

      // Reload data
      await loadFriends();
      await loadPendingRequests();
    } catch (error) {
      console.error("Error accepting friend request:", error);
      alert("Failed to accept friend request");
    }
  };

  const declineFriendRequest = async (requestId: string) => {
    try {
      const { data, error } = await supabase.rpc("decline_friend_request", {
        request_id: requestId,
      });

      if (error || !data) {
        console.error("Error declining friend request:", error);
        alert("Failed to decline friend request");
        return;
      }

      // Reload data
      await loadPendingRequests();
    } catch (error) {
      console.error("Error declining friend request:", error);
      alert("Failed to decline friend request");
    }
  };

  const removeFriend = async (friendId: string) => {
    if (!confirm("Are you sure you want to remove this friend?")) return;

    try {
      // Remove friendship from both directions
      const { error: error1 } = await supabase
        .from("friends")
        .delete()
        .eq("user_id", currentUserId)
        .eq("friend_id", friendId);

      const { error: error2 } = await supabase
        .from("friends")
        .delete()
        .eq("user_id", friendId)
        .eq("friend_id", currentUserId);

      if (error1 || error2) {
        console.error("Error removing friend:", error1 || error2);
        alert("Failed to remove friend");
        return;
      }

      // Reload data
      await loadFriends();
    } catch (error) {
      console.error("Error removing friend:", error);
      alert("Failed to remove friend");
    }
  };

  const filteredUsers = allUsers.filter((user) => {
    const isAlreadyFriend = friends.some(
      (friend) => friend.friend_id === user.id
    );
    const hasPendingRequest = pendingRequests.some(
      (req) => req.sender_id === user.id
    );
    const hasSentRequest = sentRequests.some(
      (req) => req.receiver_id === user.id
    );

    const matchesSearch =
      searchQuery === "" ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    return (
      !isAlreadyFriend && !hasPendingRequest && !hasSentRequest && matchesSearch
    );
  });

  if (!isVisible) return null;

  return (
    <div className="friends-overlay">
      <div className="friends-modal">
        <div className="friends-header">
          <h2>
            <Users size={20} />
            Friends
          </h2>
          <button onClick={onClose} className="close-button">
            <X size={20} />
          </button>
        </div>

        <div className="friends-tabs">
          <button
            className={`tab ${activeTab === "friends" ? "active" : ""}`}
            onClick={() => setActiveTab("friends")}
          >
            <UserCheck size={16} />
            Friends ({friends.length})
          </button>
          <button
            className={`tab ${activeTab === "requests" ? "active" : ""}`}
            onClick={() => setActiveTab("requests")}
          >
            <Mail size={16} />
            Requests ({pendingRequests.length})
          </button>
          <button
            className={`tab ${activeTab === "discover" ? "active" : ""}`}
            onClick={() => setActiveTab("discover")}
          >
            <UserPlus size={16} />
            Discover
          </button>
        </div>

        <div className="friends-content">
          {activeTab === "friends" && (
            <div className="friends-list">
              {friends.length === 0 ? (
                <div className="empty-state">
                  <UserCheck size={48} />
                  <p>No friends yet</p>
                  <p>
                    Start by discovering users or accepting friend requests!
                  </p>
                </div>
              ) : (
                friends.map((friend) => (
                  <div key={friend.friend_id} className="friend-item">
                    <div className="friend-avatar">
                      {friend.friend_avatar_url ? (
                        <img
                          src={friend.friend_avatar_url}
                          alt={friend.friend_name}
                        />
                      ) : (
                        <div className="avatar-placeholder">
                          {friend.friend_name?.charAt(0) || "?"}
                        </div>
                      )}
                    </div>
                    <div className="friend-info">
                      <h4>{friend.friend_name || "Unknown User"}</h4>
                      <p>{friend.friend_email}</p>
                      <small>
                        Friends since{" "}
                        {new Date(
                          friend.friendship_created_at
                        ).toLocaleDateString()}
                      </small>
                    </div>
                    <button
                      onClick={() => removeFriend(friend.friend_id)}
                      className="remove-friend-btn"
                      title="Remove friend"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "requests" && (
            <div className="requests-list">
              {pendingRequests.length === 0 ? (
                <div className="empty-state">
                  <Clock size={48} />
                  <p>No pending requests</p>
                </div>
              ) : (
                pendingRequests.map((request) => (
                  <div key={request.request_id} className="request-item">
                    <div className="request-avatar">
                      {request.sender_avatar_url ? (
                        <img
                          src={request.sender_avatar_url}
                          alt={request.sender_name}
                        />
                      ) : (
                        <div className="avatar-placeholder">
                          {request.sender_name?.charAt(0) || "?"}
                        </div>
                      )}
                    </div>
                    <div className="request-info">
                      <h4>{request.sender_name || "Unknown User"}</h4>
                      <p>{request.sender_email}</p>
                      <small>
                        Sent {new Date(request.created_at).toLocaleDateString()}
                      </small>
                    </div>
                    <div className="request-actions">
                      <button
                        onClick={() => acceptFriendRequest(request.request_id)}
                        className="accept-btn"
                        title="Accept request"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => declineFriendRequest(request.request_id)}
                        className="decline-btn"
                        title="Decline request"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "discover" && (
            <div className="discover-section">
              <div className="search-bar">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="users-list">
                {filteredUsers.length === 0 ? (
                  <div className="empty-state">
                    <Search size={48} />
                    <p>No users found</p>
                    <p>Try adjusting your search or check back later!</p>
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <div key={user.id} className="user-item">
                      <div className="user-avatar">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.name} />
                        ) : (
                          <div className="avatar-placeholder">
                            {user.name?.charAt(0) || "?"}
                          </div>
                        )}
                      </div>
                      <div className="user-info">
                        <h4>{user.name || "Unknown User"}</h4>
                        <p>{user.email}</p>
                        <small>
                          Joined{" "}
                          {new Date(user.created_at).toLocaleDateString()}
                        </small>
                      </div>
                      <button
                        onClick={() => sendFriendRequest(user.id)}
                        className="add-friend-btn"
                      >
                        <UserPlus size={16} />
                        Add Friend
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Friends;
