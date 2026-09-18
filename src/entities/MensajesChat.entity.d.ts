import { SalasChat } from "./SalasChat.entity";
import { SuscriptoresSalasChat } from "./SuscriptoresSalasChat.entity";
export declare class MensajesChat {
    id: string;
    id_sala: string;
    message: string;
    archivos: Record<string, any>;
    id_user: string;
    userName: string;
    fecha_creacion: Date;
    suscrip: SuscriptoresSalasChat;
    salas: SalasChat;
}
