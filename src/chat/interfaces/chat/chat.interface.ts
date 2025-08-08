export interface suscriptor {
    id_user: string,
    id_sala: string,
    nombre_sala: string,
    imagen_sala: string,
    fecha_suscripcion: Date,
    mensajes?: any[],
    salas?: salasChat
}
export interface salasChat {
    id_sala?: string,
    nombre_sala: string,
    creador: string,
    fecha_creacion: Date,
    tipo?: number,
}
export interface suscriptor {
    id_user: string,
    id_sala: string,
    nombre_sala: string,
    imagen_sala: string,
    fecha_suscripcion: Date
}
export interface mensajesSalas {
    mensajes: any
}
export interface mensajes {
    id_sala: string,
    message: string,
    archivos?: ISavedFileResponse[]
    id_user: string,
    userName: string,
    fecha_creacion: Date,
}
export interface IMessageSaveStructure {
    id_sala: string,
    message: string,
    archivos?: ISavedFileResponse[]
    id_user: string,
    userName: string,
    fecha_creacion: Date,
}
export interface IFileStructure {
    file: ArrayBuffer,
    mimeType: string,
    fileName: string
}

export interface ISavedFileResponse {
    nombre_archivo: string,
    nombre_guardado: string,
    ubicacion: string,
    mime_type: string
}