import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import * as path from 'path';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import { UtilitiesFunctions } from 'src/utilities/UtilitiesFunctions';

/**
 * Handler especializado para gestión de archivos
 */
@Injectable()
export class ChatFilesHandler {
  async handleGetFile(client: Socket, data: { fileName: string; location: string }) {
    const folderPath = path.join(__dirname, '..', '..', '..', 'public', data.location);
    const filePath = path.join(folderPath, data.fileName);

    try {
      const fileBuffer = await fsp.readFile(filePath);
      client.emit('getFileSuccess', {
        fileName: data.fileName,
        data: fileBuffer.toString('base64'),
      });
    } catch (error) {
      console.error('Error al leer el archivo: ', error);
      client.emit('getFileError', { message: 'Error al obtener el archivo.' });
    }
  }

  uploadFile(
    file: ArrayBuffer,
    fileName: string,
    fileMimeType: string,
  ): { status: boolean; fileName: string | null; fileLocation: string | null; mimeType: string | null } {
    const buffer = Buffer.from(file);
    const uniqueFileName = UtilitiesFunctions.generateHexString(12);
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
    } catch (error) {
      console.error('Error al cargar el archivo ', error);
      return { status: false, fileName: null, fileLocation: null, mimeType: null };
    }
  }
}
