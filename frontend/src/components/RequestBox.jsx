import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useState, useEffect } from "react";
import { X } from "lucide-react";

const RequestBox = ({ isOpen, onClose }) => {
  const { pendingRequests, getPendingRequests, acceptFriendRequest, rejectFriendRequest } =
    useChatStore();
  const { socket } = useAuthStore();

  useEffect(() => {
    if (isOpen) {
      getPendingRequests();
    }
  }, [isOpen, getPendingRequests]);

  useEffect(() => {
    if (!socket) return;

    const handleNewRequest = (request) => {
      useChatStore.setState({
        pendingRequests: [request, ...useChatStore.getState().pendingRequests],
      });
    };

    socket.on("friendRequestReceived", handleNewRequest);

    return () => {
      socket.off("friendRequestReceived", handleNewRequest);
    };
  }, [socket]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-96 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Friend Requests</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <X size={20} />
          </button>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No friend requests</p>
          </div>
        ) : (
          <div className="divide-y">
            {pendingRequests.map((request) => (
              <div key={request._id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <img
                    src={request.from.profilePic || "/avatar.png"}
                    alt={request.from.fullName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold">{request.from.fullName}</p>
                    <p className="text-sm text-gray-500">@{request.from.username}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => acceptFriendRequest(request._id)}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-medium"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => rejectFriendRequest(request._id)}
                    className="px-3 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 text-sm font-medium"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestBox;
