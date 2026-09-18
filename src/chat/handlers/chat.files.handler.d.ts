import { Socket } from 'socket.io';
export declare class ChatFilesHandler {
    handleGetFile(client: Socket, data: {
        fileName: string;
        location: string;
    }): Promise<void>;
    uploadFile(file: ArrayBuffer, fileName: string, fileMimeType: string): {
        status: boolean;
        fileName: string | null;
        fileLocation: string | null;
        mimeType: string | null;
    };
}
