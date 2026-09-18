import { SalasChat } from "./SalasChat.entity";
export declare class SuscriptoresSalasChat {
    id_user: string;
    id_sala: string;
    nombre_sala: string;
    imagen_sala: string;
    mensajes_por_leer: number;
    fecha_suscripcion: Date;
    fecha_eliminacion: Date | null;
    salas: SalasChat;
}
