# CLIENTS.md — Contrato para clientes y plataformas emisoras

El servicio de web-sockets valida JWT firmados por las plataformas confiables declaradas
en la variable de entorno `JWT_ISSUERS` y **deriva la identidad del payload firmado** del
token. Lo que un cliente declare en `userConected` es ignorado.

## Registro de emisores

Cada plataforma confiable se declara en `JWT_ISSUERS` (JSON en `.env`):

```json
JWT_ISSUERS=[
  {
    "iss": "repotencia",
    "algo": "RS256",
    "publicKey": "config/keys/repotencia-public.pem",
    "idClaim": "user.id_usuario",
    "nameClaim": "user.nombre_usuario"
  }
]
```

- `algo` con clave pública (`publicKey`, algoritmos asimétricos como RS256/ES256) o
  `secret` (HMAC simétricos, p. ej. HS256).
- `idClaim` / `nameClaim`: rutas JSON (con puntos) donde el servicio extrae el id y el
  nombre de usuario del payload firmado.
- El claim `iss` del token es **informativo**: el emisor se selecciona por coincidencia
  exacta o por prefijo del `iss`, y como último recurso se prueba la firma contra cada
  emisor registrado (con claves asimétricas la firma es inequívoca). Útil cuando el
  emisor usa URLs variables como `iss` (p. ej. tymon/jwt-auth usa la URL de la petición).

## Contrato de conexión (igual para todas las plataformas)

1. Conexión con el cliente oficial de socket.io (web, Android, iOS, Flutter):

```js
const socket = io('https://<host>:3009/notifications', {
  transports: ['websocket'],
  auth: { token: '<JWT de la plataforma>' },
});
```

2. El token debe estar firmado por un emisor registrado (`iss`), vigente (`exp`), y
   contener los claims mapeados a identidad. Sin token válido → `connect_error` con
   mensaje `unauthorized`.
3. Tras conectar, emitir `userConected` (sin argumentos) para registrarse; el backend
   deriva `userId`/`userName` del token y une al socket a las rooms:

   - `user:<iss>:<id_usuario>`
   - `userName:<iss>:<nombre_usuario>`

   Los ids se **califican por emisor** para evitar colisiones entre plataformas.

## Eventos

### Namespace `/notifications`

| Evento             | Dirección  | Payload                                              |
|--------------------|-----------|------------------------------------------------------|
| `userConected`     | cliente → servidor | `{}` (identidad tomada del token)          |
| `sentNotification` | servidor → cliente | `{ notification, type, data: { user_name, data: [...] } }` |
| `eventMarkedDone`  | cliente → servidor | `{ eventId }` (relay a todas las sesiones del usuario) |
| `eventMarkedDone`  | servidor → cliente | `{ eventId }`                                 |

### Namespace `/chat`

Mismo esquema de autenticación. `userConected` registra el socket en el namespace `chat`.

## Emisión de notificaciones (servicios / M2M)

Los sistemas emisores no usan sockets: llaman a la API HTTP con el body:

```json
POST /api/send-notification
{
  "notification": "...",
  "type": "calendar",
  "issuer": "repotencia",
  "context": [ { "user_name": "<nombre_usuario>", "data": [...] } ]
}
```

`issuer` es opcional (default `repotencia`) y determina el prefijo de las rooms de
destino (`userName:<iss>:<user_name>`).
