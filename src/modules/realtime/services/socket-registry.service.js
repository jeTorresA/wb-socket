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
exports.SocketRegistryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const UserConected_entity_1 = require("../../../entities/UserConected.entity");
let SocketRegistryService = class SocketRegistryService {
    constructor(userConectedRepository) {
        this.userConectedRepository = userConectedRepository;
    }
    async registerSocket(client, userId, userName, namespace, clientData) {
        const userRoom = `user:${userId}`;
        if (!client.rooms.has(userRoom)) {
            client.join(userRoom);
        }
        const userConected = this.userConectedRepository.create({
            userId,
            userName,
            namespace,
            client: {
                id: client.id,
                ...clientData,
            },
        });
        return await this.userConectedRepository.save(userConected);
    }
    async removeSocket(socketId) {
        const result = await this.userConectedRepository
            .createQueryBuilder()
            .delete()
            .from(UserConected_entity_1.UserConected)
            .where("JSON_EXTRACT(client, '$.id') = :socketId", { socketId })
            .execute();
        return result.affected > 0;
    }
    async getUserSockets(userId, namespace) {
        return await this.userConectedRepository.find({
            where: {
                userId,
                namespace,
            },
        });
    }
    async getUsersSockets(userIds, namespace) {
        if (userIds.length === 0)
            return [];
        return await this.userConectedRepository
            .createQueryBuilder('uc')
            .where('uc.userId IN (:...userIds)', { userIds })
            .andWhere('uc.namespace = :namespace', { namespace })
            .getMany();
    }
    async isSocketRegistered(socketId) {
        const count = await this.userConectedRepository
            .createQueryBuilder('uc')
            .where("JSON_EXTRACT(uc.client, '$.id') = :socketId", { socketId })
            .getCount();
        return count > 0;
    }
};
exports.SocketRegistryService = SocketRegistryService;
exports.SocketRegistryService = SocketRegistryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(UserConected_entity_1.UserConected)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SocketRegistryService);
//# sourceMappingURL=socket-registry.service.js.map