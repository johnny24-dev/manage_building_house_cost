import { AppDataSource } from '../config/database';
import { User } from '../entities/User.entity';
import { emailService } from './email.service';

type AdminAction = 'create' | 'update' | 'delete';

export interface AdminNotificationPayload {
  action: AdminAction;
  entityName: string;
  actorEmail?: string;
  actorId?: string;
  entityId?: string | null;
  details?: Array<{ label: string; value?: string | number | null }>;
}
import { notificationCenterService } from './notificationCenter.service';

const actionLabels: Record<AdminAction, string> = {
  create: 'thêm mới',
  update: 'cập nhật',
  delete: 'xóa',
};

const getUserRepository = () => AppDataSource.getRepository(User);

const RECIPIENT_CACHE_TTL = Number(process.env.EMAIL_RECIPIENT_CACHE_TTL || 60_000);
let recipientCache: { emails: string[]; timestamp: number } | null = null;

const notificationQueue: AdminNotificationPayload[] = [];
let isProcessingQueue = false;

async function getRecipientEmails(): Promise<string[]> {
  if (recipientCache && Date.now() - recipientCache.timestamp < RECIPIENT_CACHE_TTL) {
    return recipientCache.emails;
  }

  const userRepository = getUserRepository();
  const users = await userRepository.find({
    select: ['email', 'notifyEmail'],
    where: { notifyEmail: true },
  });

  const emails = users.map((user) => user.email).filter(Boolean);
  recipientCache = { emails, timestamp: Date.now() };
  return emails;
}

function buildDetailsHtml(
  details?: Array<{ label: string; value?: string | number | null }>
): string {
  if (!details || details.length === 0) {
    return '';
  }

  const rows = details
    .filter((item) => item.value !== undefined && item.value !== null && item.value !== '')
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 12px;color:#555;font-size:14px;border-bottom:1px solid #f0f2f6;">
            <strong style="display:block;color:#0b1f33;">${item.label}</strong>
            <span>${item.value}</span>
          </td>
        </tr>
      `
    )
    .join('');

  if (!rows) return '';

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:16px;border-radius:10px;background:#f7f9fc;border:1px solid #e3e8f0;">
      <tr>
        <td style="padding:12px 16px;font-size:15px;font-weight:600;color:#0b1f33;border-bottom:1px solid #e3e8f0;">
          Chi tiết hạng mục
        </td>
      </tr>
      ${rows}
    </table>
  `;
}

function buildTextDetails(
  details?: Array<{ label: string; value?: string | number | null }>
): string {
  if (!details || details.length === 0) return '';

  return details
    .filter((item) => item.value !== undefined && item.value !== null && item.value !== '')
    .map((item) => `- ${item.label}: ${item.value}`)
    .join('\n');
}

async function processNextJob() {
  if (isProcessingQueue) return;
  if (notificationQueue.length === 0) return;

  isProcessingQueue = true;
  const job = notificationQueue.shift();

  if (!job) {
    isProcessingQueue = false;
    return;
  }

  try {
    const recipients = await getRecipientEmails();
    if (recipients.length === 0) {
      console.info('[Notification] No recipients subscribe to email notifications.');
      return;
    }

    const actionLabel = actionLabels[job.action];
    const subject = `Thông báo: ${job.entityName} vừa được ${actionLabel}`;
    const actorLine = job.actorEmail
      ? `Người thực hiện: <strong>${job.actorEmail}</strong>`
      : 'Người thực hiện: Hệ thống';
    const detailHtml = buildDetailsHtml(job.details);
    const ctaUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const html = `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#eef3fb;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 18px 40px rgba(15,34,58,0.15);">
              <tr>
                <td style="background:#0d6efd;color:#ffffff;padding:28px 32px;font-size:20px;font-weight:600;">
                  Manage Cost Building House
                </td>
              </tr>
              <tr>
                <td style="padding:28px 32px;color:#0b1f33;font-size:15px;line-height:1.6;">
                  <p style="margin:0 0 12px;">Xin chào,</p>
                  <p style="margin:0 0 4px;">${actorLine} vừa ${actionLabel} <strong>${job.entityName}</strong>.</p>
                  <p style="margin:0 0 12px;color:#56627a;">Thời gian: ${new Date().toLocaleString('vi-VN')}</p>
                  ${detailHtml}
                  <p style="margin:24px 0 16px;">Vui lòng đăng nhập hệ thống để xem thêm chi tiết.</p>
                  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                    <tr>
                      <td style="background:#0d6efd;border-radius:999px;">
                        <a href="${ctaUrl}" style="display:inline-block;padding:12px 28px;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;">Đăng nhập hệ thống</a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:24px 0 0;font-size:13px;color:#7f8a9f;">Đây là email tự động, vui lòng không trả lời.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;

    const textDetails = buildTextDetails(job.details);
    const text = [
      'Xin chào,',
      `${job.actorEmail || 'Hệ thống'} vừa ${actionLabel} ${job.entityName}.`,
      `Thời gian: ${new Date().toLocaleString('vi-VN')}`,
      textDetails,
      `Đăng nhập hệ thống: ${ctaUrl}`,
    ]
      .filter(Boolean)
      .join('\n\n');

    await emailService.sendMail({
      to: recipients,
      subject,
      html,
      text,
    });
  } catch (error) {
    console.error('[Notification] Failed to send admin action email:', error);
  } finally {
    isProcessingQueue = false;
    if (notificationQueue.length > 0) {
      setImmediate(processNextJob);
    }
  }
}

export const notificationService = {
  queueAdminAction(payload: AdminNotificationPayload) {
    notificationQueue.push(payload);
    setImmediate(() => processNextJob());

    const actionLabel = actionLabels[payload.action];
    const descriptionLines = payload.details
      ?.filter((item) => item.value !== undefined && item.value !== null && item.value !== '')
      .map((item) => `${item.label}: ${item.value}`);

    notificationCenterService
      .createBroadcastNotification({
        title: `${payload.entityName} được ${actionLabel}`,
        message: `${payload.actorEmail || 'Hệ thống'} vừa ${actionLabel} ${payload.entityName}.`,
        action: payload.action,
        entityName: payload.entityName,
        entityId: payload.entityId,
        type:
          payload.action === 'delete'
            ? 'warning'
            : payload.action === 'create'
            ? 'success'
            : 'info',
        metadata: descriptionLines && descriptionLines.length > 0 ? { details: descriptionLines } : undefined,
        actorId: payload.actorId ?? undefined,
      })
      .catch((error) => {
        console.error('[Notification] Failed to create in-app notification:', error);
      });
  },
};


