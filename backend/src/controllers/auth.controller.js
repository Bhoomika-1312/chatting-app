import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import FriendRequest from "../models/friendRequest.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../lib/socket.js";

export const signup = async (req, res) => {
  const { fullName, email, password, username: rawUsername } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email });

    if (user) return res.status(400).json({ message: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const username = rawUsername?.trim() || email.split("@")[0].toLowerCase();

    const newUser = new User({
      fullName,
      email,
      username,
      password: hashedPassword,
    });

    if (newUser) {
      // generate jwt token here
      await newUser.save();
      generateToken(newUser._id, res);

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        username: newUser.username,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile pic is required" });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic, {
      folder: "profiles",
      width: 200,
      height: 200,
      crop: "fill",
      gravity: "face",
      quality: "auto",
      fetch_format: "auto",
    });
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    );

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "friends",
      "fullName profilePic username"
    );
    res.status(200).json(user.friends || []);
  } catch (error) {
    console.log("Error in getFriends controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: "Search query is required" });

    const authUser = await User.findById(req.user._id);
    const friendIds = authUser.friends.map((id) => id.toString());

    const users = await User.find({
      _id: { $ne: authUser._id, $nin: friendIds },
      $or: [
        { username: { $regex: query, $options: "i" } },
        { fullName: { $regex: query, $options: "i" } },
      ],
    }).select("fullName profilePic username");

    res.status(200).json(users);
  } catch (error) {
    console.log("Error in searchUsers controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const addFriend = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "User ID is required" });

    const authUser = await User.findById(req.user._id);
    if (authUser.friends.includes(userId)) {
      return res.status(400).json({ message: "User already a friend" });
    }

    authUser.friends.push(userId);
    await authUser.save();

    const newFriend = await User.findById(userId).select("fullName profilePic username");
    res.status(200).json(newFriend);
  } catch (error) {
    console.log("Error in addFriend controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const sendFriendRequest = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "User ID is required" });

    const fromUser = req.user._id;
    if (fromUser.toString() === userId) {
      return res.status(400).json({ message: "Cannot send request to yourself" });
    }

    const toUser = await User.findById(userId).select("fullName profilePic username");
    if (!toUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already friends
    const fromUserDoc = await User.findById(fromUser);
    if (fromUserDoc.friends.includes(userId)) {
      return res.status(400).json({ message: "Already friends" });
    }

    // Check if request already exists
    const existingRequest = await FriendRequest.findOne({
      from: fromUser,
      to: userId,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(400).json({ message: "Friend request already sent" });
    }

    // Create friend request
    const friendRequest = new FriendRequest({
      from: fromUser,
      to: userId,
    });

    await friendRequest.save();

    // Emit real-time notification to the user receiving the request
    const receiverSocketId = userSocketMap[userId.toString()];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("friendRequestReceived", {
        _id: friendRequest._id,
        from: {
          _id: fromUser,
          fullName: req.user.fullName,
          profilePic: req.user.profilePic,
          username: req.user.username,
        },
        createdAt: friendRequest.createdAt,
      });
    }

    res.status(201).json({ message: "Friend request sent successfully" });
  } catch (error) {
    console.log("Error in sendFriendRequest controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getPendingRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const requests = await FriendRequest.find({
      to: userId,
      status: "pending",
    })
      .populate("from", "fullName profilePic username email")
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    console.log("Error in getPendingRequests controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    if (friendRequest.to.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (friendRequest.status !== "pending") {
      return res.status(400).json({ message: "Request already processed" });
    }

    // Add friends to both users
    const [toUser, fromUser] = await Promise.all([
      User.findById(friendRequest.to),
      User.findById(friendRequest.from),
    ]);

    if (!toUser.friends.includes(friendRequest.from)) {
      toUser.friends.push(friendRequest.from);
    }
    if (!fromUser.friends.includes(friendRequest.to)) {
      fromUser.friends.push(friendRequest.to);
    }

    await Promise.all([toUser.save(), fromUser.save()]);

    // Update request status
    friendRequest.status = "accepted";
    await friendRequest.save();

    // Emit notification to the requester
    const requesterSocketId = userSocketMap[friendRequest.from.toString()];
    if (requesterSocketId) {
      io.to(requesterSocketId).emit("friendRequestAccepted", {
        user: {
          _id: toUser._id,
          fullName: toUser.fullName,
          profilePic: toUser.profilePic,
          username: toUser.username,
        },
      });
    }

    res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    console.log("Error in acceptFriendRequest controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const rejectFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    if (friendRequest.to.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (friendRequest.status !== "pending") {
      return res.status(400).json({ message: "Request already processed" });
    }

    friendRequest.status = "rejected";
    await friendRequest.save();

    res.status(200).json({ message: "Friend request rejected" });
  } catch (error) {
    console.log("Error in rejectFriendRequest controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
