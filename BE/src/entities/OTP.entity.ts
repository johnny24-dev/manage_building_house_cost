import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('otp_codes')
export class OTP {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  @Index()
  email: string;

  @Column({ type: 'varchar', length: 6 })
  code: string; // 6 chữ số

  @Column({ type: 'varchar' })
  purpose: string; // 'register', 'reset_password', etc.

  @Column({ type: 'boolean', default: false })
  verified: boolean;

  @Column({ type: 'datetime', name: 'expires_at' })
  expiresAt: Date;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;
}

