import { Controller, Post, Get, UploadedFile, UseInterceptors, Query, Res, HttpStatus, Param, NotFoundException, InternalServerErrorException } from '@nestjs/common';
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
}
