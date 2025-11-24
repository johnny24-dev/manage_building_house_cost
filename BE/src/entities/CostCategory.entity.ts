import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Note } from './Note.entity';

export enum CostCategoryType {
  PHAN_THO = 'phan_tho',
  HOAN_THIEN = 'hoan_thien',
  DIEN_NUOC = 'dien_nuoc',
  NOI_THAT = 'noi_that',
  PHAP_LY = 'phap_ly',
  PHAT_SINH = 'phat_sinh',
}

@Entity('cost_categories')
export class CostCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string; // Tên hạng mục chi phí

  @Column({
    type: 'varchar',
    nullable: true,
  })
  type?: CostCategoryType | null; // phan_tho, hoan_thien, dien_nuoc, noi_that, phap_ly, phat_sinh (optional)

  @Column({ type: 'real', nullable: true })
  quantity?: number | null; // Deprecated - giữ để tương thích

  @Column({ type: 'real', nullable: true, name: 'unit_price' })
  unitPrice?: number | null; // Deprecated - giữ để tương thích

  @Column({ type: 'real', nullable: true })
  total?: number | null; // Dự tính chi phí (estimated cost)

  @Column({ type: 'text', nullable: true })
  note?: string | null; // Ghi chú

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Note, (note) => note.category)
  notes: Note[];
}

