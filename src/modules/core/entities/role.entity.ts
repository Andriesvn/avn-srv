import {
  Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Role {
  @PrimaryColumn()
  id: string;

  @Column({nullable:false})
  name: string;

  @Column()
  description: string;

  @Column('int')
  level: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

}