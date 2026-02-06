# API HTTP - WS Hub

## Descripción

El WS Hub funciona como un **router universal de eventos realtime**, permitiendo que cualquier backend interno publique eventos mediante HTTP sin necesidad de usar Socket.IO directamente.

## Endpoint

### POST /events/publish

Publica un evento realtime a través de WebSockets.

**URL:** `http://ws-hub:3000/events/publish`

**Método:** `POST`

**Autenticación:** Bearer Token (obligatorio)

**Headers:**
```
Authorization: Bearer YOUR_SERVICE_TOKEN
Content-Type: application/json
```

## Request Body

```typescript
{
  namespace: string;    // Namespace del evento (ej: 'chat', 'notifications')
  event: string;        // Nombre del evento (formato: recurso.accion)
  rooms?: string[];     // Rooms a los que emitir (opcional)
  users?: string[];     // Usuarios a los que emitir (opcional)
  payload: any;         // Datos del evento
}
```

### Validaciones

1. **namespace**: Obligatorio, debe estar en la lista de namespaces permitidos
2. **event**: Obligatorio, debe seguir formato `recurso.accion`
3. **rooms o users**: Al menos uno debe estar presente
4. **payload**: Obligatorio, puede ser cualquier estructura JSON

### Namespaces Permitidos

Por defecto:
- `chat`
- `notifications`
- `example`

Para agregar más namespaces, editar `EventsController`:

```typescript
private readonly allowedNamespaces = ['chat', 'notifications', 'example', 'nuevo'];
```

## Ejemplos de Uso

### Ejemplo 1: Notificar a usuarios específicos

```bash
curl -X POST http://localhost:3000/events/publish \
  -H "Authorization: Bearer your-service-token" \
  -H "Content-Type: application/json" \
  -d '{
    "namespace": "notifications",
    "event": "notification.new",
    "users": ["user-123", "user-456"],
    "payload": {
      "title": "Nueva notificación",
      "message": "Tienes un nuevo mensaje",
      "priority": "high"
    }
  }'
```

### Ejemplo 2: Emitir a una sala de chat

```bash
curl -X POST http://localhost:3000/events/publish \
  -H "Authorization: Bearer your-service-token" \
  -H "Content-Type: application/json" \
  -d '{
    "namespace": "chat",
    "event": "message.created",
    "rooms": ["room:chat-123"],
    "payload": {
      "text": "Mensaje del sistema",
      "from": "system",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  }'
```

### Ejemplo 3: Broadcast a múltiples destinos

```bash
curl -X POST http://localhost:3000/events/publish \
  -H "Authorization: Bearer your-service-token" \
  -H "Content-Type: application/json" \
  -d '{
    "namespace": "chat",
    "event": "announcement.broadcast",
    "rooms": ["room:general", "room:support"],
    "users": ["admin-1", "admin-2"],
    "payload": {
      "message": "Mantenimiento programado en 1 hora",
      "type": "warning"
    }
  }'
```

## Integración con Backends

### Node.js / Express

```typescript
import axios from 'axios';

const SERVICE_TOKEN = process.env.SERVICE_AUTH_TOKEN;

async function notifyUser(userId: string, notification: any) {
  try {
    const response = await axios.post('http://ws-hub:3000/events/publish', {
      namespace: 'notifications',
      event: 'notification.new',
      users: [userId],
      payload: notification
    }, {
      headers: {
        'Authorization': `Bearer ${SERVICE_TOKEN}`
      }
    });
    
    console.log('Evento publicado:', response.data);
  } catch (error) {
    console.error('Error al publicar evento:', error);
  }
}
```

### Python / FastAPI

```python
import httpx
import os

SERVICE_TOKEN = os.getenv('SERVICE_AUTH_TOKEN')

async def notify_user(user_id: str, notification: dict):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            'http://ws-hub:3000/events/publish',
            json={
                'namespace': 'notifications',
                'event': 'notification.new',
                'users': [user_id],
                'payload': notification
            },
            headers={
                'Authorization': f'Bearer {SERVICE_TOKEN}'
            }
        )
        return response.json()
```

### PHP / Laravel

```php
use Illuminate\Support\Facades\Http;

function notifyUser($userId, $notification) {
    $serviceToken = env('SERVICE_AUTH_TOKEN');
    
    $response = Http::withHeaders([
        'Authorization' => 'Bearer ' . $serviceToken
    ])->post('http://ws-hub:3000/events/publish', [
        'namespace' => 'notifications',
        'event' => 'notification.new',
        'users' => [$userId],
        'payload' => $notification
    ]);
    
    return $response->json();
}
```

### Java / Spring Boot

```java
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;

public void notifyUser(String userId, Object notification) {
    RestTemplate restTemplate = new RestTemplate();
    String serviceToken = System.getenv("SERVICE_AUTH_TOKEN");
    
    HttpHeaders headers = new HttpHeaders();
    headers.set("Authorization", "Bearer " + serviceToken);
    
    Map<String, Object> request = new HashMap<>();
    request.put("namespace", "notifications");
    request.put("event", "notification.new");
    request.put("users", Arrays.asList(userId));
    request.put("payload", notification);
    
    HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);
    
    restTemplate.postForObject(
        "http://ws-hub:3000/events/publish",
        entity,
        Map.class
    );
}
```

## Respuestas

### Éxito (200 OK)

```json
{
  "success": true,
  "message": "Evento 'message.created' publicado en namespace 'chat'"
}
```

### Error: No autorizado (401 Unauthorized)

```json
{
  "statusCode": 401,
  "message": "Token de autorización requerido",
  "error": "Unauthorized"
}
```

```json
{
  "statusCode": 401,
  "message": "Token de servicio inválido",
  "error": "Unauthorized"
}
```

### Error: Namespace no permitido (400 Bad Request)

```json
{
  "statusCode": 400,
  "message": "Namespace 'invalid' no permitido. Namespaces válidos: chat, notifications, example",
  "error": "Bad Request"
}
```

### Error: Sin destinatarios (400 Bad Request)

```json
{
  "statusCode": 400,
  "message": "Debe especificar al menos un room o usuario",
  "error": "Bad Request"
}
```

### Error: Validación DTO (400 Bad Request)

```json
{
  "statusCode": 400,
  "message": [
    "namespace should not be empty",
    "event should not be empty"
  ],
  "error": "Bad Request"
}
```

## Casos de Uso

### 1. Sistema de Notificaciones

Backend de notificaciones envía alertas en tiempo real:

```typescript
// Notificar a un usuario
POST /events/publish
{
  "namespace": "notifications",
  "event": "notification.new",
  "users": ["user-123"],
  "payload": {
    "type": "info",
    "title": "Nuevo mensaje",
    "body": "Tienes 3 mensajes sin leer"
  }
}
```

### 2. Chat en Tiempo Real

Backend de mensajería envía mensajes:

```typescript
// Enviar mensaje a sala
POST /events/publish
{
  "namespace": "chat",
  "event": "message.created",
  "rooms": ["room:support-123"],
  "payload": {
    "id": "msg-456",
    "text": "Hola, ¿en qué puedo ayudarte?",
    "from": "agent-789",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### 3. Actualizaciones de Estado

Backend de procesamiento notifica cambios:

```typescript
// Notificar cambio de estado
POST /events/publish
{
  "namespace": "app",
  "event": "order.updated",
  "users": ["user-123"],
  "payload": {
    "orderId": "order-789",
    "status": "shipped",
    "trackingNumber": "ABC123456"
  }
}
```

### 4. Broadcast de Sistema

Backend de administración envía anuncios:

```typescript
// Broadcast a todos los usuarios conectados
POST /events/publish
{
  "namespace": "app",
  "event": "system.announcement",
  "rooms": ["lobby"],
  "payload": {
    "message": "Mantenimiento programado en 30 minutos",
    "severity": "warning"
  }
}
```

## Ventajas

- ✅ **Stateless**: No requiere mantener conexión WebSocket
- ✅ **Simple**: Solo HTTP POST, cualquier lenguaje puede usarlo
- ✅ **Desacoplado**: Backends no necesitan Socket.IO
- ✅ **Centralizado**: Un solo punto para todos los eventos realtime
- ✅ **Validado**: DTO completamente validado
- ✅ **Seguro**: Lista blanca de namespaces

## Seguridad

### Autenticación

El endpoint está protegido con autenticación servicio-a-servicio mediante Bearer Token.

**Configuración:**

1. Generar token seguro:
```bash
openssl rand -hex 32
```

2. Configurar en `.env`:
```env
SERVICE_AUTH_TOKEN=tu-token-seguro-aqui
```

3. Usar en requests:
```bash
Authorization: Bearer tu-token-seguro-aqui
```

### Recomendaciones

1. **Token seguro**: Usar tokens largos y aleatorios (32+ caracteres)
2. **Variables de entorno**: Nunca hardcodear tokens en el código
3. **Red interna**: Exponer solo en red privada
4. **HTTPS**: Usar HTTPS en producción
5. **Rate limiting**: Implementar límite de requests
6. **Rotación**: Rotar tokens periódicamente

### Ejemplo con API Key (futuro)

```typescript
// Ya implementado con ServiceAuthGuard
@Controller('events')
@UseGuards(ServiceAuthGuard)
export class EventsController {
  // ...
}
```

## Monitoreo

### Logs

El controlador no genera logs por defecto. Para agregar:

```typescript
@Post('publish')
async publishEvent(@Body() dto: PublishEventDto) {
  console.log(`[EventsController] Publishing event: ${dto.event} to namespace: ${dto.namespace}`);
  
  this.eventDispatcher.publish(dto);
  
  return { success: true, message: `...` };
}
```

### Métricas

Considerar agregar métricas:
- Número de eventos publicados por namespace
- Tiempo de respuesta
- Errores de validación

## Testing

### Prueba Manual

```bash
# Prueba básica con autenticación
curl -X POST http://localhost:3000/events/publish \
  -H "Authorization: Bearer your-service-token" \
  -H "Content-Type: application/json" \
  -d '{
    "namespace": "chat",
    "event": "test.event",
    "users": ["test-user"],
    "payload": {"message": "test"}
  }'

# Prueba sin token (debe fallar)
curl -X POST http://localhost:3000/events/publish \
  -H "Content-Type: application/json" \
  -d '{
    "namespace": "chat",
    "event": "test.event",
    "users": ["test-user"],
    "payload": {"message": "test"}
  }'
# Respuesta: 401 Unauthorized
```

### Prueba con Postman

1. Crear request POST a `http://localhost:3000/events/publish`
2. Headers: `Content-Type: application/json`
3. Body (raw JSON):
```json
{
  "namespace": "chat",
  "event": "message.created",
  "users": ["user-123"],
  "payload": {
    "text": "Test message"
  }
}
```

## Resumen

El endpoint `/events/publish` convierte el WS Hub en un **router universal de eventos realtime**, permitiendo que cualquier backend publique eventos mediante HTTP simple, sin necesidad de implementar Socket.IO.
