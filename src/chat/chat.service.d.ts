import { MensajesChat } from 'src/entities/MensajesChat.entity';
import { SalasChat } from 'src/entities/SalasChat.entity';
import { SuscriptoresSalasChat } from 'src/entities/SuscriptoresSalasChat.entity';
import { SocketRegistryService } from 'src/modules/realtime';
import { Repository } from 'typeorm';
import { IMessageSaveStructure, salasChat, suscriptor } from './interfaces/chat/chat.interface';
export declare class ChatService {
    private mensajesChatRepository;
    private salasSubcritas;
    private suscriptoresChats;
    private socketRegistryService;
    idSala: any;
    constructor(mensajesChatRepository: Repository<MensajesChat>, salasSubcritas: Repository<SalasChat>, suscriptoresChats: Repository<SuscriptoresSalasChat>, socketRegistryService: SocketRegistryService);
    usersConected(data: {
        userId: string;
        userName: string;
        client?: any;
    }): Promise<{
        userId: string;
        userName: string;
    }>;
    removeClientConnected(id_client: string): Promise<any>;
    searchClientsConnected(userIds: string[]): Promise<import("../entities/UserConected.entity").UserConected[]>;
    obtenerSalasSuscritas(id_user: string, salasActuales: string[]): Promise<SuscriptoresSalasChat[]>;
    obtenerMensajesSala(id_sala: string): Promise<MensajesChat[]>;
    consultarInfoSala(id_sala: string): Promise<SalasChat[]>;
    getRoomSubscribers(id_sala: string): Promise<{
        id_user: string;
    }[]>;
    createMensaje(mensaje: IMessageSaveStructure): Promise<any>;
    updateMessagesToRead(id_sala: string, id_user: string): Promise<any>;
    updateMessagesAsRead(roomId: string, subscriberId: string): Promise<any>;
    getMessagesToRead(id_sala: string, id_user: string): Promise<any>;
    validarSala(nombre_salas: string[]): Promise<salasChat[]>;
    createSala(data: (salasChat & {
        suscriptores: suscriptor[];
    })): Promise<{
        type: string;
        message: string;
        data: {
            tipo_sala: number;
            subscribers: any[];
        };
    }>;
    updateSubscribers(idSala: string, data: (salasChat & {
        suscriptores: suscriptor[];
    })): Promise<{
        suscriptoresAgregados: SuscriptoresSalasChat[];
        suscriptoresEliminados: SuscriptoresSalasChat[];
    }>;
    updateRoom(idSala: string, data: salasChat): Promise<SalasChat>;
    deleteRoom(idSala: string): Promise<{
        message: string;
        suscriptores: SuscriptoresSalasChat[];
    }>;
    createSubscriptor(data: suscriptor[]): Promise<(suscriptor & SuscriptoresSalasChat)[]>;
}
