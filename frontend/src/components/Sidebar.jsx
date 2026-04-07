import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Users, Search, UserPlus } from "lucide-react";

const Sidebar = () => {
  const {
    getFriends,
    friends,
    selectedUser,
    setSelectedUser,
    isFriendsLoading,
    searchUsers,
    searchResults,
    isSearchLoading,
    addFriend,
    sendFriendRequest,
  } = useChatStore();

  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    getFriends();
  }, [getFriends]);

  useEffect(() => {
    const delay = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(delay);
  }, [searchQuery, searchUsers]);

  const filteredFriends = showOnlineOnly
    ? friends.filter((user) => onlineUsers.includes(user._id))
    : friends;

  const activeList = searchQuery.trim() ? searchResults : filteredFriends;
  const isSearchMode = searchQuery.trim().length > 0;

  if (isFriendsLoading) return (
    <aside className="h-full w-full lg:w-80 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Friends</span>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-base-content/70">Loading friends...</div>
      </div>
    </aside>
  );

  return (
    <aside className="h-full w-full lg:w-80 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Friends</span>
        </div>

        <div className="mt-4">
          <label className="block text-sm text-zinc-500 mb-2">Search by username or name</label>
          <div className="flex items-center gap-2">
            <Search className="size-4 text-zinc-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find a friend..."
              className="input input-sm input-bordered w-full"
            />
          </div>
        </div>

        {!isSearchMode && (
          <div className="mt-4 hidden lg:flex items-center justify-between gap-2">
            <label className="cursor-pointer flex items-center gap-2">
              <input
                type="checkbox"
                checked={showOnlineOnly}
                onChange={(e) => setShowOnlineOnly(e.target.checked)}
                className="checkbox checkbox-sm"
              />
              <span className="text-sm">Online only</span>
            </label>
            <span className="text-xs text-zinc-500">{filteredFriends.length} visible</span>
          </div>
        )}
      </div>

      <div className="overflow-y-auto w-full py-3 px-2 space-y-2">
        {isSearchMode && isSearchLoading && (
          <div className="text-center text-zinc-500 py-4">Searching...</div>
        )}

        {activeList.map((user) => (
          <div
            key={user._id}
            className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors ${
              selectedUser?._id === user._id ? "bg-base-300" : "hover:bg-base-200"
            }`}
          >
            <button
              type="button"
              onClick={() => setSelectedUser(user)}
              className="flex-1 flex items-center gap-3 text-left"
            >
              <div className="relative">
                <img
                  src={user.profilePic || "/avatar.png"}
                  alt={user.fullName}
                  className="size-12 object-cover rounded-full"
                />
                {onlineUsers.includes(user._id) && (
                  <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-base-100" />
                )}
              </div>
              <div className="min-w-0">
                <div className="font-medium truncate">{user.fullName}</div>
                <div className="text-xs text-zinc-500 truncate">
                  {user.username ? `@${user.username}` : user.email}
                </div>
                <div className="text-xs text-zinc-400">
                  {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                </div>
              </div>
            </button>
            {isSearchMode && (
              <button
                type="button"
                onClick={() => sendFriendRequest(user._id)}
                className="btn btn-xs gap-2"
              >
                <UserPlus className="size-4" />
                Request
              </button>
            )}
          </div>
        ))}

        {activeList.length === 0 && (
          <div className="text-center text-zinc-500 py-6">
            {isSearchMode ? "No users found" : "No friends available"}
          </div>
        )}
      </div>
    </aside>
  );
};
export default Sidebar;
