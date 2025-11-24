import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Notification } from '../entities/Notification.entity';

interface Client {
  id: string;
  userId: string;
  res: Response;
}

const clients = new Map<string, Client>();
const HEARTBEAT_INTERVAL = 25000;

function formatNotificationPayload(notification: Notification) {
  return {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    entityName: notification.entityName,
    entityId: notification.entityId,
    action: notification.action,
    type: notification.type,
    metadata: notification.metadata ? JSON.parse(notification.metadata) : null,
    createdAt: notification.createdAt,
    isRead: false,
    readAt: null,
  };
}

export const notificationStream = {
  addClient(userId: string, res: Response) {
    const clientId = uuidv4();
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write('event: connected\ndata: {}\n\n');

    const client: Client = { id: clientId, userId, res };
    clients.set(clientId, client);

    const heartbeat = setInterval(() => {
      if (res.writableEnded) {
        clearInterval(heartbeat);
        this.removeClient(clientId);
        return;
      }
      res.write(': heartbeat\n\n');
    }, HEARTBEAT_INTERVAL);

    res.on('close', () => {
      clearInterval(heartbeat);
      this.removeClient(clientId);
    });

    return clientId;
  },

  removeClient(clientId: string) {
    const client = clients.get(clientId);
    if (client) {
      clients.delete(clientId);
    }
  },

  broadcast(notification: Notification, recipientUserIds: string[]) {
    const payload = `data: ${JSON.stringify(formatNotificationPayload(notification))}\n\n`;
    clients.forEach((client) => {
      if (recipientUserIds.includes(client.userId)) {
        client.res.write(payload);
      }
    });
  },
};

