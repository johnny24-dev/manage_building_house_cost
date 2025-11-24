import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('design_files')
export class DesignFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', name: 'file_name' })
  fileName: string;

  @Column({ type: 'varchar', name: 'original_name' })
  originalName: string;

  @Column({ type: 'varchar', name: 'file_path' })
  filePath: string; // Đường dẫn trên server

  @Column({ type: 'integer', name: 'file_size', nullable: true })
  fileSize?: number;

  @CreateDateColumn({ type: 'datetime', name: 'uploaded_at' })
  uploadedAt: Date;
}

