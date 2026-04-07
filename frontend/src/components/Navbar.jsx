import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { LogOut, MessageSquare, Settings, User, Bell } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useState } from "react";
import RequestBox from "./RequestBox";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();
  const { pendingRequests } = useChatStore();
  const [isRequestBoxOpen, setIsRequestBoxOpen] = useState(false);

  return (
    <>
      <header
        className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40 
      backdrop-blur-lg bg-base-100/80"
      >
        <div className="container mx-auto px-4 h-16">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-all">
                <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <h1 className="text-lg font-bold">Chatty</h1>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              {authUser && (
                <button
                  onClick={() => setIsRequestBoxOpen(true)}
                  className="relative btn btn-sm gap-2 transition-colors hover:bg-base-200"
                  title="Friend Requests"
                >
                  <Bell className="w-4 h-4" />
                  {pendingRequests && pendingRequests.length > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                      {pendingRequests.length}
                    </span>
                  )}
                </button>
              )}

              <Link
                to={"/settings"}
                className={`
                btn btn-sm gap-2 transition-colors
                
                `}
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </Link>

              {authUser && (
                <>
                  <Link to={"/profile"} className={`btn btn-sm gap-2`}>
                    <User className="size-5" />
                    <span className="hidden sm:inline">Profile</span>
                  </Link>

                  <button className="flex gap-2 items-center" onClick={logout}>
                    <LogOut className="size-5" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <RequestBox isOpen={isRequestBoxOpen} onClose={() => setIsRequestBoxOpen(false)} />
    </>
  );
};
export default Navbar;
