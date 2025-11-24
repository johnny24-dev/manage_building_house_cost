import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './User.entity';
import { NotificationUser } from './NotificationUser.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', name: 'entity_name', nullable: true })
  entityName?: string | null;

  @Column({ type: 'varchar', name: 'entity_id', nullable: true })
  entityId?: string | null;

  @Column({ type: 'varchar', nullable: true })
  action?: 'create' | 'update' | 'delete' | string;

  @Column({ type: 'varchar', default: 'info' })
  type: 'info' | 'success' | 'warning' | 'error' | string;

  @Column({ type: 'text', nullable: true })
  metadata?: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy?: User | null;

  @Column({ type: 'varchar', name: 'created_by', nullable: true })
  createdById?: string | null;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => NotificationUser, (recipient) => recipient.notification)
  recipients: NotificationUser[];
}

