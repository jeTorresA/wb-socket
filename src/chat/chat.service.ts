import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MensajesChat } from 'src/entities/MensajesChat.entity';
import { SalasChat } from 'src/entities/SalasChat.entity';
import { SuscriptoresSalasChat } from 'src/entities/SuscriptoresSalasChat.entity';
import { UserConected } from 'src/entities/UserConected.entity';
import { MoreThanOrEqual, Repository } from 'typeorm';
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
            .leftJoinAndSelect("suscripciones.salas", "salas")
            .leftJoin(
                qb => qb
                    .select("mensajes.id_sala", "id_sala")
                    .addSelect("MAX(mensajes.fecha_creacion)", "ultima_fecha_mensaje")
                    .from("mensajes_chat", "mensajes")
                    .groupBy("mensajes.id_sala"),
                "ultimoMensaje",
                'ultimoMensaje.id_sala = suscripciones.id_sala'
            )
            .where('suscripciones.id_user = :id_user', { id_user })
            .andWhere('suscripciones.id_sala NOT IN (:...salasActuales)', { salasActuales })
            .andWhere('suscripciones.fecha_eliminacion IS NULL')
            .addOrderBy('ultimoMensaje.ultima_fecha_mensaje', 'DESC')
            .getMany();
    }

    /**
     * Método para obtener los mensajes de una sala de chat
     * Pero solo los mensajes de los últimos 2 meses
     * @param id_sala 
     * @returns 
     */
    async obtenerMensajesSala(id_sala: string) {
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

        return await this.mensajesChatRepository.find({
            where: {
                id_sala: id_sala,
                fecha_creacion: MoreThanOrEqual(twoMonthsAgo)
            },
            order: {
                fecha_creacion: 'ASC'
            }
        });
    }

    /**
     * Método para consultar la información de una sala de chat
     * @param id_sala 
     * @returns 
     */
    async consultarInfoSala(id_sala: string) {
        return await this.salasSubcritas.find({ where: { id_sala: id_sala } })
    }

    /**
     * Obtiene la lista (id_usuario) de subscritores de una sala mediante el id_sala
     * @param id_sala 
     * @returns 
     */
    async getRoomSubscribers(id_sala: string): Promise<{ id_user: string }[]> {
        return await this.suscriptoresChats.createQueryBuilder('s')
            .select(['s.id_user AS id_user'])
            .where('s.id_sala = :id_sala', { id_sala })
            .andWhere('s.fecha_eliminacion IS NULL')
            .getRawMany();
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
        try {
            const nuevosSuscriptores = data.suscriptores || [];

            // Obtener los suscriptores actuales de la sala
            const suscriptoresActuales = await this.suscriptoresChats.find({
                where: { id_sala: idSala },
            });

            const idsNuevos = new Set(nuevosSuscriptores.map(s => s.id_user));

            // Identificar suscriptores a eliminar (solo los activos)
            const suscriptoresAEliminar = suscriptoresActuales.filter(
                s => !idsNuevos.has(s.id_user) && s.fecha_eliminacion === null
            );

            // Identificar suscriptores a insertar o restaurar
            const suscriptoresAInsertar = [];
            nuevosSuscriptores.forEach(s => {
                const existente = suscriptoresActuales.find(sa => sa.id_user === s.id_user);
                if (!existente) {
                    suscriptoresAInsertar.push(s);
                } else if (existente.fecha_eliminacion !== null) {
                    // Restaurar suscriptor
                    suscriptoresAInsertar.push({ ...s, restaurar: true });
                }
            });

            // Soft delete: marcar fecha_eliminacion
            if (suscriptoresAEliminar.length > 0) {
                const idsAEliminar = suscriptoresAEliminar.map(s => s.id_user);
                await this.suscriptoresChats.createQueryBuilder()
                    .update()
                    .set({ fecha_eliminacion: () => 'CURRENT_TIMESTAMP' })
                    .where('id_sala = :idSala', { idSala })
                    .andWhere('id_user IN (:...idsAEliminar)', { idsAEliminar })
                    .execute();
            }

            let newSubscribers: SuscriptoresSalasChat[] = [];

            // Insertar nuevos suscriptores o restaurar
            if (suscriptoresAInsertar.length > 0) {
                const nuevosRegistros = suscriptoresAInsertar.filter(s => !s.restaurar).map(s => this.suscriptoresChats.create({
                    id_user: s.id_user,
                    id_sala: idSala,
                    nombre_sala: data.nombre_sala,
                    imagen_sala: s.imagen_sala || 'unknown.webp',
                    mensajes_por_leer: 0
                }));
                if (nuevosRegistros.length > 0) {
                    newSubscribers = await this.suscriptoresChats.save(nuevosRegistros);
                }
                // Restaurar suscriptores eliminados
                const restaurar = suscriptoresAInsertar.filter(s => s.restaurar);
                for (const s of restaurar) {
                    await this.suscriptoresChats.createQueryBuilder()
                        .update()
                        .set({ fecha_eliminacion: null })
                        .where('id_sala = :idSala AND id_user = :idUser', { idSala, idUser: s.id_user })
                        .execute();
                }
            }

            return {
                suscriptoresAgregados: newSubscribers,
                suscriptoresEliminados: suscriptoresAEliminar
            }
        } catch (error) {
            console.error('Error en updateSubscribers:', error.message);
            if (error.query) {
                console.error('SQL ejecutado:', error.query);
            }
            if (error.parameters) {
                console.error('Parámetros:', error.parameters);
            }
            throw error; 
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
     * Método para eliminar una sala de chat
     * @param idSala string
     */
    async deleteRoom(idSala: string) {
        // Primero buscamos la sala
        const sala = await this.salasSubcritas.findOne({ where: { id_sala: idSala } });

        if (!sala) {
            throw new NotFoundException(`No se encontró la sala con id: ${idSala}`);
        }

        // Eliminamos la sala y sus suscriptores asociados
        const suscriptores = await this.suscriptoresChats.find({ where: { id_sala: idSala } });
        await this.suscriptoresChats.delete({ id_sala: idSala });
        await this.salasSubcritas.delete(sala);
        return { message: `Chat con id ${idSala} eliminado correctamente.`, suscriptores };
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
