"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const MensajesChat_entity_1 = require("../entities/MensajesChat.entity");
const SalasChat_entity_1 = require("../entities/SalasChat.entity");
const SuscriptoresSalasChat_entity_1 = require("../entities/SuscriptoresSalasChat.entity");
const realtime_1 = require("../modules/realtime");
const typeorm_2 = require("typeorm");
let ChatService = class ChatService {
    constructor(mensajesChatRepository, salasSubcritas, suscriptoresChats, socketRegistryService) {
        this.mensajesChatRepository = mensajesChatRepository;
        this.salasSubcritas = salasSubcritas;
        this.suscriptoresChats = suscriptoresChats;
        this.socketRegistryService = socketRegistryService;
    }
    async usersConected(data) {
        return { userId: data.userId, userName: data.userName };
    }
    async removeClientConnected(id_client) {
        return await this.socketRegistryService.removeSocket(id_client);
    }
    async searchClientsConnected(userIds) {
        return await this.socketRegistryService.getUsersSockets(userIds, 'chat');
    }
    async obtenerSalasSuscritas(id_user, salasActuales) {
        if (salasActuales.length == 0) {
            salasActuales = [''];
        }
        return await this.suscriptoresChats
            .createQueryBuilder("suscripciones")
            .leftJoinAndSelect("suscripciones.salas", "salas")
            .leftJoin(qb => qb
            .select("mensajes.id_sala", "id_sala")
            .addSelect("MAX(mensajes.fecha_creacion)", "ultima_fecha_mensaje")
            .from("mensajes_chat", "mensajes")
            .groupBy("mensajes.id_sala"), "ultimoMensaje", 'ultimoMensaje.id_sala = suscripciones.id_sala')
            .where('suscripciones.id_user = :id_user', { id_user })
            .andWhere('suscripciones.id_sala NOT IN (:...salasActuales)', { salasActuales })
            .andWhere('suscripciones.fecha_eliminacion IS NULL')
            .addOrderBy('ultimoMensaje.ultima_fecha_mensaje', 'DESC')
            .getMany();
    }
    async obtenerMensajesSala(id_sala) {
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
        return await this.mensajesChatRepository.find({
            where: {
                id_sala: id_sala,
                fecha_creacion: (0, typeorm_2.MoreThanOrEqual)(twoMonthsAgo)
            },
            order: {
                fecha_creacion: 'ASC'
            }
        });
    }
    async consultarInfoSala(id_sala) {
        return await this.salasSubcritas.find({ where: { id_sala: id_sala } });
    }
    async getRoomSubscribers(id_sala) {
        return await this.suscriptoresChats.createQueryBuilder('s')
            .select(['s.id_user AS id_user'])
            .where('s.id_sala = :id_sala', { id_sala })
            .andWhere('s.fecha_eliminacion IS NULL')
            .getRawMany();
    }
    async getActiveSubscribers(id_sala) {
        return await this.suscriptoresChats.find({
            where: { id_sala, fecha_eliminacion: (0, typeorm_2.IsNull)() },
        });
    }
    async createMensaje(mensaje) {
        const message = await this.mensajesChatRepository.save(mensaje);
        return message;
    }
    async updateMessagesToRead(id_sala, id_user) {
        try {
            const update = await this.suscriptoresChats
                .createQueryBuilder()
                .update(SuscriptoresSalasChat_entity_1.SuscriptoresSalasChat)
                .set({ mensajes_por_leer: () => `mensajes_por_leer + 1` })
                .where('id_sala = :idSala', { idSala: id_sala })
                .andWhere('id_user != :idUser', { idUser: id_user })
                .execute();
        }
        catch (error) {
            console.error('No fue posible actualizar cantidad mensajes', error);
        }
    }
    async updateMessagesAsRead(roomId, subscriberId) {
        try {
            const update = await this.suscriptoresChats
                .createQueryBuilder()
                .update(SuscriptoresSalasChat_entity_1.SuscriptoresSalasChat)
                .set({ mensajes_por_leer: 0 })
                .where('id_sala = :idSala', { idSala: roomId })
                .andWhere('id_user = :idUser', { idUser: subscriberId })
                .execute();
        }
        catch (error) {
            console.error('NO FUE POSIBLE ACTUALIZAR A CERO LA LISTA DE MENSAJES PENDINETES POR LEER', error);
        }
    }
    async getMessagesToRead(id_sala, id_user) {
        return (await this.suscriptoresChats.findOne({ where: { id_sala: id_sala, id_user: id_user }, select: ['mensajes_por_leer'] })).mensajes_por_leer;
    }
    async validarSala(nombre_salas) {
        return await this.salasSubcritas
            .createQueryBuilder('salas')
            .where('salas.nombre_sala IN (:...nombre_salas)', { nombre_salas: nombre_salas })
            .getMany();
    }
    async createSala(data) {
        const [existingRoom] = await this.validarSala([data.nombre_sala]);
        const isGroup = data.tipo === 2;
        if (existingRoom && !isGroup && existingRoom.tipo !== 2) {
            const subscribers = await this.ensureSubscribers(existingRoom.id_sala, data.nombre_sala, data.suscriptores);
            return { type: "response", message: 'Sala existente reutilizada', data: { tipo_sala: existingRoom.tipo, subscribers } };
        }
        if (existingRoom) {
            return { type: "warning", message: 'esta sala ya esta creada', data: { tipo_sala: null, subscribers: [] } };
        }
        const sala = await this.salasSubcritas.save(data).then((resultado) => {
            this.idSala = resultado.id_sala;
            return resultado;
        });
        let dataSubs = [];
        if (data.suscriptores.length) {
            const subs = data.suscriptores.map((susc) => ({ ...susc, id_sala: this.idSala, id_suscriptor: susc.id_user, mensajes_por_leer: 0 }));
            dataSubs = await this.createSubscriptor(subs);
        }
        return { type: "response", message: 'Creación exitosa', data: { tipo_sala: sala.tipo, subscribers: dataSubs } };
    }
    async ensureSubscribers(id_sala, nombre_sala, subscribers = []) {
        const result = [];
        for (const susc of subscribers) {
            const existente = await this.suscriptoresChats.findOne({ where: { id_sala, id_user: susc.id_user } });
            if (existente) {
                if (existente.fecha_eliminacion) {
                    await this.suscriptoresChats.createQueryBuilder()
                        .update()
                        .set({ fecha_eliminacion: () => 'NULL' })
                        .where('id_sala = :id_sala AND id_user = :id_user', { id_sala, id_user: susc.id_user })
                        .execute();
                    existente.fecha_eliminacion = null;
                }
                result.push(existente);
                continue;
            }
            result.push(await this.suscriptoresChats.save(this.suscriptoresChats.create({
                id_user: susc.id_user,
                id_sala,
                nombre_sala: susc.nombre_sala || nombre_sala,
                imagen_sala: susc.imagen_sala || 'unknown.webp',
                mensajes_por_leer: 0,
            })));
        }
        return result;
    }
    async updateSubscribers(idSala, data) {
        try {
            const nuevosSuscriptores = data.suscriptores || [];
            const suscriptoresActuales = await this.suscriptoresChats.find({
                where: { id_sala: idSala },
            });
            const idsNuevos = new Set(nuevosSuscriptores.map(s => s.id_user));
            const suscriptoresAEliminar = suscriptoresActuales.filter(s => !idsNuevos.has(s.id_user) && s.fecha_eliminacion === null);
            const suscriptoresAInsertar = [];
            nuevosSuscriptores.forEach(s => {
                const existente = suscriptoresActuales.find(sa => sa.id_user === s.id_user);
                if (!existente) {
                    suscriptoresAInsertar.push(s);
                }
                else if (existente.fecha_eliminacion !== null) {
                    suscriptoresAInsertar.push({ ...s, restaurar: true });
                }
            });
            if (suscriptoresAEliminar.length > 0) {
                const idsAEliminar = suscriptoresAEliminar.map(s => s.id_user);
                await this.suscriptoresChats.createQueryBuilder()
                    .update()
                    .set({ fecha_eliminacion: () => 'CURRENT_TIMESTAMP' })
                    .where('id_sala = :idSala', { idSala })
                    .andWhere('id_user IN (:...idsAEliminar)', { idsAEliminar })
                    .execute();
            }
            let newSubscribers = [];
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
                const restaurar = suscriptoresAInsertar.filter(s => s.restaurar);
                for (const s of restaurar) {
                    await this.suscriptoresChats.createQueryBuilder()
                        .update()
                        .set({ fecha_eliminacion: null })
                        .where('id_sala = :idSala AND id_user = :idUser', { idSala, idUser: s.id_user })
                        .execute();
                }
            }
            if (data.nombre_sala) {
                await this.suscriptoresChats.createQueryBuilder()
                    .update()
                    .set({ nombre_sala: data.nombre_sala })
                    .where('id_sala = :idSala', { idSala })
                    .andWhere('fecha_eliminacion IS NULL')
                    .execute();
            }
            return {
                suscriptoresAgregados: newSubscribers,
                suscriptoresEliminados: suscriptoresAEliminar
            };
        }
        catch (error) {
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
    async updateRoom(idSala, data) {
        const sala = await this.salasSubcritas.findOne({ where: { id_sala: idSala } });
        if (!sala) {
            throw new common_1.NotFoundException(`No se encontró la sala con id: ${idSala}`);
        }
        if (data.nombre_sala !== undefined)
            sala.nombre_sala = data.nombre_sala;
        if (data.creador !== undefined)
            sala.creador = data.creador;
        return await this.salasSubcritas.save(sala);
    }
    async deleteRoom(idSala) {
        const sala = await this.salasSubcritas.findOne({ where: { id_sala: idSala } });
        if (!sala) {
            throw new common_1.NotFoundException(`No se encontró la sala con id: ${idSala}`);
        }
        const suscriptores = await this.suscriptoresChats.find({ where: { id_sala: idSala } });
        await this.suscriptoresChats.delete({ id_sala: idSala });
        await this.salasSubcritas.delete(sala);
        return { message: `Chat con id ${idSala} eliminado correctamente.`, suscriptores };
    }
    async createSubscriptor(data) {
        return await this.suscriptoresChats.save(data);
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(MensajesChat_entity_1.MensajesChat)),
    __param(1, (0, typeorm_1.InjectRepository)(SalasChat_entity_1.SalasChat)),
    __param(2, (0, typeorm_1.InjectRepository)(SuscriptoresSalasChat_entity_1.SuscriptoresSalasChat)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        realtime_1.SocketRegistryService])
], ChatService);
//# sourceMappingURL=chat.service.js.map