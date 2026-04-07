import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  friends: [],
  searchResults: [],
  selectedUser: null,
  isFriendsLoading: false,
  isMessagesLoading: false,
  isSearchLoading: false,
  pendingRequests: [],
  isPendingRequestsLoading: false,

  getFriends: async () => {
    set({ isFriendsLoading: true });
    try {
      const res = await axiosInstance.get("/auth/friends");
      set({ friends: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load friends");
    } finally {
      set({ isFriendsLoading: false });
    }
  },

  searchUsers: async (query) => {
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }
    set({ isSearchLoading: true });
    try {
      const res = await axiosInstance.get(`/auth/search?query=${encodeURIComponent(query)}`);
      set({ searchResults: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Search failed");
    } finally {
      set({ isSearchLoading: false });
    }
  },

  addFriend: async (userId) => {
    try {
      const res = await axiosInstance.post("/auth/add-friend", { userId });
      set({ friends: [...get().friends, res.data], searchResults: get().searchResults.filter((user) => user._id !== userId) });
      toast.success("Friend added successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not add friend");
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    const { authUser } = useAuthStore.getState();

    if (!authUser) {
      toast.error("You must be logged in to send messages");
      return;
    }

    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      console.error("Send message error:", error);
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  subscribeToFriendEvents: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("friendRequestAccepted", (data) => {
      set({ friends: [...get().friends, data.user] });
    });
  },

  unsubscribeFromFriendEvents: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("friendRequestAccepted");
  },

  getPendingRequests: async () => {
    set({ isPendingRequestsLoading: true });
    try {
      const res = await axiosInstance.get("/auth/requests");
      set({ pendingRequests: res.data });
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      toast.error(error.response?.data?.message || "Failed to load requests");
    } finally {
      set({ isPendingRequestsLoading: false });
    }
  },

  sendFriendRequest: async (userId) => {
    try {
      await axiosInstance.post("/auth/send-request", { userId });
      toast.success("Friend request sent");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send friend request");
    }
  },

  acceptFriendRequest: async (requestId) => {
    try {
      await axiosInstance.put(`/auth/accept-request/${requestId}`);
      set({
        pendingRequests: get().pendingRequests.filter((req) => req._id !== requestId),
      });
      await get().getFriends();
      toast.success("Friend request accepted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to accept request");
    }
  },

  rejectFriendRequest: async (requestId) => {
    try {
      await axiosInstance.put(`/auth/reject-request/${requestId}`);
      set({
        pendingRequests: get().pendingRequests.filter((req) => req._id !== requestId),
      });
      toast.success("Friend request rejected");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reject request");
    }
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
