import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MensajesChat } from 'src/entities/MensajesChat.entity';
import { SalasChat } from 'src/entities/SalasChat.entity';
import { SuscriptoresSalasChat } from 'src/entities/SuscriptoresSalasChat.entity';
import { UserConected } from 'src/entities/UserConected.entity';
import { Repository } from 'typeorm';
import { IMessageSaveStructure, salasChat, suscriptor } from './interfaces/chat/chat.interface';

@Injectable()
export class ChatService {
    idSala: any;
    constructor(
        @InjectRepository(MensajesChat)
        private mensajesChatRepository: Repository<MensajesChat>,
        @InjectRepository(SalasChat)
        private salasSubcritas: Repository<SalasChat>,
        @InjectRepository(SuscriptoresSalasChat)
        private suscriptoresChats: Repository<SuscriptoresSalasChat>,
        @InjectRepository(UserConected)
        private conectedUsers: Repository<UserConected>,
    ) { }

    async usersConected(data: { userId: string, userName: string, client?: any }) {
        const userConected = this.conectedUsers.create(data);
        return await this.conectedUsers.save(userConected);
    }

    async removeClientConnected(id_client: string): Promise<any> {
        const dato = await this.conectedUsers
            .createQueryBuilder('user')
            .where("JSON_EXTRACT(client, '$.id') = :clientId", { clientId: id_client })
            .getMany();

        const deleted = this.conectedUsers
            .createQueryBuilder()
            .delete()
            .where("JSON_EXTRACT(client, '$.id') = :clientId", { clientId: id_client })
            .execute();
        return deleted;
    }

    async searchClientsConnected(userIds: string[]) {
        return await this.conectedUsers
            .createQueryBuilder()
            .where('userId IN (:...userIds)', { userIds })
            .getMany();
    }

    async searchClientsConnectedByUserName(userNames: string[]) {
        return await this.conectedUsers
            .createQueryBuilder()
            .where('userName IN (:...userNames)', { userNames })
            .getMany();
    }

    async obtenerSalasSuscritas(id_user: string, salasActuales: string[]): Promise<SuscriptoresSalasChat[]> {

        if (salasActuales.length == 0) { salasActuales = [''] }
        return await this.suscriptoresChats
            .createQueryBuilder("suscripciones")
            .where('suscripciones.id_user = :id_user', { id_user })
            .andWhere('suscripciones.id_sala NOT IN (:...salasActuales)', { salasActuales })
            .orderBy('suscripciones.fecha_suscripcion', 'DESC')
            .leftJoinAndSelect("suscripciones.salas", "salas")
            .getMany();
    }

    async obtenerMensajesSala(id_sala: string) {
        return await this.mensajesChatRepository.find({
            where: { id_sala: id_sala }, order: {
                fecha_creacion: 'ASC'
            }
        })
    }
    async consultarInfoSala(id_sala: string) {
        return await this.salasSubcritas.find({ where: { id_sala: id_sala } })
    }

    /**
     * Obtiene la lista (id_usuario) de subscritores de una sala mediante el id_sala
     * @param id_sala 
     * @returns 
     */
    async getRoomSubscribers(id_sala: string): Promise<{ id_user: string }[]> {
        return await this.suscriptoresChats.find({ where: { id_sala: id_sala }, select: ['id_user'] });
    }

    async createMensaje(mensaje: IMessageSaveStructure): Promise<any> {
        const message = await this.mensajesChatRepository.save(mensaje)

        return message;
    }

    async updateMessagesToRead(id_sala: string, id_user: string): Promise<any> {
        try {
            const update = await this.suscriptoresChats
                .createQueryBuilder()
                .update(SuscriptoresSalasChat)
                .set({ mensajes_por_leer: () => `mensajes_por_leer + 1` })
                .where('id_sala = :idSala', { idSala: id_sala })
                .andWhere('id_user != :idUser', { idUser: id_user })
                .execute();
        } catch (error) {
            console.error('No fue posible actualizar cantidad mensajes', error);
        }
    }

    async updateMessagesAsRead(roomId: string, subscriberId: string): Promise<any> {
        try {
            const update = await this.suscriptoresChats
                .createQueryBuilder()
                .update(SuscriptoresSalasChat)
                .set({ mensajes_por_leer: 0 })
                .where('id_sala = :idSala', { idSala: roomId })
                .andWhere('id_user = :idUser', { idUser: subscriberId })
                .execute();
        } catch (error) {
            console.error('NO FUE POSIBLE ACTUALIZAR A CERO LA LISTA DE MENSAJES PENDINETES POR LEER', error);
        }
    }

    async getMessagesToRead(id_sala: string, id_user: string): Promise<any> {
        return (await this.suscriptoresChats.findOne({ where: { id_sala: id_sala, id_user: id_user }, select: ['mensajes_por_leer'] })).mensajes_por_leer;
    }

    async validarSala(nombre_salas: string[]): Promise<salasChat[]> {
        return await this.salasSubcritas
            .createQueryBuilder('salas')
            .where('salas.nombre_sala IN (:...nombre_salas)', { nombre_salas: nombre_salas })
            .getMany();
    }

    async createSala(data: (salasChat & { suscriptores: suscriptor[] })) {
        const salaValidate = await this.validarSala([data.nombre_sala]).then(async res => {
            return !!res.length;
        });
        if (salaValidate) {
            return { type: "warning", message: 'esta sala ya esta creada', data: { tipo_sala: null, subscribers: [] } };
        }
        const sala = await this.salasSubcritas.save(data).then((resultado) => {
            this.idSala = resultado.id_sala
            return resultado;
        });

        let dataSubs = [];

        if (data.suscriptores.length) {
            const subs = data.suscriptores.map((susc: suscriptor) => ({ ...susc, id_sala: this.idSala, id_suscriptor: susc.id_user, mensajes_por_leer: 0 }));
            dataSubs = await this.createSubscriptor(subs);
        }

        return { type: "response", message: 'Creación exitosa', data: { tipo_sala: sala.tipo, subscribers: dataSubs } };
    }

    /**
     * Método para actualizar los suscriptores de una sala de acuerdo con el id de la sala
     * @param idSala string
     * @param data '{ nombre_sala: string; suscriptores: suscriptor[] }'
     */
    async updateSubscribers(idSala: string, data: (salasChat & { suscriptores: suscriptor[] })) {
        const nuevosSuscriptores = data.suscriptores || [];

        // Obtener los suscriptores actuales de la sala
        const suscriptoresActuales = await this.suscriptoresChats.find({
            where: { id_sala: idSala },
        });

        const idsActuales = new Set(suscriptoresActuales.map(s => s.id_user));
        const idsNuevos = new Set(nuevosSuscriptores.map(s => s.id_user));

        // Identificar suscriptores a eliminar
        const suscriptoresAEliminar = suscriptoresActuales.filter(
            s => !idsNuevos.has(s.id_user)
        );

        // Identificar suscriptores a insertar
        const suscriptoresAInsertar = nuevosSuscriptores.filter(
            s => !idsActuales.has(s.id_user)
        );

        // Eliminar los que ya no están
        if (suscriptoresAEliminar.length > 0) {
            const queryBuilder = this.suscriptoresChats.createQueryBuilder().delete();

            suscriptoresAEliminar.forEach((s, index) => {
                const condition = `(id_user = :id_user${index} AND id_sala = :id_sala${index})`;
                if (index === 0) {
                    queryBuilder.where(condition, {
                    [`id_user${index}`]: s.id_user,
                    [`id_sala${index}`]: idSala
                    });
                } else {
                    queryBuilder.orWhere(condition, {
                    [`id_user${index}`]: s.id_user,
                    [`id_sala${index}`]: idSala
                    });
                }
            });

            await queryBuilder.execute();
        }

        let newSubscribers: SuscriptoresSalasChat[] = [];

        // Insertar nuevos suscriptores
        if (suscriptoresAInsertar.length > 0) {
            const nuevosRegistros = suscriptoresAInsertar.map(s => this.suscriptoresChats.create({
                id_user: s.id_user,
                id_sala: idSala,
                nombre_sala: data.nombre_sala,
                imagen_sala: s.imagen_sala || 'unknown.webp',
                mensajes_por_leer: 0
                // fecha_suscripcion se asigna automáticamente
            }));

            newSubscribers = await this.suscriptoresChats.save(nuevosRegistros);
        }

        return {
            suscriptoresAgregados: newSubscribers,
            suscriptoresEliminados: suscriptoresAEliminar.map(s => s.id_user)
        }
    }

    /**
     * Método para actualizar un sala de acuerdo con su id
     * @param idSala string
     * @param data SalasChat
     * @returns 
     */
    async updateRoom(idSala: string, data: salasChat) {
        // Primero buscamos la sala
        const sala = await this.salasSubcritas.findOne({ where: { id_sala: idSala } });

        if (!sala) {
            throw new NotFoundException(`No se encontró la sala con id: ${idSala}`);
        }

        // Actualizamos campos permitidos (sin tocar fecha_creacion)
        if (data.nombre_sala !== undefined) sala.nombre_sala = data.nombre_sala;
        if (data.creador !== undefined) sala.creador = data.creador;

        // Guardamos los cambios
        return await this.salasSubcritas.save(sala);
    }

    /**
     * Permite agregar un suscriptor a una sala
     * @param data 
     * @returns 
     */
    async createSubscriptor(data: suscriptor[]) {
        return await this.suscriptoresChats.save(data);
    }
}
