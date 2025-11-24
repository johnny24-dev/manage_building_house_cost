import { DataSource } from 'typeorm';
import { User } from '../entities/User.entity';
import { CostCategory } from '../entities/CostCategory.entity';
import { Cost } from '../entities/Cost.entity';
import { Note } from '../entities/Note.entity';
import { CapitalAllocation } from '../entities/CapitalAllocation.entity';
import { AdvancePayment } from '../entities/AdvancePayment.entity';
import { DesignFile } from '../entities/DesignFile.entity';
import { Notification } from '../entities/Notification.entity';
import { NotificationUser } from '../entities/NotificationUser.entity';
import path from 'path';

// Đường dẫn file database SQLite
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database.sqlite');

export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: dbPath,
  entities: [
    User,
    CostCategory,
    Cost,
    Note,
    CapitalAllocation,
    AdvancePayment,
    DesignFile,
    Notification,
    NotificationUser,
  ],
  synchronize: process.env.NODE_ENV !== 'production', // Chỉ dùng trong development
  logging: process.env.NODE_ENV === 'development',
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Database connected successfully');
      console.log(`📊 Database file: ${dbPath}`);
      console.log(`💾 Type: SQLite`);
    } else {
      console.log('✅ Database already connected');
    }
  } catch (error: any) {
    console.error('❌ Error connecting to database:');
    console.error('   Message:', error.message);
    console.error('   💡 Kiểm tra quyền ghi file trong thư mục database');
    throw error;
  }
};

