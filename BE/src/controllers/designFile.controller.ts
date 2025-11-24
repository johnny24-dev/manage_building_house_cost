import { Request, Response, NextFunction } from 'express';
import { designFileService } from '../services/designFile.service';
import { sendSuccess } from '../utils/response';
import { SuccessCode } from '../constants/statusCodes';
import fs from 'fs';
import path from 'path';
import { AppError } from '../utils/AppError';
import { ErrorCode } from '../constants/statusCodes';
import { notificationService } from '../services/notification.service';

export class DesignFileController {
  /**
   * Upload file PDF
   */
  static async upload(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError(ErrorCode.FILE_NOT_FOUND, 'Không có file được upload');
      }

      const file = await designFileService.createFromUpload(req.file);
      
      // Trả về với URL để frontend có thể truy cập
      const fileData = {
        id: file.id,
        name: file.originalName,
        url: `/api/designs/file/${file.id}`,
        fileName: file.fileName,
        uploadedAt: file.uploadedAt,
      };

      notificationService.queueAdminAction({
        action: 'create',
        entityName: 'file thiết kế',
        actorEmail: req.user?.email,
        actorId: req.user?.userId,
        entityId: file.id,
        details: [
          { label: 'Tên file', value: file.originalName },
          { label: 'Kích thước', value: file.fileSize ? `${Math.round(file.fileSize / 1024)} KB` : undefined },
        ],
      });

      return sendSuccess(res, SuccessCode.CREATED, fileData);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy danh sách files (id, name, url)
   */
  static async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const files = await designFileService.findAll();
      
      // Format response với URL
      const filesWithUrl = files.map((file) => ({
        id: file.id,
        name: file.originalName,
        url: `/api/designs/file/${file.id}`,
        uploadedAt: file.uploadedAt,
      }));

      return sendSuccess(res, SuccessCode.SUCCESS, filesWithUrl);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy metadata + URL của file
   */
  static async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const file = await designFileService.findById(id);
      
      const fileData = {
        id: file.id,
        name: file.originalName,
        fileName: file.fileName,
        url: `/api/designs/file/${file.id}`,
        uploadedAt: file.uploadedAt,
      };

      return sendSuccess(res, SuccessCode.SUCCESS, fileData);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Stream file PDF trực tiếp
   */
  static async streamFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const file = await designFileService.findById(id);

      // Kiểm tra file tồn tại trên disk
      if (!fs.existsSync(file.filePath)) {
        throw new AppError(ErrorCode.FILE_NOT_FOUND, 'File không tồn tại trên server');
      }

      // Get file stats để set Content-Length
      const stats = fs.statSync(file.filePath);
      const fileSize = stats.size;

      // Set headers để browser có thể hiển thị PDF
      res.setHeader('Content-Type', 'application/pdf');
      const encodedName = encodeURIComponent(file.originalName);
      const asciiFallback = file.originalName.replace(/[^\x20-\x7E]/g, '_');
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${asciiFallback}"; filename*=UTF-8''${encodedName}`
      );
      res.setHeader('Content-Length', fileSize);
      
      // CORS headers cho file streaming
      const origin = req.headers.origin;
      if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }
      res.setHeader('Access-Control-Expose-Headers', 'Content-Type, Content-Length, Content-Disposition');
      
      // Cache control
      res.setHeader('Cache-Control', 'private, max-age=3600');

      // Stream file
      const fileStream = fs.createReadStream(file.filePath);
      fileStream.on('error', (error) => {
        console.error('File stream error:', error);
        if (!res.headersSent) {
          next(error);
        }
      });
      fileStream.pipe(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Xóa file
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const file = await designFileService.findById(id);

      // Xóa file trên disk
      if (fs.existsSync(file.filePath)) {
        fs.unlinkSync(file.filePath);
      }

      // Xóa record trong database
      await designFileService.delete(id);
      notificationService.queueAdminAction({
        action: 'delete',
        entityName: 'file thiết kế',
        actorEmail: req.user?.email,
        actorId: req.user?.userId,
        entityId: id,
        details: [{ label: 'Tên file', value: file.originalName }],
      });
      return sendSuccess(res, SuccessCode.DELETED);
    } catch (error) {
      next(error);
    }
  }
}

