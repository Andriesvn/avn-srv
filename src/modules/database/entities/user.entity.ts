import {
    Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn,
    ManyToMany, JoinTable, RelationOptions, PrimaryGeneratedColumn, BeforeInsert, BeforeUpdate, AfterInsert, AfterUpdate
} from 'typeorm';
import * as bcrypt from "bcrypt";

import {Role} from "./role.entity";
import {IsEmail, IsAlpha} from 'class-validator';
import {ACL} from "./acl.entity";

const BCRYPT_REGEX = /^\$2[aby]\$[0-9]{2}\$.{53}$/;

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({unique: true})
  @IsEmail()
  email: string;

  @Column()
  first_name: string;

  @Column({type:'text'})
  last_name : string;

  @Column({select: false})
  password: string;

  @Column({select: false})
  enabled: boolean;

  @ManyToMany(type => Role,{ nullable:false } as RelationOptions)
  @JoinTable()
  roles: Role[];

  @ManyToMany(type => ACL,{ nullable:false } as RelationOptions)
  @JoinTable()
  acl: ACL[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
    public async hashPassword(): Promise<any> {
     return await User.bcryptHashPassword(this.password)
         .then(value => {
             //console.log(`USER ${this.email} PASSWORD HASHED:`,value);
             this.password = value;
             }
         ).catch(reason => {
           //IF AN ERROR OCCURRED, PREVENT THE USER FROM BEING INSERTED COMPLETELY
           //console.log('USER ENTITY: BEFORE INSERT HASH PASSWORD ERROR:',reason);
           //REMOVE THE EMAIL ADDRESS AND PASSWORD TO FORCE INSERT TO FAIL
             this.email = "";
             this.password = "";
         });
    }

    @AfterInsert()
    @AfterUpdate()
    public removePassword() {
        //REMOVE THE PASSWORD FROM RETURNING TO THE USER
        if (this.password) {
            this.password = undefined;
            //console.log(`USER ${this.email} AFTER INSERT | UPDATE: PASSWORD REMOVED`);
        }
    }

    @BeforeUpdate()
    public async reHashPassword(): Promise<any> {
     //CHECK IF THE PASSWORD IS ALREADY HASHED
      if (this.password && !User.isHashed(this.password))
        return await User.bcryptHashPassword(this.password)
            .then(value => {
                    //console.log(`USER ${this.email} PASSWORD REHASHED:`,value);
                    this.password = value;
                }
            ).catch(reason => {
                //IF AN ERROR OCCURRED, PREVENT THE USER FROM BEING INSERTED COMPLETELY
                //console.log('USER ENTITY: BEFORE UPDATE HASH PASSWORD ERROR:',reason);
                //REMOVE THE EMAIL ADDRESS AND PASSWORD TO FORCE THE UPDATE TO FAIL
                this.email = "";
                this.password = "";
            });
    }




    public static bcryptHashPassword(_password): Promise<string> {
        return bcrypt.hash(_password, 10);
    }

    public static isHashed(password) : boolean {
        var blnIsHash = BCRYPT_REGEX.test(password);
        return blnIsHash;
    }

}