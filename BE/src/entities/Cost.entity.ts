import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CostCategory } from './CostCategory.entity';

export enum CostStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

@Entity('costs')
export class Cost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', name: 'category_id' })
  categoryId: string;

  @Column({ type: 'text' })
  description: string; // Mô tả chi phí

  @Column({ type: 'real' })
  amount: number; // Số tiền

  @Column({ type: 'date' })
  date: Date; // Ngày chi phí

  @Column({
    type: 'varchar',
    default: CostStatus.PENDING,
  })
  status: CostStatus; // Trạng thái: pending, paid, cancelled

  @Column({ type: 'varchar', name: 'bill_image_url', nullable: true })
  billImageUrl: string | null;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => CostCategory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category: CostCategory;
}

