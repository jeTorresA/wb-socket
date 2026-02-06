# Guía de Migración - SocketRegistryService

## Objetivo

Migrar el código existente para usar el registro centralizado de sockets sin romper compatibilidad.

## Comparación: Antes vs Después

### Antes (ChatGateway actual)

```typescript
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
  };
  const data = { userId, userName, client: clientData };
  await this.chatService.usersConected(data);
}
```

### Después (Con SocketRegistryService y Rooms Globales)

```typescript
@SubscribeMessage('userConected')
async userConect(
  @MessageBody('userId') userId: string,
  @MessageBody('userName') userName: string,
  @ConnectedSocket() client: Socket
) {
  // Registra socket y une automáticamente a room user:userId
  await this.socketRegistry.registerSocket(
    client,
    userId,
    userName,
    'chat',
    {
      handshake: client.handshake,
      rooms: Array.from(client.rooms),
      connected: client.connected,
    }
  );
}
```

## Ventajas del Nuevo Sistema

### 1. Namespace Obligatorio
- ✅ Aislamiento por aplicación
- ✅ Evita colisiones entre plataformas
- ✅ Consultas más eficientes

### 2. Consultas Optimizadas

**Antes:**
```typescript
// Consulta sin filtro de namespace
const clients = await this.chatService.searchClientsConnected(userIds);
```

**Después:**
```typescript
// Sin consulta a base de datos - usa rooms globales
this.server.of('/chat').to('user:user-1').emit('notification', data);

// O usando EventDispatcherService
this.eventDispatcher.publish({
  namespace: 'chat',
  event: 'notification.new',
  users: ['user-1', 'user-2'],
  payload: data
});
```

### 3. Eliminación Automática

**Antes:**
```typescript
async handleDisconnect(client: any) {
  try {      
    const removed = await this.chatService.removeClientConnected(client.id);
  } catch (error) {
    console.error('Error', error);      
  }
}
```

**Después:**
```typescript
async handleDisconnect(client: Socket) {
  await this.socketRegistry.removeSocket(client.id);
}
```

## Plan de Migración Gradual

### Fase 1: Mantener Compatibilidad (Actual)
- ✅ SocketRegistryService creado
- ✅ No modifica código existente
- ✅ Puede usarse en paralelo

### Fase 2: Migración Progresiva (Futuro)
1. Actualizar ChatGateway para usar SocketRegistryService
2. Migrar métodos de ChatService a SocketRegistryService
3. Agregar namespace 'chat' a todos los registros
4. Deprecar métodos antiguos

### Fase 3: Limpieza (Futuro)
1. Eliminar métodos deprecados
2. Actualizar migraciones si es necesario
3. Documentar cambios

## Backward Compatibility

El campo `namespace` en `UserConected` es **nullable**, lo que permite:

- ✅ Registros antiguos sin namespace siguen funcionando
- ✅ Nuevos registros usan namespace obligatorio
- ✅ Migración gradual sin downtime

## Ejemplo de Uso Completo

```typescript
import { SocketRegistryService, EventDispatcherService } from './modules/realtime';

@WebSocketGateway({ namespace: '/chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly socketRegistry: SocketRegistryService,
    private readonly eventDispatcher: EventDispatcherService,
  ) {}

  async handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    const userName = client.handshake.query.userName as string;

    // Registrar socket y unir automáticamente a room user:userId
    await this.socketRegistry.registerSocket(
      client,
      userId,
      userName,
      'chat',
      { handshake: client.handshake }
    );

    // Notificar conexión usando room global (sin consulta DB)
    this.eventDispatcher.publish({
      namespace: 'chat',
      event: 'user.connected',
      users: ['user-1', 'user-2'], // Emite a user:user-1 y user:user-2
      payload: { userId, userName }
    });
  }

  async handleDisconnect(client: Socket) {
    await this.socketRegistry.removeSocket(client.id);
  }

  async sendMessageToUser(userId: string, message: any) {
    // Emite directamente al room user:userId sin consultar DB
    this.eventDispatcher.publish({
      namespace: 'chat',
      event: 'message.received',
      users: [userId],
      payload: message
    });
  }
}
```

## Consultas Comunes

### Emitir a un usuario (sin consulta DB)
```typescript
// Usando EventDispatcherService
eventDispatcher.publish({
  namespace: 'chat',
  event: 'notification.new',
  users: ['user-123'],
  payload: data
});

// O directamente
server.of('/chat').to('user:user-123').emit('notification.new', data);
```

### Emitir a múltiples usuarios (sin consulta DB)
```typescript
eventDispatcher.publish({
  namespace: 'chat',
  event: 'message.broadcast',
  users: ['user-1', 'user-2', 'user-3'],
  payload: data
});
```

### Obtener sockets de un usuario (si necesitas metadata)
```typescript
const sockets = await socketRegistry.getUserSockets('user-123', 'chat');
```

### Obtener sockets de múltiples usuarios (si necesitas metadata)
```typescript
const sockets = await socketRegistry.getUsersSockets(
  ['user-1', 'user-2', 'user-3'],
  'chat'
);
```

### Verificar si un socket existe
```typescript
const exists = await socketRegistry.isSocketRegistered('socket-abc');
```

### Eliminar socket
```typescript
const removed = await socketRegistry.removeSocket('socket-abc');
```

## Notas Importantes

1. **Namespace es obligatorio** en todos los métodos
2. **No elimina campos existentes** de UserConected
3. **Compatible con registros antiguos** (namespace nullable)
4. **Consultas optimizadas** con índices en namespace
5. **Eliminación automática** al desconectar
6. **Rooms globales automáticos** (user:userId) al registrar
7. **Sin consultas DB** para emitir eventos a usuarios
8. **Mejor rendimiento** usando sistema nativo de rooms de Socket.IO
