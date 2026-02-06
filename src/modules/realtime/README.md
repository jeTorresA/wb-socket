# Módulo Realtime

Infraestructura base para soportar múltiples plataformas (namespaces) y distribución estandarizada de eventos realtime.

## Arquitectura

Este módulo implementa:
- **Event Driven Architecture**: Distribución desacoplada de eventos
- **SOLID**: Responsabilidad única, inyección de dependencias
- **Backward Compatibility**: No modifica lógica existente

## Estructura

```
src/modules/realtime/
├── controllers/
│   ├── events.controller.ts             # Endpoint HTTP para publicar eventos
│   └── events.controller.spec.ts        # Pruebas unitarias
├── dto/
│   └── publish-event.dto.ts             # DTO estandarizado para eventos
├── services/
│   ├── event-dispatcher.service.ts      # Despachador de eventos
│   ├── event-dispatcher.service.spec.ts # Pruebas unitarias
│   ├── socket-registry.service.ts       # Registro centralizado de sockets
│   └── socket-registry.service.spec.ts  # Pruebas unitarias
├── shared/
│   └── base.gateway.ts                  # Gateway base reutilizable
├── realtime.module.ts                   # Módulo NestJS
└── index.ts                             # Exportaciones
```

## Uso

### 1. Importar el módulo

```typescript
import { RealtimeModule } from './modules/realtime';

@Module({
  imports: [RealtimeModule],
})
export class AppModule {}
```

### 2. Usar SocketRegistryService

```typescript
import { SocketRegistryService } from './modules/realtime';

@WebSocketGateway({ namespace: '/chat' })
export class ChatGateway {
  constructor(private socketRegistry: SocketRegistryService) {}

  async handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    const userName = client.handshake.query.userName as string;

    // Registra socket y une automáticamente a room global user:userId
    await this.socketRegistry.registerSocket(
      client,
      userId,
      userName,
      'chat',
      { handshake: client.handshake }
    );
  }

  async handleDisconnect(client: Socket) {
    await this.socketRegistry.removeSocket(client.id);
  }

  async notifyUser(userId: string, message: any) {
    // Emite directamente al room user:userId sin consultar DB
    this.server.of('/chat').to(`user:${userId}`).emit('notification', message);
  }
}
```

### 3. Usar EventDispatcherService

```typescript
import { EventDispatcherService, PublishEventDto } from './modules/realtime';

@Injectable()
export class MyService {
  constructor(private eventDispatcher: EventDispatcherService) {}

  sendNotification() {
    const dto: PublishEventDto = {
      namespace: 'chat',
      event: 'message.created',
      rooms: ['room:123'],
      payload: { text: 'Hola' }
    };
    
    this.eventDispatcher.publish(dto);
  }
}
```

### 4. Extender BaseGateway

```typescript
import { BaseGateway } from './modules/realtime';

@WebSocketGateway()
export class MyGateway extends BaseGateway {
  @WebSocketServer() 
  server: Server;

  sendToUsers(users: string[]) {
    this.emitToUsers('chat', users, 'notification.new', { message: 'test' });
  }
}
```

### 5. Publicar eventos vía HTTP

```typescript
// Desde cualquier backend interno
POST http://ws-hub:3000/events/publish
Content-Type: application/json

{
  "namespace": "chat",
  "event": "message.created",
  "users": ["user-1", "user-2"],
  "payload": {
    "text": "Hola desde backend externo",
    "from": "system"
  }
}
```

## Rooms Globales

Cada usuario se registra automáticamente en un room global con formato `user:${userId}`.

### Ventajas

- ✅ **Sin consultas DB**: Emite eventos directamente sin buscar sockets
- ✅ **Mejor rendimiento**: Usa sistema de rooms nativo de Socket.IO
- ✅ **Múltiples sockets**: Un usuario puede tener varios sockets (móvil, web, etc.)
- ✅ **Automático**: Se registra al conectar, se elimina al desconectar

### Uso

```typescript
// Emitir a un usuario (todos sus sockets)
server.of('/chat').to('user:user-1').emit('notification', data);

// Emitir a múltiples usuarios
const userIds = ['user-1', 'user-2', 'user-3'];
userIds.forEach(userId => {
  server.of('/chat').to(`user:${userId}`).emit('message.new', data);
});

// Usando EventDispatcherService
eventDispatcher.publish({
  namespace: 'chat',
  event: 'message.created',
  users: ['user-1', 'user-2'],
  payload: data
});
```

## API HTTP

### POST /events/publish

Permite que backends externos publiquen eventos realtime sin usar Socket.IO.

**Autenticación:** Requiere token de servicio

**Request:**
```json
{
  "namespace": "chat",
  "event": "message.created",
  "users": ["user-1", "user-2"],
  "rooms": ["room:123"],
  "payload": {
    "text": "Mensaje desde backend",
    "from": "system"
  }
}
```

**Headers:**
```
Authorization: Bearer YOUR_SERVICE_TOKEN
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "message": "Evento 'message.created' publicado en namespace 'chat'"
}
```

**Validaciones:**
- Namespace debe estar en la lista de permitidos
- Debe especificar al menos `rooms` o `users`
- DTO completamente validado con class-validator

**Ejemplo con cURL:**
```bash
curl -X POST http://localhost:3000/events/publish \
  -H "Authorization: Bearer your-service-token" \
  -H "Content-Type: application/json" \
  -d '{
    "namespace": "chat",
    "event": "message.created",
    "users": ["user-123"],
    "payload": {"text": "Hola"}
  }'
```

**Ejemplo con Axios:**
```typescript
import axios from 'axios';

await axios.post('http://ws-hub:3000/events/publish', {
  namespace: 'chat',
  event: 'notification.new',
  users: ['user-1', 'user-2'],
  payload: { message: 'Nueva notificación' }
}, {
  headers: {
    'Authorization': 'Bearer your-service-token'
  }
});
```

## SocketRegistryService

Servicio centralizado para gestión de sockets conectados.

### Métodos

#### registerSocket(client, userId, userName, namespace, clientData?)
Registra un socket conectado en un namespace específico y lo une automáticamente al room global `user:${userId}`.

```typescript
await socketRegistry.registerSocket(
  client,
  'user-1',
  'John Doe',
  'chat',
  { handshake: client.handshake, connected: true }
);
// Socket automáticamente unido a room: user:user-1
```

#### removeSocket(socketId)
Elimina un socket del registro.

```typescript
const removed = await socketRegistry.removeSocket('socket-123');
// Returns: true si se eliminó, false si no existía
```

#### getUserSockets(userId, namespace)
Obtiene todos los sockets de un usuario en un namespace.

```typescript
const sockets = await socketRegistry.getUserSockets('user-1', 'chat');
// Returns: UserConected[]
```

#### getUsersSockets(userIds, namespace)
Obtiene sockets de múltiples usuarios en un namespace.

```typescript
const sockets = await socketRegistry.getUsersSockets(
  ['user-1', 'user-2'],
  'chat'
);
```

#### isSocketRegistered(socketId)
Verifica si un socket está registrado.

```typescript
const exists = await socketRegistry.isSocketRegistered('socket-123');
```

## Formato de Eventos

Todos los eventos deben seguir el formato: `recurso.accion`

Ejemplos:
- `message.created`
- `message.read`
- `notification.new`
- `user.connected`

## Namespaces

Los namespaces permiten aislar diferentes aplicaciones:

```typescript
// Emite a /chat
eventDispatcher.emitToRooms('chat', ['room:123'], 'message.created', data);

// Emite a /notifications
eventDispatcher.emitToRooms('notifications', ['user:1'], 'notification.new', data);
```

## Características

- ✅ Desacoplado de lógica de negocio
- ✅ Tipado estricto TypeScript
- ✅ Inyección de dependencias NestJS
- ✅ Extensible para futuros namespaces
- ✅ Evita eventos globales sin namespace
- ✅ Pruebas unitarias incluidas
- ✅ Registro centralizado de sockets por namespace
- ✅ Gestión automática de desconexión
- ✅ Consultas optimizadas con TypeORM
- ✅ Rooms globales automáticos (user:userId)
- ✅ Emisión sin consultas a base de datos
- ✅ API HTTP para backends externos
- ✅ Sistema stateless
