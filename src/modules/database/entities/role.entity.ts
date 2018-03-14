import {
    Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable, RelationOptions,
} from 'typeorm';
import {IsInt} from 'class-validator';
import {ACL} from "./acl.entity";

@Entity()
export class Role {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column({nullable:true})
  description: string;

  @Column('int')
  @IsInt()
  level: number;

  @ManyToMany(type => ACL,{ nullable:false } as RelationOptions)
  @JoinTable()
  acl: ACL[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

}