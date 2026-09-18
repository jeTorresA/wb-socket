"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const files_module_1 = require("./files/files.module");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const chat_module_1 = require("./chat/chat.module");
const notifications_module_1 = require("./notifications/notifications.module");
const realtime_1 = require("./modules/realtime");
const platform_express_1 = require("@nestjs/platform-express");
const serve_static_1 = require("@nestjs/serve-static");
const path_1 = require("path");
const api_controller_1 = require("./api/api.controller");
const data_source_1 = require("../db/data-source");
const rooms_controller_1 = require("./api/rooms.controller");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            chat_module_1.ChatModule,
            notifications_module_1.NotificationsModule,
            files_module_1.FilesModule,
            realtime_1.RealtimeModule,
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            typeorm_1.TypeOrmModule.forRoot({
                ...data_source_1.dataBaseOptions,
                synchronize: process.env.NODE_ENV === 'development',
                autoLoadEntities: process.env.NODE_ENV === 'development',
            }),
            platform_express_1.MulterModule.register({
                dest: '../public/uploads',
            }),
            serve_static_1.ServeStaticModule.forRoot({ rootPath: (0, path_1.join)(process.cwd(), 'client'), }),
        ],
        controllers: [app_controller_1.AppController, api_controller_1.ApiController, rooms_controller_1.RoomsController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map