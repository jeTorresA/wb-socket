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
exports.FilesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path = require("path");
const path_1 = require("path");
const fs = require("fs");
const UtilitiesFunctions_1 = require("../utilities/UtilitiesFunctions");
let FilesController = class FilesController {
    async uploadFile(file, res) {
        return res.status(200).json({ status: true, message: [{ nombre_archivo: file.originalname, nombre_guardado: file.filename, ubicacion: 'uploads', mime_type: file.mimetype }] });
    }
    async getFile(fileName, location, res) {
        try {
            if (!fileName || !location) {
                return res.status(common_1.HttpStatus.BAD_REQUEST).json({
                    status: false,
                    message: 'Faltan parámetros en la solicitud.',
                });
            }
            const folderPath = path.join(process.cwd(), 'public', location);
            const filePath = path.join(folderPath, fileName);
            if (fs.existsSync(filePath)) {
                res.set({
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'Content-Disposition': `attachment; filename=${fileName}`,
                    'Access-Control-Expose-Headers': 'Content-Disposition'
                });
                return res.status(common_1.HttpStatus.OK).download(filePath, fileName);
            }
            else {
                res.status(common_1.HttpStatus.NOT_FOUND).json({
                    status: false,
                    message: 'Archivo no encontrado.'
                });
            }
        }
        catch (error) {
            console.error('Error al procesar solicitud de descarga de archivo en chat ' + error);
            res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                status: false,
                message: 'Ocurrió un error al porcesar la solicitud.'
            });
        }
    }
    getFileStream(directory, filename, res) {
        try {
            const filePath = path.join(process.cwd(), 'public', directory, filename);
            if (!fs.existsSync(filePath)) {
                throw new common_1.NotFoundException('El archivo no existe.');
            }
            const fileStream = fs.createReadStream(filePath);
            fileStream.on('error', (err) => {
                throw new common_1.InternalServerErrorException('Error al leer el archivo');
            });
            fileStream.pipe(res);
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            else {
                throw new common_1.InternalServerErrorException('Ocurrió un error al intentar acceder al archivo');
            }
        }
    }
    async getFileAsBlob(directory, filename, res) {
        try {
            const filePath = path.join(process.cwd(), 'public', directory, filename);
            if (!fs.existsSync(filePath)) {
                throw new common_1.NotFoundException('El archivo no existe.');
            }
            const fileBuffer = fs.readFileSync(filePath);
            const fileStats = fs.statSync(filePath);
            const mimeType = this.getMimeType(filename);
            res.set({
                'Content-Type': mimeType,
                'Content-Length': fileStats.size.toString(),
                'Content-Disposition': `inline; filename="${filename}"`,
                'Cache-Control': 'no-cache'
            });
            return res.send(fileBuffer);
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            else {
                console.error('Error al obtener archivo como blob:', error);
                throw new common_1.InternalServerErrorException('Ocurrió un error al intentar acceder al archivo');
            }
        }
    }
    async getFileAsBlobByQuery(fileName, location, res) {
        try {
            if (!fileName || !location) {
                return res.status(common_1.HttpStatus.BAD_REQUEST).json({
                    status: false,
                    message: 'Faltan parámetros en la solicitud.',
                });
            }
            const filePath = path.join(process.cwd(), 'public', location, fileName);
            if (!fs.existsSync(filePath)) {
                throw new common_1.NotFoundException('El archivo no existe.');
            }
            const fileBuffer = fs.readFileSync(filePath);
            const fileStats = fs.statSync(filePath);
            const mimeType = this.getMimeType(fileName);
            res.set({
                'Content-Type': mimeType,
                'Content-Length': fileStats.size.toString(),
                'Content-Disposition': `inline; filename="${fileName}"`,
                'Cache-Control': 'no-cache',
                'Access-Control-Expose-Headers': 'Content-Disposition'
            });
            return res.send(fileBuffer);
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            else {
                console.error('Error al obtener archivo como blob:', error);
                throw new common_1.InternalServerErrorException('Ocurrió un error al intentar acceder al archivo');
            }
        }
    }
    getMimeType(filename) {
        const ext = path.extname(filename).toLowerCase();
        const mimeTypes = {
            '.pdf': 'application/pdf',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.txt': 'text/plain',
            '.html': 'text/html',
            '.json': 'application/json',
            '.xml': 'application/xml',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.xls': 'application/vnd.ms-excel',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.doc': 'application/msword',
            '.ppt': 'application/vnd.ms-powerpoint',
            '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }
};
exports.FilesController = FilesController;
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './public/uploads',
            filename: (req, file, cb) => {
                const uniqueFileName = UtilitiesFunctions_1.UtilitiesFunctions.generateHexString(12);
                const ext = (0, path_1.extname)(file.originalname);
                file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
                cb(null, `${file.fieldname}-${uniqueFileName}${ext}`);
            },
        }),
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "uploadFile", null);
__decorate([
    (0, common_1.Get)('getfile'),
    __param(0, (0, common_1.Query)('fileName')),
    __param(1, (0, common_1.Query)('location')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "getFile", null);
__decorate([
    (0, common_1.Get)('getfile/:directory/:filename'),
    __param(0, (0, common_1.Param)('directory')),
    __param(1, (0, common_1.Param)('filename')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], FilesController.prototype, "getFileStream", null);
__decorate([
    (0, common_1.Get)('blob/:directory/:filename'),
    (0, common_1.Header)('Content-Type', 'application/octet-stream'),
    (0, common_1.Header)('Content-Disposition', 'inline'),
    __param(0, (0, common_1.Param)('directory')),
    __param(1, (0, common_1.Param)('filename')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "getFileAsBlob", null);
__decorate([
    (0, common_1.Get)('blob'),
    (0, common_1.Header)('Content-Type', 'application/octet-stream'),
    (0, common_1.Header)('Content-Disposition', 'inline'),
    __param(0, (0, common_1.Query)('fileName')),
    __param(1, (0, common_1.Query)('location')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "getFileAsBlobByQuery", null);
exports.FilesController = FilesController = __decorate([
    (0, common_1.Controller)('files')
], FilesController);
//# sourceMappingURL=files.controller.js.map