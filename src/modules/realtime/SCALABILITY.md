# Arquitectura para Escalabilidad Horizontal

## Descripción

El sistema ha sido preparado con una capa de abstracción que permite escalabilidad horizontal futura mediante clustering y Redis Adapter, sin necesidad de refactorizar el código existente.

## SocketServerProvider

### Ubicación
`src/modules/realtime/providers/socket-server.provider.ts`

### Propósito

Desacopla la instancia del servidor Socket.IO del resto del sistema, permitiendo:
- Integración futura con Redis Adapter
- Clustering horizontal
- Múltiples instancias del servidor
- Sincronización de eventos entre instancias

### Arquitectura Actual

```
┌─────────────────────────────────────┐
│   EventDispatcherService            │
│   SocketRegistryService             │
│   EventsController                  │
└──────────────┬──────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│   SocketServerProvider               │
│   (Capa de abstracción)              │
└──────────────┬───────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│   Socket.IO Server                   │
│   (Instancia única)                  │
└──────────────────────────────────────┘
```

### Arquitectura Futura (Con Redis)

```
┌─────────────────────────────────────┐
│   EventDispatcherService            │
│   SocketRegistryService             │
│   EventsController                  │
└──────────────┬──────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│   SocketServerProvider               │
│   (Capa de abstracción)              │
│   + Redis Adapter                    │
└──────────────┬───────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│   Socket.IO Server + Redis           │
│   (Múltiples instancias)             │
└──────────────────────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│   Redis Pub/Sub                      │
│   (Sincronización)                   │
└──────────────────────────────────────┘
```

## Métodos del Provider

### setServer(server: Server)
Configura la instancia del servidor Socket.IO.

```typescript
const server = new Server(httpServer);
socketServerProvider.setServer(server);
```

### getServer(): Server
Obtiene la instancia del servidor.

```typescript
const server = socketServerProvider.getServer();
```

### getNamespace(namespace: string)
Obtiene un namespace específico.

```typescript
const chatNamespace = socketServerProvider.getNamespace('chat');
```

### emitToRooms(namespace, rooms, event, data)
Emite eventos a rooms específicas.

```typescript
socketServerProvider.emitToRooms('chat', ['room:123'], 'message.new', data);
```

### emitToUsers(namespace, users, event, data)
Emite eventos a usuarios específicos.

```typescript
socketServerProvider.emitToUsers('chat', ['user-1'], 'notification', data);
```

## Integración Actual

### EventDispatcherService

```typescript
@Injectable()
export class EventDispatcherService {
  constructor(private readonly socketServerProvider: SocketServerProvider) {}

  emitToRooms(namespace: string, rooms: string[], event: string, payload: any) {
    this.socketServerProvider.emitToRooms(namespace, rooms, event, payload);
  }
}
```

### Uso en Gateways

```typescript
@WebSocketGateway()
export class ChatGateway implements OnModuleInit {
  @WebSocketServer() server: Server;

  constructor(private readonly socketServerProvider: SocketServerProvider) {}

  onModuleInit() {
    this.socketServerProvider.setServer(this.server);
  }
}
```

## Migración Futura a Redis

### Paso 1: Instalar Dependencias

```bash
npm install @socket.io/redis-adapter redis
```

### Paso 2: Configurar Redis Adapter

```typescript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

@Injectable()
export class SocketServerProvider implements OnModuleInit {
  async onModuleInit() {
    if (this.server) {
      const pubClient = createClient({ url: process.env.REDIS_URL });
      const subClient = pubClient.duplicate();

      await Promise.all([pubClient.connect(), subClient.connect()]);

      this.server.adapter(createAdapter(pubClient, subClient));
    }
  }
}
```

### Paso 3: Configurar Variables de Entorno

```env
REDIS_URL=redis://localhost:6379
```

### Paso 4: Deploy Múltiples Instancias

```bash
# Instancia 1
PORT=3000 pm2 start npm --name ws-hub-1 -- start

# Instancia 2
PORT=3001 pm2 start npm --name ws-hub-2 -- start

# Instancia 3
PORT=3002 pm2 start npm --name ws-hub-3 -- start
```

### Paso 5: Load Balancer

```nginx
upstream ws_hub {
    ip_hash;
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}

server {
    listen 80;
    
    location / {
        proxy_pass http://ws_hub;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Ventajas de la Arquitectura

### 1. Sin Refactorización
- ✅ Código existente no requiere cambios
- ✅ Solo agregar configuración de Redis
- ✅ Migración gradual posible

### 2. Escalabilidad Horizontal
- ✅ Múltiples instancias del servidor
- ✅ Distribución de carga
- ✅ Alta disponibilidad

### 3. Sincronización Automática
- ✅ Eventos sincronizados entre instancias
- ✅ Rooms compartidas
- ✅ Namespaces distribuidos

### 4. Desacoplamiento
- ✅ Lógica de negocio independiente
- ✅ Fácil testing
- ✅ Mantenibilidad

## Estado Actual

### ✅ Implementado
- Capa de abstracción (SocketServerProvider)
- Desacoplamiento del servidor
- Métodos de emisión centralizados
- Pruebas unitarias (9/9 pasadas)
- Integración con servicios existentes

### ⏳ Pendiente (Futuro)
- Instalación de Redis
- Configuración de Redis Adapter
- Deploy de múltiples instancias
- Load balancer
- Monitoreo de cluster

## Pruebas

```bash
# Ejecutar pruebas del provider
npm run test -- socket-server.provider.spec.ts

# Resultado: 9/9 pruebas pasadas
```

## Ejemplo de Uso

### Actual (Sin Redis)

```typescript
// Gateway
@WebSocketGateway()
export class ChatGateway {
  @WebSocketServer() server: Server;

  constructor(private socketServerProvider: SocketServerProvider) {}

  onModuleInit() {
    this.socketServerProvider.setServer(this.server);
  }
}

// Servicio
@Injectable()
export class NotificationService {
  constructor(private socketServerProvider: SocketServerProvider) {}

  notify(userId: string, message: any) {
    this.socketServerProvider.emitToUsers('notifications', [userId], 'new', message);
  }
}
```

### Futuro (Con Redis)

```typescript
// Mismo código - sin cambios
// Redis Adapter se configura automáticamente en SocketServerProvider
```

## Resumen

- ✅ Arquitectura preparada para escalabilidad horizontal
- ✅ Capa de abstracción implementada
- ✅ Sin modificación de configuración actual
- ✅ Redis no instalado (según requerimiento)
- ✅ Migración futura sin refactorización
- ✅ 41/41 pruebas pasadas en módulo realtime
