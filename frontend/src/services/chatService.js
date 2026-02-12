/**
 * services/chatService.js
 * --------------------------------------------------
 * Chat API and Socket.io client for real-time messaging.
 */

import { io } from "socket.io-client";

const CHAT_API = "/api/chat";

async function chatFetch(path, token, options = {}) {
  const res = await fetch(`${CHAT_API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export async function getMyChats(token) {
  const data = await chatFetch("", token, { method: "GET" });
  return { chats: data.chats || [], totalUnread: data.totalUnread ?? 0 };
}

export async function searchUsers(token, q, limit = 20) {
  const params = new URLSearchParams({ q: String(q).trim(), limit });
  return chatFetch(`/users?${params}`, token, { method: "GET" });
}

export async function getMessages(token, chatId, limit = 50, before) {
  const params = new URLSearchParams({ limit });
  if (before) params.set("before", before);
  return chatFetch(`/${chatId}/messages?${params}`, token, { method: "GET" });
}

export async function createOneOnOneChat(token, userId) {
  return chatFetch("", token, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

export async function createGroupChat(token, chatName, userIds) {
  return chatFetch("/group", token, {
    method: "POST",
    body: JSON.stringify({ chatName: chatName.trim(), userIds: Array.isArray(userIds) ? userIds : [] }),
  });
}

export async function editMessage(token, chatId, messageId, content) {
  return chatFetch(`/${chatId}/messages/${messageId}`, token, {
    method: "PATCH",
    body: JSON.stringify({ content: content.trim() }),
  });
}

export async function deleteMessage(token, chatId, messageId, scope = "everyone") {
  return chatFetch(`/${chatId}/messages/${messageId}?scope=${scope}`, token, { method: "DELETE" });
}

/**
 * Create and connect socket with JWT. Returns socket instance.
 * Events: new_message, user_typing, user_stop_typing, online_users
 * Emit: join_chat(chatId), leave_chat(chatId), send_message({ chatId, content }), typing({ chatId }), stop_typing({ chatId })
 */
export function createChatSocket(token) {
  if (typeof window === "undefined" || !token) return null;
  return io(window.location.origin, {
    path: "/socket.io",
    auth: { token },
  });
}
