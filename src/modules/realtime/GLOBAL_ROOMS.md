# Sistema de Rooms Globales

## Concepto

Cada usuario que se conecta es automáticamente registrado en un room global con el formato `user:${userId}`.

Esto permite emitir eventos a todos los sockets de un usuario sin necesidad de consultar la base de datos.

## Funcionamiento

### Registro Automático

Cuando un usuario se conecta:

```typescript
await socketRegistry.registerSocket(client, 'user-123', 'John', 'chat');
```

Internamente:
1. El socket se une al room `user:user-123`
2. Se guarda el registro en la base de datos con el namespace
3. Si el usuario ya está en el room, no se vuelve a unir (evita duplicados)

### Múltiples Sockets por Usuario

Un usuario puede tener múltiples sockets conectados simultáneamente:
- Navegador web
- Aplicación móvil
- Múltiples pestañas

Todos estos sockets estarán en el mismo room `user:user-123`, por lo que un solo emit llega a todos.

## Ventajas

### 1. Sin Consultas a Base de Datos

**Antes:**
```typescript
// Consultar DB para obtener sockets del usuario
const sockets = await socketRegistry.getUserSockets('user-123', 'chat');

// Emitir a cada socket
sockets.forEach(socket => {
  server.to(socket.client.id).emit('notification', data);
});
```

**Después:**
```typescript
// Emitir directamente sin consultar DB
server.of('/chat').to('user:user-123').emit('notification', data);
```

### 2. Mejor Rendimiento

- ✅ Elimina latencia de consultas DB
- ✅ Usa sistema nativo de rooms de Socket.IO (optimizado)
- ✅ Escala mejor con muchos usuarios conectados

### 3. Código Más Simple

```typescript
// Emitir a un usuario
eventDispatcher.publish({
  namespace: 'chat',
  event: 'message.new',
  users: ['user-123'],
  payload: message
});

// Emitir a múltiples usuarios
eventDispatcher.publish({
  namespace: 'chat',
  event: 'notification.broadcast',
  users: ['user-1', 'user-2', 'user-3'],
  payload: notification
});
```

## Casos de Uso

### Notificaciones en Tiempo Real

```typescript
// Notificar a un usuario específico
this.eventDispatcher.publish({
  namespace: 'notifications',
  event: 'notification.new',
  users: [userId],
  payload: { title: 'Nueva notificación', message: 'Tienes un mensaje' }
});
```

### Mensajes de Chat

```typescript
// Enviar mensaje a participantes de un chat
const participantIds = ['user-1', 'user-2', 'user-3'];

this.eventDispatcher.publish({
  namespace: 'chat',
  event: 'message.created',
  users: participantIds,
  payload: message
});
```

### Actualizaciones de Estado

```typescript
// Notificar cambio de estado a usuarios específicos
this.eventDispatcher.publish({
  namespace: 'app',
  event: 'status.updated',
  users: affectedUserIds,
  payload: { status: 'active' }
});
```

## Combinación con Rooms Tradicionales

Puedes combinar rooms globales de usuario con rooms tradicionales:

```typescript
// Room tradicional para una sala de chat
client.join('room:chat-123');

// Room global del usuario (automático)
// user:user-123

// Emitir a la sala de chat
server.of('/chat').to('room:chat-123').emit('message.new', data);

// Emitir solo a un usuario específico
server.of('/chat').to('user:user-123').emit('message.private', data);
```

## Namespace Isolation

Los rooms son específicos por namespace:

```typescript
// Usuario en namespace /chat
// Room: user:user-123 en namespace /chat

// Usuario en namespace /notifications  
// Room: user:user-123 en namespace /notifications

// Son rooms diferentes, aislados entre sí
```

## Limpieza Automática

Cuando un socket se desconecta:

```typescript
async handleDisconnect(client: Socket) {
  await this.socketRegistry.removeSocket(client.id);
}
```

Socket.IO automáticamente:
1. Remueve el socket del room `user:userId`
2. Si era el último socket del usuario, el room se elimina automáticamente
3. No requiere limpieza manual

## Comparación de Rendimiento

### Escenario: Emitir a 100 usuarios

**Con Consultas DB:**
```
1. Consultar DB: ~50-100ms
2. Iterar sockets: ~10ms
3. Emitir eventos: ~20ms
Total: ~80-130ms
```

**Con Rooms Globales:**
```
1. Emitir a rooms: ~5-10ms
Total: ~5-10ms
```

**Mejora: 8-13x más rápido**

## Cuándo Usar Consultas DB

Usa `getUserSockets()` o `getUsersSockets()` solo cuando necesites:

1. **Metadata del socket**: handshake, fecha de conexión, etc.
2. **Validaciones**: verificar si un usuario está conectado antes de hacer algo
3. **Auditoría**: registrar información sobre conexiones

Para emitir eventos, siempre usa rooms globales.

## Ejemplo Completo

```typescript
@WebSocketGateway({ namespace: '/chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly socketRegistry: SocketRegistryService,
    private readonly eventDispatcher: EventDispatcherService,
  ) {}

  async handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    const userName = client.handshake.query.userName as string;

    // Registra y une automáticamente a user:userId
    await this.socketRegistry.registerSocket(
      client,
      userId,
      userName,
      'chat',
      { connectedAt: new Date() }
    );

    console.log(`Usuario ${userId} conectado al room user:${userId}`);
  }

  async handleDisconnect(client: Socket) {
    await this.socketRegistry.removeSocket(client.id);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(client: Socket, data: { recipientId: string, text: string }) {
    // Emitir directamente al room del destinatario (sin consulta DB)
    this.eventDispatcher.publish({
      namespace: 'chat',
      event: 'message.received',
      users: [data.recipientId],
      payload: { text: data.text, from: client.handshake.query.userId }
    });
  }

  async notifyMultipleUsers(userIds: string[], notification: any) {
    // Emitir a múltiples usuarios (sin consulta DB)
    this.eventDispatcher.publish({
      namespace: 'chat',
      event: 'notification.new',
      users: userIds,
      payload: notification
    });
  }
}
```

## Resumen

- ✅ Registro automático en `user:${userId}`
- ✅ Sin consultas DB para emitir eventos
- ✅ Mejor rendimiento (8-13x más rápido)
- ✅ Soporta múltiples sockets por usuario
- ✅ Limpieza automática al desconectar
- ✅ Aislamiento por namespace
- ✅ Compatible con rooms tradicionales
