import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? "http://127.0.0.1:8001";

export function useCommunitySocket({ room = "global", onPosted, onUpdated } = {}) {
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ["websocket"], reconnectionAttempts: 5 });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join", { room });
    });

    socket.on("community.posted", (post) => {
      if (onPosted) onPosted(post);
    });

    socket.on("community.updated", (post) => {
      if (onUpdated) onUpdated(post);
    });

    return () => {
      if (socket.connected) {
        socket.emit("leave", { room });
        socket.disconnect();
      }
    };
  }, [room, onPosted, onUpdated]);

  const post = async ({ content, topic = "General", mood = "neutral" }) => {
    if (!socketRef.current) return null;
    return new Promise((resolve) => {
      socketRef.current.timeout(5000).emit("community_post", { content, topic, mood, room }, (err, resp) => {
        if (err) {
          resolve({ ok: false, error: err });
        } else {
          resolve({ ok: true, post: resp?.post || null });
        }
      });
    });
  };

  const react = async ({ postId, reaction }) => {
    if (!socketRef.current) return null;
    return new Promise((resolve) => {
      socketRef.current.timeout(3000).emit("community_react", { postId, reaction }, (err, resp) => {
        if (err) resolve({ ok: false, error: err });
        else resolve(resp);
      });
    });
  };

  return { post, react };
}
