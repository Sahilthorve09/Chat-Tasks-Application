import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useSocket = () => {
  const socketRef = useRef(null);
  const pendingMsgListenersRef = useRef(new Set());
  const pendingDeletedListenersRef = useRef(new Set());
  const attachedRef = useRef({
    socketId: null,
    attached: {
      receive_message: new Set(),
      message_deleted: new Set(),
    }
  });
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && token && !socketRef.current) {
      // Initialize socket connection
      socketRef.current = io(SOCKET_URL, {
        auth: { token }
      });

      socketRef.current.on('connect', () => {
        console.log('Connected to server');
        attachedRef.current = {
          socketId: socketRef.current.id,
          attached: { receive_message: new Set(), message_deleted: new Set() },
        };
        // Join general room by default
        socketRef.current.emit('join_room', 'general');
        // Attach any pending listeners now that we have a socket
        for (const cb of pendingMsgListenersRef.current) {
          if (!attachedRef.current.attached.receive_message.has(cb)) {
            try { socketRef.current.off('receive_message', cb); } catch {}
            socketRef.current.on('receive_message', cb);
            attachedRef.current.attached.receive_message.add(cb);
          }
        }
        for (const cb of pendingDeletedListenersRef.current) {
          if (!attachedRef.current.attached.message_deleted.has(cb)) {
            try { socketRef.current.off('message_deleted', cb); } catch {}
            socketRef.current.on('message_deleted', cb);
            attachedRef.current.attached.message_deleted.add(cb);
          }
        }
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Connection error:', error);
      });

      socketRef.current.on('disconnect', () => {
        console.log('Disconnected from server');
        // Clear attached set on disconnect so we can reattach on reconnect
        attachedRef.current = { socketId: null, attached: { receive_message: new Set(), message_deleted: new Set() } };
      });
    }

    return () => {
      if (socketRef.current) {
        // Detach listeners before disconnecting
        for (const cb of pendingMsgListenersRef.current) {
          try { socketRef.current.off('receive_message', cb); } catch {}
        }
        for (const cb of pendingDeletedListenersRef.current) {
          try { socketRef.current.off('message_deleted', cb); } catch {}
        }
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated, token]);

  // Clean up on logout
  useEffect(() => {
    if (!isAuthenticated && socketRef.current) {
      for (const cb of pendingMsgListenersRef.current) {
        try { socketRef.current.off('receive_message', cb); } catch {}
      }
      for (const cb of pendingDeletedListenersRef.current) {
        try { socketRef.current.off('message_deleted', cb); } catch {}
      }
      socketRef.current.disconnect();
      socketRef.current = null;
      attachedRef.current = { socketId: null, attached: { receive_message: new Set(), message_deleted: new Set() } };
    }
  }, [isAuthenticated]);

  const sendMessage = (message, room = 'general') => {
    if (socketRef.current) {
      socketRef.current.emit('send_message', { content: message, room });
    }
  };

  const joinRoom = (room) => {
    if (socketRef.current) {
      socketRef.current.emit('join_room', room);
    }
  };

  const onMessage = (callback) => {
    pendingMsgListenersRef.current.add(callback);
    if (socketRef.current) {
      if (!attachedRef.current.attached.receive_message.has(callback)) {
        try { socketRef.current.off('receive_message', callback); } catch {}
        socketRef.current.on('receive_message', callback);
        attachedRef.current.attached.receive_message.add(callback);
      }
    }
  };

  const offMessage = (callback) => {
    pendingMsgListenersRef.current.delete(callback);
    if (socketRef.current) {
      try { socketRef.current.off('receive_message', callback); } catch {}
    }
    attachedRef.current.attached.receive_message.delete(callback);
  };

  const onMessageDeleted = (callback) => {
    pendingDeletedListenersRef.current.add(callback);
    if (socketRef.current) {
      if (!attachedRef.current.attached.message_deleted.has(callback)) {
        try { socketRef.current.off('message_deleted', callback); } catch {}
        socketRef.current.on('message_deleted', callback);
        attachedRef.current.attached.message_deleted.add(callback);
      }
    }
  };

  const offMessageDeleted = (callback) => {
    pendingDeletedListenersRef.current.delete(callback);
    if (socketRef.current) {
      try { socketRef.current.off('message_deleted', callback); } catch {}
    }
    attachedRef.current.attached.message_deleted.delete(callback);
  };

  return {
    socket: socketRef.current,
    sendMessage,
    joinRoom,
    onMessage,
    offMessage,
    onMessageDeleted,
    offMessageDeleted,
  };
};
