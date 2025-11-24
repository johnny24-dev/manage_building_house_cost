import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('capital_allocations')
export class CapitalAllocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'real', name: 'total_budget' })
  totalBudget: number;

  @Column({ type: 'real', name: 'phan_tho_percent', default: 0 })
  phanThoPercent: number;

  @Column({ type: 'real', name: 'hoan_thien_percent', default: 0 })
  hoanThienPercent: number;

  @Column({ type: 'real', name: 'dien_nuoc_percent', default: 0 })
  dienNuocPercent: number;

  @Column({ type: 'real', name: 'noi_that_percent', default: 0 })
  noiThatPercent: number;

  @Column({ type: 'real', name: 'phap_ly_percent', default: 0 })
  phapLyPercent: number;

  @Column({ type: 'real', name: 'phat_sinh_percent', default: 0 })
  phatSinhPercent: number;

  @Column({ type: 'real', name: 'tam_ung_percent', default: 0 })
  tamUngPercent: number; // Tạm ứng thi công

  // Optional: Lưu sẵn số tiền
  @Column({ type: 'real', name: 'phan_tho_amount', nullable: true })
  phanThoAmount: number;

  @Column({ type: 'real', name: 'hoan_thien_amount', nullable: true })
  hoanThienAmount: number;

  @Column({ type: 'real', name: 'dien_nuoc_amount', nullable: true })
  dienNuocAmount: number;

  @Column({ type: 'real', name: 'noi_that_amount', nullable: true })
  noiThatAmount: number;

  @Column({ type: 'real', name: 'phap_ly_amount', nullable: true })
  phapLyAmount: number;

  @Column({ type: 'real', name: 'phat_sinh_amount', nullable: true })
  phatSinhAmount: number;

  @Column({ type: 'real', name: 'tam_ung_amount', nullable: true })
  tamUngAmount: number;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;
}

