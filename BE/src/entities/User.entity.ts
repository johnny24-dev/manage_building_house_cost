import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  VIEWER = 'viewer',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar', name: 'password_hash' })
  password: string;

  @Column({ type: 'varchar', name: 'full_name', nullable: true })
  fullName?: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone?: string | null;

  @Column({ type: 'varchar', nullable: true })
  address?: string | null;

  @Column({ type: 'varchar', name: 'avatar_url', nullable: true })
  avatarUrl?: string | null;

  @Column({ type: 'boolean', name: 'notify_email', default: true })
  notifyEmail: boolean;

  @Column({ type: 'boolean', name: 'notify_budget', default: true })
  notifyBudget: boolean;

  @Column({
    type: 'varchar',
    default: UserRole.VIEWER,
  })
  role: UserRole; // super_admin hoặc viewer

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;
}

