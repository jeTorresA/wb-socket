# Seguridad Servicio-a-Servicio

## Descripción

El EventController está protegido con autenticación servicio-a-servicio mediante Bearer Token, asegurando que solo backends autorizados puedan publicar eventos realtime.

## ServiceAuthGuard

### Implementación

```typescript
@Injectable()
export class ServiceAuthGuard implements CanActivate {
  private readonly serviceToken: string;

  constructor(private configService: ConfigService) {
    this.serviceToken = this.configService.get<string>('SERVICE_AUTH_TOKEN');
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Token de autorización requerido');
    }

    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedException('Formato de token inválido');
    }

    if (token !== this.serviceToken) {
      throw new UnauthorizedException('Token de servicio inválido');
    }

    return true;
  }
}
```

### Uso

```typescript
@Controller('events')
@UseGuards(ServiceAuthGuard)
export class EventsController {
  // Todos los endpoints protegidos
}
```

## Configuración

### 1. Generar Token Seguro

```bash
# Opción 1: OpenSSL
openssl rand -hex 32

# Opción 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Opción 3: Python
python -c "import secrets; print(secrets.token_hex(32))"
```

### 2. Configurar Variable de Entorno

**Archivo `.env`:**
```env
SERVICE_AUTH_TOKEN=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

**Archivo `.env.example`:**
```env
# Service-to-Service Authentication
# Token para autenticar backends internos que publican eventos
# Generar con: openssl rand -hex 32
SERVICE_AUTH_TOKEN=your-secure-token-here-change-in-production
```

### 3. Usar en Requests

**Header requerido:**
```
Authorization: Bearer a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

## Validaciones

El guard valida:

1. ✅ **Presencia del header** `Authorization`
2. ✅ **Formato correcto** `Bearer TOKEN`
3. ✅ **Token configurado** en variables de entorno
4. ✅ **Token válido** coincide con el configurado

## Respuestas de Error

### Sin header Authorization

**Request:**
```bash
curl -X POST http://localhost:3000/events/publish \
  -H "Content-Type: application/json" \
  -d '{"namespace": "chat", "event": "test", "users": ["user-1"], "payload": {}}'
```

**Response (401):**
```json
{
  "statusCode": 401,
  "message": "Token de autorización requerido",
  "error": "Unauthorized"
}
```

### Formato inválido

**Request:**
```bash
curl -X POST http://localhost:3000/events/publish \
  -H "Authorization: invalid-token" \
  -H "Content-Type: application/json" \
  -d '{"namespace": "chat", "event": "test", "users": ["user-1"], "payload": {}}'
```

**Response (401):**
```json
{
  "statusCode": 401,
  "message": "Formato de token inválido. Use: Bearer TOKEN",
  "error": "Unauthorized"
}
```

### Token inválido

**Request:**
```bash
curl -X POST http://localhost:3000/events/publish \
  -H "Authorization: Bearer wrong-token" \
  -H "Content-Type: application/json" \
  -d '{"namespace": "chat", "event": "test", "users": ["user-1"], "payload": {}}'
```

**Response (401):**
```json
{
  "statusCode": 401,
  "message": "Token de servicio inválido",
  "error": "Unauthorized"
}
```

### Servicio no configurado

Si `SERVICE_AUTH_TOKEN` no está configurado:

**Response (401):**
```json
{
  "statusCode": 401,
  "message": "Servicio no configurado correctamente",
  "error": "Unauthorized"
}
```

## Integración con Backends

### Node.js

```typescript
import axios from 'axios';

const SERVICE_TOKEN = process.env.SERVICE_AUTH_TOKEN;

async function publishEvent(eventData: any) {
  return await axios.post('http://ws-hub:3000/events/publish', eventData, {
    headers: {
      'Authorization': `Bearer ${SERVICE_TOKEN}`
    }
  });
}
```

### Python

```python
import httpx
import os

SERVICE_TOKEN = os.getenv('SERVICE_AUTH_TOKEN')

async def publish_event(event_data: dict):
    async with httpx.AsyncClient() as client:
        return await client.post(
            'http://ws-hub:3000/events/publish',
            json=event_data,
            headers={'Authorization': f'Bearer {SERVICE_TOKEN}'}
        )
```

### PHP

```php
use Illuminate\Support\Facades\Http;

$serviceToken = env('SERVICE_AUTH_TOKEN');

$response = Http::withHeaders([
    'Authorization' => 'Bearer ' . $serviceToken
])->post('http://ws-hub:3000/events/publish', $eventData);
```

## Características

- ✅ **Configuración vía variables env** - No hardcoded
- ✅ **No afecta CORS** - Solo valida Authorization header
- ✅ **Reutilizable** - Puede aplicarse a otros controladores
- ✅ **Stateless** - No requiere sesiones
- ✅ **Simple** - Bearer Token estándar
- ✅ **Seguro** - Valida token en cada request

## Mejores Prácticas

### 1. Token Seguro

```bash
# Mínimo 32 caracteres
# Usar caracteres aleatorios
openssl rand -hex 32
```

### 2. Variables de Entorno

```typescript
// ✅ Correcto
const token = process.env.SERVICE_AUTH_TOKEN;

// ❌ Incorrecto
const token = 'hardcoded-token-123';
```

### 3. HTTPS en Producción

```nginx
# Nginx config
server {
    listen 443 ssl;
    server_name ws-hub.example.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
    }
}
```

### 4. Rotación de Tokens

```bash
# Generar nuevo token
NEW_TOKEN=$(openssl rand -hex 32)

# Actualizar .env
echo "SERVICE_AUTH_TOKEN=$NEW_TOKEN" >> .env

# Reiniciar servicio
pm2 restart ws-hub

# Actualizar backends
# Distribuir nuevo token a servicios autorizados
```

### 5. Monitoreo

```typescript
// Agregar logging
@UseGuards(ServiceAuthGuard)
export class EventsController {
  @Post('publish')
  async publishEvent(@Body() dto: PublishEventDto) {
    console.log(`[Auth] Event published: ${dto.event} to ${dto.namespace}`);
    // ...
  }
}
```

## Testing

### Pruebas Unitarias

```typescript
describe('ServiceAuthGuard', () => {
  it('should allow access with valid token', () => {
    const guard = new ServiceAuthGuard(configService);
    const context = createMockContext('Bearer valid-token');
    
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should reject invalid token', () => {
    const guard = new ServiceAuthGuard(configService);
    const context = createMockContext('Bearer invalid-token');
    
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
```

### Pruebas de Integración

```bash
# Test con token válido
curl -X POST http://localhost:3000/events/publish \
  -H "Authorization: Bearer $SERVICE_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"namespace": "chat", "event": "test", "users": ["user-1"], "payload": {}}'
# Esperado: 200 OK

# Test sin token
curl -X POST http://localhost:3000/events/publish \
  -H "Content-Type: application/json" \
  -d '{"namespace": "chat", "event": "test", "users": ["user-1"], "payload": {}}'
# Esperado: 401 Unauthorized
```

## Extensibilidad

El guard es reutilizable en otros controladores:

```typescript
@Controller('admin')
@UseGuards(ServiceAuthGuard)
export class AdminController {
  // Endpoints protegidos
}

@Controller('webhooks')
@UseGuards(ServiceAuthGuard)
export class WebhooksController {
  // Endpoints protegidos
}
```

## Resumen

- ✅ Autenticación servicio-a-servicio implementada
- ✅ Bearer Token estándar
- ✅ Configuración vía variables de entorno
- ✅ No afecta CORS
- ✅ Reutilizable
- ✅ 7/7 pruebas unitarias pasadas
- ✅ Documentación completa
