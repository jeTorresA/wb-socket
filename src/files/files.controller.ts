import { Controller, Post, Get, UploadedFile, UseInterceptors, Query, Res, HttpStatus, Param, NotFoundException, InternalServerErrorException, Header } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { extname } from 'path';
import * as fs from 'fs';
import { Response } from 'express';
import { UtilitiesFunctions } from 'src/utilities/UtilitiesFunctions';
import { execFileSync } from 'child_process';

@Controller('files')
export class FilesController {
    @Post('upload')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './public/uploads',
            filename: (req, file, cb) => {
                const uniqueFileName = UtilitiesFunctions.generateHexString(12);
                const ext = extname(file.originalname); // Extraer la extensión
                file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8')
                cb(null, `${file.fieldname}-${uniqueFileName}${ext}`);
            },
        }),
    }))
    async uploadFile(@UploadedFile() file: Express.Multer.File, @Res() res: Response) {
        return res.status(200).json({ status: true, message: [{ nombre_archivo: file.originalname, nombre_guardado: file.filename, ubicacion: 'uploads', mime_type: file.mimetype }] });
    }
    @Get('getfile')
    async getFile(@Query('fileName') fileName: string, @Query('location') location: string, @Res() res: Response) {
        try {
            if (!fileName || !location) {
                return res.status(HttpStatus.BAD_REQUEST).json({
                    status: false,
                    message: 'Faltan parámetros en la solicitud.',
                });
            }

            const folderPath = path.join(process.cwd(), 'public', location)
            const filePath = path.join(folderPath, fileName);

            if (fs.existsSync(filePath)) {
                res.set({
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'Content-Disposition': `attachment; filename=${fileName}`,
                    'Access-Control-Expose-Headers': 'Content-Disposition'
                });

                // Enviar el archivo
                return res.status(HttpStatus.OK).download(filePath, fileName);
            } else {
                res.status(HttpStatus.NOT_FOUND).json({
                    status: false,
                    message: 'Archivo no encontrado.'
                });
            }
        } catch (error) {
            console.error('Error al procesar solicitud de descarga de archivo en chat ' + error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                status: false,
                message: 'Ocurrió un error al porcesar la solicitud.'
            });
        }
    }
    @Get('getfile/:directory/:filename')
    getFileStream(@Param('directory') directory: string, @Param('filename') filename: string, @Res() res: Response) {
        try{
            const filePath = path.join(process.cwd(), 'public', directory, filename);
            if(!fs.existsSync(filePath)) {
                throw new NotFoundException('El archivo no existe.');
            }

            const fileStream = fs.createReadStream(filePath);
            fileStream.on('error', (err) => {
                throw new InternalServerErrorException('Error al leer el archivo');
            })
    
            fileStream.pipe(res); // Enviar el archivo
        } catch(error) {
            if(error instanceof NotFoundException) {
                throw error;
            } else {
                throw new InternalServerErrorException('Ocurrió un error al intentar acceder al archivo');
            }
        }
    }

    @Get('blob/:directory/:filename')
    @Header('Content-Type', 'application/octet-stream')
    @Header('Content-Disposition', 'inline')
    async getFileAsBlob(
        @Param('directory') directory: string,
        @Param('filename') filename: string,
        @Res() res: Response
    ) {
        try {
            const filePath = path.join(process.cwd(), 'public', directory, filename);
            
            if (!fs.existsSync(filePath)) {
                throw new NotFoundException('El archivo no existe.');
            }

            // Leer el archivo como buffer
            const fileBuffer = fs.readFileSync(filePath);
            
            // Obtener información del archivo
            const fileStats = fs.statSync(filePath);
            const mimeType = this.getMimeType(filename);

            // Configurar headers apropiados
            res.set({
                'Content-Type': mimeType,
                'Content-Length': fileStats.size.toString(),
                'Content-Disposition': `inline; filename="${filename}"`,
                'Cache-Control': 'no-cache'
            });

            // Enviar el blob
            return res.send(fileBuffer);

        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            } else {
                console.error('Error al obtener archivo como blob:', error);
                throw new InternalServerErrorException('Ocurrió un error al intentar acceder al archivo');
            }
        }
    }

    @Get('blob')
    @Header('Content-Type', 'application/octet-stream')
    @Header('Content-Disposition', 'inline')
    async getFileAsBlobByQuery(
        @Query('fileName') fileName: string,
        @Query('location') location: string,
        @Res() res: Response
    ) {
        try {
            if (!fileName || !location) {
                return res.status(HttpStatus.BAD_REQUEST).json({
                    status: false,
                    message: 'Faltan parámetros en la solicitud.',
                });
            }

            const filePath = path.join(process.cwd(), 'public', location, fileName);
            
            if (!fs.existsSync(filePath)) {
                throw new NotFoundException('El archivo no existe.');
            }

            // Leer el archivo como buffer
            const fileBuffer = fs.readFileSync(filePath);
            
            // Obtener información del archivo
            const fileStats = fs.statSync(filePath);
            const mimeType = this.getMimeType(fileName);

            // Configurar headers para evitar descarga forzada
            res.set({
                'Content-Type': mimeType,
                'Content-Length': fileStats.size.toString(),
                'Content-Disposition': `inline; filename="${fileName}"`,
                'Cache-Control': 'no-cache',
                'Access-Control-Expose-Headers': 'Content-Disposition'
            });

            // Enviar el blob
            return res.send(fileBuffer);

        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            } else {
                console.error('Error al obtener archivo como blob:', error);
                throw new InternalServerErrorException('Ocurrió un error al intentar acceder al archivo');
            }
        }
    }

    /**
     * Método auxiliar para determinar el MIME type basado en la extensión del archivo
     */
    private getMimeType(filename: string): string {
        const ext = path.extname(filename).toLowerCase();
        
        const mimeTypes: { [key: string]: string } = {
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
}
