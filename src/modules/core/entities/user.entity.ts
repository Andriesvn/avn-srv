import {
  Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn,
  ManyToMany, JoinTable, RelationOptions
} from 'typeorm';
import {Generated} from "typeorm/decorator/Generated";
import {Role} from "./role.entity";

@Entity()
export class User {
  @PrimaryColumn()
  @Generated("uuid")
  id: string;

  @Column({unique: true,nullable:false})
  email: string;

  @Column({nullable:false})
  first_name: string;

  @Column({type:'text',nullable:false})
  last_name : string;

  @Column({select: false,nullable:false})
  password: string;

  @ManyToMany(type => Role,{ nullable: false } as RelationOptions)
  @JoinTable()
  roles: Role[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}