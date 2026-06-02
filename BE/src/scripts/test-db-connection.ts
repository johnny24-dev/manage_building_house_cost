import 'reflect-metadata';
import '../utils/envLoader';
import { initializeDatabase } from '../config/database';

/**
 * Script test kết nối database
 * Chạy: npx tsx src/scripts/test-db-connection.ts
 */
const testConnection = async () => {
  console.log('🔍 Testing database connection...');
  console.log('📋 Configuration:');
  console.log(`   Type: SQLite`);
  console.log(`   Database path: ${process.env.DB_PATH || 'database.sqlite (default)'}`);
  console.log('');

  try {
    await initializeDatabase();
    console.log('');
    console.log('✅ Test kết nối thành công!');
    process.exit(0);
  } catch (error) {
    console.log('');
    console.log('❌ Test kết nối thất bại!');
    process.exit(1);
  }
};

testConnection();

