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

export enum PaymentStatus {
  PAID = 'paid',
  PLANNED = 'planned',
}

@Entity('advance_payments')
export class AdvancePayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', name: 'ticket_name' })
  ticketName: string; // Tên phiếu

  @Column({ type: 'varchar', name: 'category_id', nullable: true })
  categoryId: string | null; // Hạng mục

  @Column({ type: 'datetime', name: 'payment_date' })
  paymentDate: Date;

  @Column({ type: 'varchar' })
  phase: string; // Đợt tạm ứng

  @Column({ type: 'real' })
  amount: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'varchar',
    default: PaymentStatus.PLANNED,
  })
  status: PaymentStatus; // paid, planned

  @Column({ type: 'varchar', name: 'bill_image_url', nullable: true })
  billImageUrl: string | null;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => CostCategory, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category: CostCategory | null;
}

