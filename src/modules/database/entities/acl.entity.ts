import {Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn} from "typeorm";
import {IsArray, IsNotEmpty, IsInt, IsJSON} from "class-validator";


export interface AclCriteria {
    where?: any | any[], //WHERE CLAUSE TO FILTER ALLOWED DATA
    omit?: string | string[], //REMOVE FIELDS BEFORE RETURNING, INSERTING ,UPDATING
    relations?: string | string[], //RELATIONS TO JOIN
    select?: string | string[], // SELECT HIDDEN COLUMNS
}


@Entity("acl")
export class ACL {
    @PrimaryColumn()
    id: string;

    @Column({nullable:true})
    description: string;
    @Column('int')
    @IsInt()
    order: number;

    @Column("simple-array")
    @IsNotEmpty()
    @IsArray()
    resources: string[];

    @Column("simple-array")
    @IsNotEmpty()
    @IsArray()
    methods: string[];

    @Column("simple-json",{nullable:true})
    @IsJSON()
    criteria: AclCriteria;

    @Column({default:false})
    allowed:boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

}