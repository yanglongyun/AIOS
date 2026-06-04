import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef } from "react";

type SocketPayload = {
  type: string;
  [key: string]: unknown;
};

type SocketHandler = (payload: SocketPayload) => void;

type SocketState = {
  send: (payload: SocketPayload) => void;
  subscribe: (type: string, handler: SocketHandler) => () => void;
};

const SocketContext = createContext<SocketState | null>(null);

const socketUrl = () => {
  const url = new URL("/api/ws", window.location.href);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
};

export function SocketProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<WebSocket | null>(null);
  const queueRef = useRef<SocketPayload[]>([]);
  const handlersRef = useRef(new Map<string, Set<SocketHandler>>());
  const reconnectTimerRef = useRef<number | null>(null);
  const closedRef = useRef(false);

  const dispatch = useCallback((payload: SocketPayload) => {
    const handlers = handlersRef.current.get(String(payload.type || ""));
    if (!handlers) return;
    handlers.forEach((handler) => handler(payload));
  }, []);

  const flushQueue = useCallback((socket: WebSocket) => {
    const queue = queueRef.current.splice(0);
    queue.forEach((payload) => socket.send(JSON.stringify(payload)));
  }, []);

  const connect = useCallback(() => {
    if (closedRef.current) return;
    const existing = socketRef.current;
    if (existing?.readyState === WebSocket.OPEN || existing?.readyState === WebSocket.CONNECTING) {
      return;
    }

    const socket = new WebSocket(socketUrl());
    socketRef.current = socket;

    socket.addEventListener("open", () => flushQueue(socket));
    socket.addEventListener("message", (event) => {
      const payload = JSON.parse(String(event.data || "{}")) as SocketPayload;
      dispatch(payload);
    });
    socket.addEventListener("close", () => {
      if (socketRef.current === socket) socketRef.current = null;
      if (!closedRef.current) {
        reconnectTimerRef.current = window.setTimeout(connect, 1000);
      }
    });
    socket.addEventListener("error", () => {
      socket.close();
    });
  }, [dispatch, flushQueue]);

  useEffect(() => {
    closedRef.current = false;
    connect();
    return () => {
      closedRef.current = true;
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      socketRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((payload: SocketPayload) => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
      return;
    }
    queueRef.current.push(payload);
    connect();
  }, [connect]);

  const subscribe = useCallback((type: string, handler: SocketHandler) => {
    const handlers = handlersRef.current.get(type) || new Set<SocketHandler>();
    handlers.add(handler);
    handlersRef.current.set(type, handlers);
    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) handlersRef.current.delete(type);
    };
  }, []);

  const value = useMemo<SocketState>(() => ({ send, subscribe }), [send, subscribe]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export const useSocket = () => {
  const value = useContext(SocketContext);
  if (!value) throw new Error("useSocket must be used inside SocketProvider");
  return value;
};
