/**
 * controllers/chatController.js
 * --------------------------------------------------
 * Chat API: create 1-on-1, create group, fetch chats, fetch messages.
 */

import asyncHandler from "express-async-handler";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

/**
 * @desc    Create or fetch 1-on-1 chat between current user and userId
 * @body    { userId: string }
 */
export const createOrGetOneOnOneChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    res.status(400);
    throw new Error("userId is required");
  }
  const currentUserId = req.user._id;
  if (userId === currentUserId.toString()) {
    res.status(400);
    throw new Error("Cannot chat with yourself");
  }

  const other = await User.findById(userId).select("name email profileImage role");
  if (!other) {
    res.status(404);
    throw new Error("User not found");
  }

  let chat = await Chat.findOne({
    isGroupChat: false,
    users: { $all: [currentUserId, userId], $size: 2 },
  })
    .populate("users", "name email profileImage role")
    .populate("latestMessage")
    .lean();

  if (chat) {
    return res.json(chat);
  }

  chat = await Chat.create({
    chatName: "",
    isGroupChat: false,
    users: [currentUserId, userId],
  });

  chat = await Chat.findById(chat._id)
    .populate("users", "name email profileImage role")
    .lean();

  res.status(201).json(chat);
});

/**
 * @desc    Create group chat
 * @body    { chatName: string, userIds: string[] }
 */
export const createGroupChat = asyncHandler(async (req, res) => {
  const { chatName, userIds } = req.body;
  if (!chatName || !chatName.trim()) {
    res.status(400);
    throw new Error("Group name is required");
  }
  const ids = Array.isArray(userIds) ? userIds : [];
  const currentUserId = req.user._id;
  const allIds = [currentUserId.toString(), ...ids.map((id) => id.toString())];
  const uniqueIds = [...new Set(allIds)];

  if (uniqueIds.length < 2) {
    res.status(400);
    throw new Error("Add at least one other member");
  }

  const chat = await Chat.create({
    chatName: chatName.trim(),
    isGroupChat: true,
    users: uniqueIds,
    groupAdmin: currentUserId,
  });

  const populated = await Chat.findById(chat._id)
    .populate("users", "name email profileImage role")
    .populate("groupAdmin", "name email profileImage role")
    .lean();

  res.status(201).json(populated);
});

/**
 * @desc    Get all chats for the current user (with latestMessage, unreadCount). Returns { chats, totalUnread }.
 */
export const getMyChats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const uid = userId.toString();

  const chats = await Chat.find({ users: userId })
    .populate("users", "name email profileImage role")
    .populate({ path: "latestMessage", populate: { path: "sender", select: "name _id" } })
    .populate("groupAdmin", "name email profileImage role")
    .sort({ updatedAt: -1 })
    .lean();

  let totalUnread = 0;
  const chatsWithUnread = chats.map((c) => {
    const raw = c.unreadCount;
    const unread = Math.max(0, parseInt(raw?.[uid] ?? raw?.get?.(uid), 10) || 0);
    totalUnread += unread;
    return { ...c, unreadCount: unread };
  });

  res.json({ chats: chatsWithUnread, totalUnread });
});

/**
 * @desc    Get messages for a chat (paginated). Excludes messages in hiddenFor. Marks chat as read for current user.
 */
export const getMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
  const before = req.query.before;
  const userId = req.user._id;

  const chat = await Chat.findOne({ _id: chatId, users: userId });
  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  const uid = userId.toString();
  if (!chat.unreadCount) chat.unreadCount = new Map();
  chat.unreadCount.set(uid, 0);
  chat.markModified("unreadCount");
  await chat.save();

  let query = { chat: chatId, hiddenFor: { $ne: userId } };
  if (before) {
    const beforeMsg = await Message.findById(before);
    if (beforeMsg) query.createdAt = { $lt: beforeMsg.createdAt };
  }

  const messages = await Message.find(query)
    .populate("sender", "name email profileImage role")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  res.json(messages.reverse());
});

/**
 * @desc    Edit own message. Emits message-edited via Socket.io.
 */
export const editMessage = asyncHandler(async (req, res) => {
  const { chatId, messageId } = req.params;
  const { content } = req.body;
  const userId = req.user._id;

  if (!content || typeof content !== "string" || !content.trim()) {
    res.status(400);
    throw new Error("Content is required");
  }

  const chat = await Chat.findOne({ _id: chatId, users: userId });
  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  const msg = await Message.findOne({ _id: messageId, chat: chatId, sender: userId });
  if (!msg) {
    res.status(404);
    throw new Error("Message not found");
  }
  if (msg.deleted) {
    res.status(400);
    throw new Error("Cannot edit deleted message");
  }

  msg.content = content.trim();
  msg.editedAt = new Date();
  await msg.save();

  const populated = await Message.findById(msg._id)
    .populate("sender", "name email profileImage role")
    .lean();

  const io = req.app.get("io");
  if (io) io.to(`chat:${chatId}`).emit("message-edited", populated);

  res.json(populated);
});

/**
 * @desc    Delete message: scope=everyone (soft-delete for all) or scope=me (hide for current user only).
 */
export const deleteMessage = asyncHandler(async (req, res) => {
  const { chatId, messageId } = req.params;
  const scope = (req.query.scope || "everyone").toLowerCase();
  const userId = req.user._id;

  const chat = await Chat.findOne({ _id: chatId, users: userId });
  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  const msg = await Message.findOne({ _id: messageId, chat: chatId });
  if (!msg) {
    res.status(404);
    throw new Error("Message not found");
  }

  const io = req.app.get("io");

  if (scope === "me") {
    if (!msg.hiddenFor) msg.hiddenFor = [];
    if (!msg.hiddenFor.some((id) => id.toString() === userId.toString())) {
      msg.hiddenFor.push(userId);
      await msg.save();
    }
    if (io) io.to(`chat:${chatId}`).emit("message-deleted", { messageId, chatId, scope: "me", userId: userId.toString() });
    return res.json({ messageId, scope: "me" });
  }

  if (msg.sender.toString() !== userId.toString()) {
    res.status(403);
    throw new Error("Only the sender can delete for everyone");
  }
  msg.deleted = true;
  msg.content = "";
  msg.editedAt = null;
  await msg.save();

  if (io) io.to(`chat:${chatId}`).emit("message-deleted", { messageId, chatId, scope: "everyone", message: await Message.findById(messageId).populate("sender", "name email profileImage role").lean() });
  res.json({ messageId, scope: "everyone" });
});

/**
 * @desc    Search users (for starting chat / adding to group). Excludes current user.
 * @query   q (search string), limit?
 */
export const searchUsers = asyncHandler(async (req, res) => {
  const q = (req.query.q || "").trim();
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
  const currentId = req.user._id;

  if (!q) {
    return res.json([]);
  }

  const users = await User.find({
    _id: { $ne: currentId },
    isBlocked: { $ne: true },
    $or: [
      { name: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
    ],
  })
    .select("name email profileImage role")
    .limit(limit)
    .lean();

  res.json(users);
});
