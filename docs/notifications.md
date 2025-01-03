# Notifications Guide

This guide explains how to work with the real-time notification system.

## WebSocket Connection

Connect to the notifications WebSocket server.

\`\`\`typescript
import { io } from 'socket.io-client';

// Connect to notifications namespace
const socket = io('ws://localhost:3000/notifications', {
  auth: {
    token: 'your_jwt_token_here',
  },
});

// Connection events
socket.on('connect', () => {
  console.log('Connected to notification server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from notification server');
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});
\`\`\`

## Receiving Notifications

Listen for different types of notifications.

\`\`\`typescript
// General notification handler
socket.on('notification', (notification) => {
  console.log('Received notification:', notification);
  // {
  //   id: string;
  //   type: NotificationType;
  //   message: string;
  //   data?: any;
  //   createdAt: Date;
  //   read: boolean;
  // }
});

// Specific notification types
socket.on('offer.new', (offer) => {
  console.log('New offer received:', offer);
});

socket.on('offer.updated', (offer) => {
  console.log('Offer updated:', offer);
});

socket.on('transaction.completed', (transaction) => {
  console.log('Transaction completed:', transaction);
});

socket.on('support.response', (ticket) => {
  console.log('Support ticket updated:', ticket);
});
\`\`\`

## Managing Notifications

API endpoints for managing notifications.

\`\`\`typescript
// Fetch all notifications
const getNotifications = async () => {
  const response = await fetch('/notifications', {
    headers: {
      'Authorization': \`Bearer \${token}\`,
    },
  });

  return response.json();
};

// Mark notification as read
const markAsRead = async (notificationId: string) => {
  const response = await fetch(\`/notifications/\${notificationId}/read\`, {
    method: 'PATCH',
    headers: {
      'Authorization': \`Bearer \${token}\`,
    },
  });

  return response.json();
};

// Mark all notifications as read
const markAllAsRead = async () => {
  const response = await fetch('/notifications/read-all', {
    method: 'PATCH',
    headers: {
      'Authorization': \`Bearer \${token}\`,
    },
  });

  return response.json();
};

// Delete a notification
const deleteNotification = async (notificationId: string) => {
  const response = await fetch(\`/notifications/\${notificationId}\`, {
    method: 'DELETE',
    headers: {
      'Authorization': \`Bearer \${token}\`,
    },
  });

  return response.ok;
};
\`\`\`

## Notification Preferences

Manage user notification preferences.

\`\`\`typescript
// Update notification preferences
const updatePreferences = async (preferences: NotificationPreferences) => {
  const response = await fetch('/notifications/preferences', {
    method: 'PUT',
    headers: {
      'Authorization': \`Bearer \${token}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(preferences),
  });

  return response.json();
};

// Example preferences
const preferences = {
  email: {
    offers: true,
    transactions: true,
    support: true,
    marketing: false,
  },
  push: {
    offers: true,
    transactions: true,
    support: true,
    marketing: false,
  },
  sms: {
    offers: false,
    transactions: true,
    support: false,
    marketing: false,
  },
};

await updatePreferences(preferences);
\`\`\`

## Real-time Updates Example

Complete example of handling real-time notifications in a React application.

\`\`\`typescript
import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Notification {
  id: string;
  type: string;
  message: string;
  data?: any;
  createdAt: Date;
  read: boolean;
}

const NotificationComponent: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Connect to WebSocket
    const newSocket = io('ws://localhost:3000/notifications', {
      auth: {
        token: localStorage.getItem('token'),
      },
    });

    setSocket(newSocket);

    // Fetch existing notifications
    fetchNotifications();

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Listen for new notifications
    socket.on('notification', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
      showNotificationToast(notification);
    });

    // Handle connection errors
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      // Implement reconnection logic
    });

    return () => {
      socket.off('notification');
      socket.off('connect_error');
    };
  }, [socket]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/notifications', {
        headers: {
          'Authorization': \`Bearer \${localStorage.getItem('token')}\`,
        },
      });
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(\`/notifications/\${notificationId}/read\`, {
        method: 'PATCH',
        headers: {
          'Authorization': \`Bearer \${localStorage.getItem('token')}\`,
        },
      });

      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const showNotificationToast = (notification: Notification) => {
    // Implement your toast/snackbar logic here
    console.log('New notification:', notification.message);
  };

  return (
    <div>
      <h2>Notifications</h2>
      <div className="notifications-list">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={\`notification \${notification.read ? 'read' : 'unread'}\`}
            onClick={() => markAsRead(notification.id)}
          >
            <div className="notification-message">{notification.message}</div>
            <div className="notification-time">
              {new Date(notification.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationComponent;
\`\`\`

## Error Handling

Common notification-related errors.

\`\`\`typescript
// WebSocket authentication error
{
  "statusCode": 401,
  "message": "Invalid token",
  "error": "Unauthorized"
}

// Failed to mark as read
{
  "statusCode": 404,
  "message": "Notification not found",
  "error": "Not Found"
}

// Invalid preferences
{
  "statusCode": 400,
  "message": "Invalid notification preferences",
  "error": "Bad Request"
}
\`\`\` 