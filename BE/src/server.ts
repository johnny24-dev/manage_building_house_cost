import 'reflect-metadata';
import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { initializeDatabase } from './config/database';
import { scheduleDatabaseBackup } from './jobs/databaseBackup.job';
import { ensureCostBillColumn } from './services/cost.service';
import { ensureAdvanceBillColumn } from './services/advancePayment.service';
import { ensureOTPTable } from './services/otp.service';
import { ensureAllTablesExist } from './utils/schemaEnsurer';

// Routes
import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';
import costCategoryRoutes from './routes/costCategory.routes';
import costRoutes from './routes/cost.routes';
import noteRoutes from './routes/note.routes';
import capitalAllocationRoutes from './routes/capitalAllocation.routes';
import advancePaymentRoutes from './routes/advancePayment.routes';
import designFileRoutes from './routes/designFile.routes';
import settingsRoutes from './routes/settings.routes';
import notificationRoutes from './routes/notification.routes';
import searchRoutes from './routes/search.routes';

const app = express();
const PORT = process.env.PORT || 9000;

// CORS Configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    // Clean up trailing slash from origin for consistent comparisons
    const cleanOrigin = origin.replace(/\/$/, '');
    
    const allowedOrigins = [
      (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, ''),
      'http://localhost:3000',
      'http://frontend:3000', // Docker internal
    ];
    
    // Check if origin is allowed (exact match or subdomain match if needed)
    if (allowedOrigins.some(allowed => cleanOrigin === allowed || cleanOrigin.startsWith(allowed + '/'))) {
      callback(null, true);
    } else {
      // In production, be more strict
      if (process.env.NODE_ENV === 'production') {
        console.error(`[CORS] Rejected origin: ${origin}. Allowed: ${allowedOrigins.join(', ')}`);
        callback(new Error('Not allowed by CORS'));
      } else {
        callback(null, true); // Allow in development
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Type', 'Content-Length', 'Content-Disposition'],
};

app.use(cors(corsOptions));

// Middleware
// Tăng giới hạn body size để hỗ trợ upload file lớn
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// Health check
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'API Quản lý chi phí xây nhà',
    version: '1.0.0',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/cost-categories', costCategoryRoutes);
app.use('/api/costs', costRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/capital-allocations', capitalAllocationRoutes);
app.use('/api/advance-payments', advancePaymentRoutes);
app.use('/api/designs', designFileRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);

// Serve static files từ thư mục uploads
app.use('/uploads', express.static('uploads'));

// 404 Handler - phải đặt trước errorHandler
app.use(notFoundHandler);

// Error Handler - phải đặt cuối cùng
app.use(errorHandler);

// Khởi tạo database và start server
export const startServer = async (): Promise<void> => {
  try {
    await initializeDatabase();
    await ensureAllTablesExist();
    
    // Tạo super admin nếu chưa có
    const { createDefaultSuperAdmin } = await import('./services/auth.service');
    await createDefaultSuperAdmin();
    await ensureCostBillColumn();
    await ensureAdvanceBillColumn();
    await ensureOTPTable();
    scheduleDatabaseBackup();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server is running at http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Chạy server nếu file được gọi trực tiếp
if (require.main === module) {
  startServer();
}

export default app;

