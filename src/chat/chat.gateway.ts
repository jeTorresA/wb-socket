import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import path from 'path';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import { mensajes, salasChat, suscriptor } from './interfaces/chat/chat.interface';
import { SuscriptoresSalasChat } from 'src/entities/SuscriptoresSalasChat.entity';
import { UserConected } from 'src/entities/UserConected.entity';
import { UtilitiesFunctions } from 'src/utilities/UtilitiesFunctions';

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket, user_id: string) {
    console.info('USUARIO CONECTADO ', { cliend_id: client.id, user_id });
  }
  async handleDisconnect(client: any) {
    try {      
      const removed = await this.chatService.removeClientConnected(client.id);
      
    } catch (error) {
      console.error('NO FUE POSIBLE ELIMINAR EL CLIENTE DESCONECTADO DE LA LISTA ', error);      
    }
  }
  @WebSocketServer() server: Server = new Server();
 
  @SubscribeMessage('userConected')
  async userConect(
    @MessageBody('userId') userId: string,
    @MessageBody('userName') userName: string,
    @ConnectedSocket() client: Socket
  ) {
    let clientData = {
      id: client.id,
      handshake: client.handshake,
      rooms: Array.from(client.rooms),
      connected: client.connected,
      join: client.join('')
    };
    const data = { userId: userId, userName: userName, client: clientData };
    await this.chatService.usersConected(data);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(client: Socket, params: { id_user: string, salasActuales: string[] }) {    
    let salasSuscritas: (suscriptor & { salas: salasChat })[] = [];   
    await this.chatService.obtenerSalasSuscritas(params.id_user, params.salasActuales).then(response => {
      salasSuscritas = response;      

      if(response.length != 0 ){        
        salasSuscritas.map(async (data) => {
          
          client.join((data.salas.nombre_sala));
          data.mensajes = [];   
        })  
        client.emit('joinedRooms', salasSuscritas);
      }
    })
  }

  @SubscribeMessage('joinMessages')
  async handleJoinMensajesSalas(client: Socket, id_sala: string) {
    setTimeout(async () => {
      await this.chatService.obtenerMensajesSala(id_sala).then(respuesta => {
        this.server.emit('mensajesSala', respuesta);        
      })
    }, 100);
  }

  @SubscribeMessage('createRoom')
  async handleCreateSala(client: Socket, data: (salasChat & { suscriptores: suscriptor[] })) {
    await this.chatService.createSala(data).then(async res => {
      if (res.type === "warning") {
        client.emit('advertencia', res.message)
      } else {
        const principalSubscriber = (res.data.subscribers as SuscriptoresSalasChat[]).filter((subs: SuscriptoresSalasChat) => (subs.id_user === data.creador));
        await this.verifyConnectedClients(res.data.tipo_sala, principalSubscriber as SuscriptoresSalasChat[]);

        const otherSubscribers = (res.data.subscribers as SuscriptoresSalasChat[]).filter((subs: SuscriptoresSalasChat) => (subs.id_user !== data.creador));
        await this.verifyConnectedClients(res.data.tipo_sala, otherSubscribers as SuscriptoresSalasChat[]);
      }
    });
  }

  // Método para suscribir clientes de usuarios conectados a salas en las que sean agregados
  async verifyConnectedClients(roomType: number, room: (suscriptor & SuscriptoresSalasChat)[]) {
    let userIds = [];
    let roomId = '';

    room.map((subscriber: SuscriptoresSalasChat) => {
      userIds.push(subscriber.id_user);
      roomId = subscriber.id_sala;
    })    
       
    const connectedClientes = await this.chatService.searchClientsConnected(userIds);
    this.subscribeClientsToRoom(room[0], connectedClientes, roomType)
  }

  /**
   * Permite suscribir a los clientes a una sala de chat.
   * Agrega el cliente a la sala y emite un evento de notificación de nueva
   * @param room 
   * @param clients 
   * @param roomType 
   */
  async subscribeClientsToRoom(room: SuscriptoresSalasChat, clients: UserConected[], roomType: number) {    
    clients.map((client: UserConected) => {      
      if(this.isClientActive(client.client.id)) {
        const notifyClient = this.server.sockets.sockets.get(client.client.id);
        notifyClient.join(room.id_sala);
        notifyClient.emit('newSala', {...room, tipo: roomType});
        notifyClient.emit('salaSuscrita', {...room, tipo: roomType});
      } else {
        // Remove from client connected list
        this.chatService.removeClientConnected(client.client.id);
      }
    });
  }

  /**
   * Permite eliminar la suscripción de un cliente a una sala de chat.
   * Marca la fecha de eliminación en la base de datos y emite un evento al cliente
   * @param room 
   * @param clients 
   * @param roomType 
   */
  async unsubscribeClientsFromRoom(room: SuscriptoresSalasChat, clients: UserConected[], roomType: number) {
    clients.map((client: UserConected) => {
      if(this.isClientActive(client.client.id)) {
        const notifyClient = this.server.sockets.sockets.get(client.client.id);
        notifyClient.leave(room.id_sala);
        notifyClient.emit('salaEliminada', {...room, tipo: roomType});
      } else {
        // Remove from client connected list
        this.chatService.removeClientConnected(client.client.id);
      }
    });
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(client: Socket, data: mensajes) {    
    const message = await this.chatService.createMensaje(data);
    await this.chatService.updateMessagesToRead(data.id_sala, data.id_user);
    
    // Se consultan los diferentes clientes desde los cuales etá conectado el usuario que envía el mensaje y se le emite el vento para que el mensaje sea agregado en las vistas
    const userClients = await this.chatService.searchClientsConnected([data.id_user]);
    
    userClients.map((client: UserConected) => {
      this.emitEventToClient(client, 'sentMessage', message);
    })

    const roomSubscribers = await this.chatService.getRoomSubscribers(data.id_sala);
    
    // Se filtra los suscriptores a dicha sala que sean diferentes a quien envía el mensaje
    let subscribersToNotify: string[] = [];
    roomSubscribers.map((subscriber: { id_user: string }) => {
      if(subscriber.id_user !== data.id_user) subscribersToNotify.push(subscriber.id_user);
    });
   
    // Se consultan los diferentes clientes desde los cuales etá conectado cada suscriptor
    const notifyToClients = await this.chatService.searchClientsConnected(subscribersToNotify);
    notifyToClients.map((client: UserConected) => {
      this.emitEventToClient(client, 'newMessage', message);
    })
  }
  
  async emitEventToClient(client: UserConected, event: string, data: any) {
    try {
      const notifyClient = this.server.sockets.sockets.get(client.client.id);
      if(notifyClient) {
        notifyClient.emit(event, data);
      } else {
        // Remove from client connected list
        this.chatService.removeClientConnected(client.client.id);
      }
    } catch (error) {
      console.error('Algo ha salido mal en este proceso', { clientId: client.client.id, error });      
    }
  }

  @SubscribeMessage('setMessagesAsRead')
  async handleSetMessagesAsRead(client: Socket, data: { id_sala: string, id_user: string }) {
    const updated = await this.chatService.updateMessagesAsRead(data.id_sala, data.id_user);
    // Se consultan los diferentes clientes desde los cuales etá conectado cada suscriptor
    const notifyToClients = await this.chatService.searchClientsConnected([data.id_user]);
    notifyToClients.map((client: UserConected) => {
      this.emitEventToClient(client, 'messagesRead', data);
    })
  }

  @SubscribeMessage('getFile')
  async handleGetFile(@MessageBody('data') data: { fileName: string, location: string }, @ConnectedSocket() client: Socket): Promise<void> {
    const folderPath = path.join(__dirname, '..', '..', 'public', data.location)
    const filePath = path.join(folderPath, data.fileName);
    try {
      const fileBuffer = await fsp.readFile(filePath);
      client.emit('getFileSuccess', { fileName: data.fileName, data: fileBuffer.toString('base64') });
    } catch (error) {
      console.error('Error al leer el archivo: ', error);
      client.emit('getFileError', { message: 'Error al obtener el archivo.' });      
    }
  }

  uploadFile(file: ArrayBuffer, fileName: string, fileMimeType: string): { status: boolean, fileName: string | null, fileLocation: string | null, mimeType: string | null } {
    let response: { status: boolean, fileName: string | null, fileLocation: string | null, mimeType: string | null } = { status: false, fileName: null, fileLocation: null, mimeType: null };
    const buffer = Buffer.from(file);
    const uniqueFileName = UtilitiesFunctions.generateHexString(12);
    const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads');
    const fileNameSaved = `${uniqueFileName}_${fileName}`;
    const uploadFile = path.join(uploadDir, fileNameSaved);
    try {
      // Verificar si existen los directorios y crearlos si no es así
      if(!fs.existsSync(uploadDir)) {
        // Crear carpetas
        fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 });
      }
      // Guardar archivo
      fs.writeFileSync(uploadFile, buffer);
      response = { status: true, fileName: fileNameSaved, fileLocation: 'uploads', mimeType: fileMimeType };
    } catch (error) {
      console.error('Sucedió un error al cargar el archivo ', error);
    }
    return response;
  }

  isClientActive(socketId: string) {
    return this.server.sockets.sockets.has(socketId);
  }
}
