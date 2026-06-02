import 'reflect-metadata';
import '../utils/envLoader';
import { AppDataSource } from '../config/database';
import { createDefaultSuperAdmin } from '../services/auth.service';

/**
 * Script khởi tạo database và tạo super admin
 * Chạy: npx tsx src/scripts/init-db.ts
 */
const initDatabase = async () => {
  try {
    console.log('🔄 Đang khởi tạo database...');

    // Khởi tạo kết nối
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Database connected');
      console.log('📊 Các bảng đã được tạo tự động:');
      console.log('   - users');
      console.log('   - cost_categories');
      console.log('   - notes');
      console.log('   - capital_allocations');
      console.log('   - advance_payments');
      console.log('   - design_files');
    }

    // Tạo super admin mặc định
    console.log('');
    console.log('👤 Đang tạo super admin...');
    await createDefaultSuperAdmin();

    console.log('');
    console.log('✅ Khởi tạo database thành công!');
    console.log('💡 Super admin mặc định:');
    console.log(`   Email: ${process.env.SUPER_ADMIN_EMAIL || 'admin@example.com'}`);
    console.log(`   Password: ${process.env.SUPER_ADMIN_PASSWORD || 'Admin123456'}`);

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi khởi tạo database:', error);
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(1);
  }
};

initDatabase();

