import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({name:'user_conected'})
export class UserConected{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type:"varchar", length:100})
    userId:string;

    @Column({type:"varchar", length:100})
    userName:string;

    @Column({type:"varchar", length:100, nullable:true})
    namespace:string;

    @Column({type:"json"})
    client:Record<string,any>
}