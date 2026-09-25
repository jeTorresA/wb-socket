import { Response } from 'express';
export declare class FilesController {
    uploadFile(file: Express.Multer.File, res: Response): Promise<Response<any, Record<string, any>>>;
    getFile(fileName: string, location: string, res: Response): Promise<void | Response<any, Record<string, any>>>;
    getFileStream(directory: string, filename: string, res: Response): void;
    getFileAsBlob(directory: string, filename: string, res: Response): Promise<Response<any, Record<string, any>>>;
    getFileAsBlobByQuery(fileName: string, location: string, res: Response): Promise<Response<any, Record<string, any>>>;
    private resolvePublicPath;
    private getMimeType;
}
