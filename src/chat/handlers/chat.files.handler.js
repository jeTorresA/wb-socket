"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatFilesHandler = void 0;
const common_1 = require("@nestjs/common");
const path = require("path");
const fs = require("fs");
const fsp = require("fs/promises");
const UtilitiesFunctions_1 = require("../../utilities/UtilitiesFunctions");
let ChatFilesHandler = class ChatFilesHandler {
    async handleGetFile(client, data) {
        const folderPath = path.join(__dirname, '..', '..', '..', 'public', data.location);
        const filePath = path.join(folderPath, data.fileName);
        try {
            const fileBuffer = await fsp.readFile(filePath);
            client.emit('getFileSuccess', {
                fileName: data.fileName,
                data: fileBuffer.toString('base64'),
            });
        }
        catch (error) {
            console.error('Error al leer el archivo: ', error);
            client.emit('getFileError', { message: 'Error al obtener el archivo.' });
        }
    }
    uploadFile(file, fileName, fileMimeType) {
        const buffer = Buffer.from(file);
        const uniqueFileName = UtilitiesFunctions_1.UtilitiesFunctions.generateHexString(12);
        const uploadDir = path.join(__dirname, '..', '..', '..', 'public', 'uploads');
        const fileNameSaved = `${uniqueFileName}_${fileName}`;
        const uploadFile = path.join(uploadDir, fileNameSaved);
        try {
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 });
            }
            fs.writeFileSync(uploadFile, buffer);
            return {
                status: true,
                fileName: fileNameSaved,
                fileLocation: 'uploads',
                mimeType: fileMimeType,
            };
        }
        catch (error) {
            console.error('Error al cargar el archivo ', error);
            return { status: false, fileName: null, fileLocation: null, mimeType: null };
        }
    }
};
exports.ChatFilesHandler = ChatFilesHandler;
exports.ChatFilesHandler = ChatFilesHandler = __decorate([
    (0, common_1.Injectable)()
], ChatFilesHandler);
//# sourceMappingURL=chat.files.handler.js.map