import express from "express";
import {
  checkAuth,
  login,
  logout,
  signup,
  updateProfile,
  getFriends,
  searchUsers,
  addFriend,
  sendFriendRequest,
  getPendingRequests,
  acceptFriendRequest,
  rejectFriendRequest,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

router.put("/update-profile", protectRoute, updateProfile);
router.get("/friends", protectRoute, getFriends);
router.get("/search", protectRoute, searchUsers);
router.post("/add-friend", protectRoute, addFriend);

// Friend request routes
router.post("/send-request", protectRoute, sendFriendRequest);
router.get("/requests", protectRoute, getPendingRequests);
router.put("/accept-request/:requestId", protectRoute, acceptFriendRequest);
router.put("/reject-request/:requestId", protectRoute, rejectFriendRequest);

router.get("/check", protectRoute, checkAuth);

export default router;
