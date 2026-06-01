import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { AppDataSource } from '../config/database';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const DB_PATH =
  process.env.DB_PATH || path.join(__dirname, '../../database.sqlite');
const BACKUP_DIR =
  process.env.DB_BACKUP_DIR || path.join(__dirname, '../../backups');
const RETENTION_DAYS = Number(process.env.DB_BACKUP_RETENTION_DAYS || '7');
const BACKUP_TIME = process.env.DB_BACKUP_TIME || '02:00'; // HH:mm
const BACKUP_ENABLED = process.env.DB_BACKUP_ENABLED !== 'false';

const parseBackupTime = () => {
  const [hourStr, minuteStr] = BACKUP_TIME.split(':');
  const hours = Math.min(Math.max(Number(hourStr) || 2, 0), 23);
  const minutes = Math.min(Math.max(Number(minuteStr) || 0, 0), 59);
  return { hours, minutes };
};

const ensureBackupDir = async () => {
  if (!fs.existsSync(BACKUP_DIR)) {
    await fsPromises.mkdir(BACKUP_DIR, { recursive: true });
  }
};

const cleanupOldBackups = async () => {
  if (RETENTION_DAYS <= 0) {
    return;
  }

  const files = await fsPromises.readdir(BACKUP_DIR);
  const threshold = Date.now() - RETENTION_DAYS * ONE_DAY_MS;

  await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = await fsPromises.stat(filePath);

      if (stats.isFile() && stats.mtimeMs < threshold) {
        await fsPromises.unlink(filePath);
        console.log(`🧹 Đã xóa bản backup cũ: ${file}`);
      }
    })
  );
};

const performBackup = async () => {
  try {
    if (!fs.existsSync(DB_PATH)) {
      console.warn(
        `⚠️  Không tìm thấy file database tại ${DB_PATH}, bỏ qua backup`
      );
      return;
    }

    await ensureBackupDir();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `database-${timestamp}.sqlite`);

    // Sử dụng SQLite VACUUM INTO để backup an toàn, không bị lỗi database corruption
    const queryRunner = AppDataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.query('VACUUM INTO ?', [backupFile]);
      console.log(`💾 Đã backup database an toàn qua VACUUM INTO: ${backupFile}`);
    } finally {
      await queryRunner.release();
    }

    await cleanupOldBackups();
  } catch (error) {
    console.error('❌ Backup database thất bại:', error);
  }
};

const scheduleNextRun = (): void => {
  const { hours, minutes } = parseBackupTime();
  const now = new Date();
  const nextRun = new Date();
  nextRun.setHours(hours, minutes, 0, 0);

  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  const delay = nextRun.getTime() - now.getTime();
  const formatted = nextRun.toLocaleString();

  console.log(`🗓️  Lịch backup DB tiếp theo: ${formatted}`);

  setTimeout(async () => {
    await performBackup();
    scheduleNextRun();
  }, delay);
};

export const scheduleDatabaseBackup = (): void => {
  if (!BACKUP_ENABLED) {
    console.log('ℹ️  DB backup job đang bị tắt (DB_BACKUP_ENABLED=false)');
    return;
  }

  scheduleNextRun();
};

