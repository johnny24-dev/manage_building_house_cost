import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

// Tự động tìm kiếm và tải file .env bằng cách đi ngược lên thư mục gốc
export const loadEnv = (): void => {
  let currentDir = process.cwd();
  
  // Đi ngược lên tối đa 5 cấp thư mục để tìm .env
  for (let i = 0; i < 5; i++) {
    const envPath = path.join(currentDir, '.env');
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      // console.log(`[EnvLoader] Loaded variables from: ${envPath}`);
      return;
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) break; // Đã chạm root filesystem
    currentDir = parentDir;
  }
  
  // Fallback mặc định nếu không tìm thấy file ở cấp cha
  dotenv.config();
};

// Gọi luôn khi import
loadEnv();
