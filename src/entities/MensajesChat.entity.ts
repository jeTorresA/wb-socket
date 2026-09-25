import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { SalasChat } from "./SalasChat.entity";

@Entity({name:'mensajes_chat'})
export class MensajesChat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: "varchar", length: 36, nullable: false })
  id_sala: string;
  
  @Column({ type: "varchar", length: 450, nullable: false })
  message: string;
  
  @Column({ type: "json", nullable: true, comment: 'contiene la lista de archivos del mensaje si los hay' })
  archivos: Record<string, any>;

  @Column({ type: "varchar", length: 100, nullable: false })
  id_user: string;

  @Column({type:"varchar", length:100})
  userName:string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'fecha_creacion' })
  fecha_creacion: Date;

  // Sin relación con suscriptores_salas_chat: su FK sobre id_user era compuesta por
  // (id_user, id_sala) y al borrar una suscripción eliminaba en cascada TODOS los
  // mensajes de ese usuario en todas las salas.
  @ManyToOne(() => SalasChat, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({name:'id_sala', referencedColumnName:'id_sala'})
  public salas:SalasChat;
}