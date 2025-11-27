import { AppDataSource } from '../config/database';

interface TableRow {
  name: string;
}

/**
 * Đảm bảo mọi bảng Entity đều tồn tại trong database.
 * Nếu thiếu bảng, gọi synchronize của TypeORM để tạo mới mà không cần bật global synchronize.
 */
export const ensureAllTablesExist = async (): Promise<void> => {
  if (!AppDataSource.isInitialized) {
    throw new Error('Database must be initialized before ensuring tables.');
  }

  const queryRunner = AppDataSource.createQueryRunner();

  try {
    const tables: TableRow[] = await queryRunner.query(
      "SELECT name FROM sqlite_master WHERE type='table'"
    );
    const existingTables = new Set(tables.map((table) => table.name));

    const missingTables = AppDataSource.entityMetadatas
      .map((meta) => meta.tableName)
      .filter((tableName) => !existingTables.has(tableName));

    if (missingTables.length === 0) {
      console.log('✅ All entity tables already exist.');
      return;
    }

    console.log('🛠️  Missing tables detected:', missingTables.join(', '));
    await AppDataSource.synchronize();
    console.log('✅ Missing tables have been created.');
  } catch (error) {
    console.error('❌ Failed to ensure database tables:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
};


