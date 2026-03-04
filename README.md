# Auth Service

Microservicio de autenticación basado en NestJS. Proporciona registro, login, refresh de tokens JWT y validación para uso en otras aplicaciones o microservicios.

## Requisitos previos

- **Node.js** 18+
- **PostgreSQL** 16+
- **Yarn** o npm

## Configuración

### Variables de entorno

Copia `.env.example` a `.env` y ajusta los valores:

```bash
cp .env.example .env
```

| Variable | Descripción | Default |
|----------|-------------|---------|
| `PORT` | Puerto del servicio (3005 local, 3000 en Docker) | `3005` |
| `DB_HOST` | Host de PostgreSQL | `localhost` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_USER` / `DB_USERNAME` | Usuario de la base de datos | `postgres` |
| `DB_PASSWORD` | Contraseña de PostgreSQL | `postgres` |
| `DB_NAME` | Nombre de la base de datos | `auth_db` |
| `JWT_SECRET` | Clave secreta para firmar JWTs (**obligatorio en producción**) | - |
| `CORS_ORIGIN` | Orígenes permitidos (separados por coma). `*` = todos | `*` |

## Instalación y ejecución

### Desarrollo local

```bash
# Instalar dependencias
yarn install

# Levantar PostgreSQL (si usas Docker)
docker compose up -d postgres

# Ejecutar migraciones
yarn migration:run

# (Opcional) Ejecutar seeders (roles, etc.)
yarn seed

# Iniciar en modo desarrollo
yarn start:dev
```

El servicio estará disponible en `http://localhost:3005`.

### Con Docker

```bash
# Levantar todo (PostgreSQL + auth-service)
# Las migraciones se ejecutan automáticamente al iniciar el contenedor
docker compose up -d

# Ver logs
docker compose logs -f auth-service
```

En Docker el puerto por defecto es `3000`. Las migraciones se ejecutan automáticamente al iniciar `auth-service`.

**Si las migraciones desde el host fallan** (ej. problemas de conexión a localhost:5432), puedes ejecutarlas desde dentro del contenedor:

```bash
# Ejecutar migraciones dentro del contenedor (conecta a postgres via red Docker)
yarn migration:run:docker
```

### Producción

```bash
yarn build
yarn start:prod
```

## API

Base URL: `http://localhost:3005/api/v1` (o el host/puerto configurado)

### Documentación Swagger

Disponible en: **`/api/docs`**

### Endpoints

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `POST` | `/auth/login` | Iniciar sesión | No |
| `POST` | `/auth/register` | Registrar usuario | No |
| `POST` | `/auth/refresh` | Renovar tokens | No |
| `POST` | `/auth/logout` | Cerrar sesión | Bearer |
| `GET` | `/auth/validate` | Validar token (para microservicios) | Bearer |

### Detalle de requests/responses

#### `POST /auth/login`

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response 200:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### `POST /auth/refresh`

**Body:**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "refreshToken": "token-recibido-en-login"
}
```

#### `GET /auth/validate` (para otros microservicios)

**Header:**
```
Authorization: Bearer <accessToken>
```

**Response 200:**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "isActive": true,
  "roles": ["user"],
  "apps": ["ledgerflow"]
}
```

### Payload del JWT (accessToken)

El accessToken incluye la siguiente información firmada:

```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "isActive": true,
  "roles": ["user"],
  "apps": ["ledgerflow"],
  "iat": 1708100000,
  "exp": 1708100900
}
```

- `sub`: ID del usuario
- `email`: Email del usuario
- `isActive`: Indica si el usuario está activo
- `roles`: Roles asignados al usuario
- `apps`: Apps a las que tiene acceso (derivadas de los roles)

---

## Uso desde otras apps o microservicios

### Flujo general

```
┌─────────────┐     POST /auth/login      ┌──────────────┐
│   Frontend  │ ────────────────────────► │ auth-service │
│  (usuario)  │ ◄──────────────────────── │              │
└─────────────┘   { accessToken,          └──────────────┘
       │           refreshToken }
       │
       │  Envía token en cada request
       ▼
┌─────────────────┐   GET /auth/validate   ┌──────────────┐
│ Otro servicio   │   Authorization:       │ auth-service │
│ (API Gateway,   │   Bearer <token>      │              │
│  microservicio) │ ───────────────────►  │ Valida JWT   │
└─────────────────┘ ◄───────────────────  │ Retorna user │
                    { userId, email,       └──────────────┘
                      isActive, roles,
                      apps }
```

### 1. Login desde frontend o app

El usuario inicia sesión y recibe los tokens:

```javascript
const response = await fetch('http://auth-service:3005/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
  }),
});

const { accessToken, refreshToken } = await response.json();
// Guardar accessToken (ej. en memoria, localStorage, cookie)
// Guardar refreshToken y userId para renovar
```

### 2. Validar token desde otro microservicio

Cuando un request llega a tu microservicio con `Authorization: Bearer <token>`, valida el token contra el auth-service:

```javascript
// Node.js / NestJS
async function validateUserToken(authHeader: string) {
  const response = await fetch('http://auth-service:3005/api/v1/auth/validate', {
    headers: {
      Authorization: authHeader,
    },
  });

  if (!response.ok) {
    throw new UnauthorizedException('Token inválido o expirado');
  }

  return response.json(); // { userId, email, isActive, roles, apps }
}
```

```javascript
// Ejemplo con axios
const { data } = await axios.get('http://auth-service:3005/api/v1/auth/validate', {
  headers: {
    Authorization: req.headers.authorization,
  },
});
// data = { userId, email, isActive, roles, apps }
```

### 3. Middleware de validación (ejemplo NestJS)

```typescript
// En tu otro microservicio
@Injectable()
export class AuthValidationGuard implements CanActivate {
  constructor(private httpService: HttpService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token requerido');
    }

    const authUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3005/api/v1';
    const { data } = await firstValueFrom(
      this.httpService.get(`${authUrl}/auth/validate`, {
        headers: { Authorization: authHeader },
      }),
    );

    request.user = data; // { userId, email, isActive, roles, apps }
    return true;
  }
}
```

### 4. Renovar token (refresh)

Cuando el `accessToken` expire (15 min por defecto), usa el `refreshToken`:

```javascript
const response = await fetch('http://auth-service:3005/api/v1/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: '550e8400-e29b-41d4-a716-446655440000',
    refreshToken: refreshToken,
  }),
});

const { accessToken, refreshToken } = await response.json();
// Actualizar tokens almacenados
```

### Variables recomendadas para consumidores

| Variable | Descripción |
|----------|-------------|
| `AUTH_SERVICE_URL` | URL base del auth-service (ej. `http://auth-service:3005/api/v1`) |

---

## Health y métricas

| Ruta | Descripción |
|------|-------------|
| `/health` | Health check básico |
| `/health/ready` | Readiness (incluye conexión a BD) |
| `/metrics` | Métricas Prometheus |

---

## Tests

Los tests usan `.env.test` para la configuración (copia de `.env.example` con `DB_NAME=auth_db` por defecto).

```bash
# Tests unitarios (AuthService, AuthController, HealthController)
yarn test

# Tests E2E (health, docs, metrics, flujo auth completo)
yarn test:e2e

# Cobertura
yarn test:cov
```

**Requisitos para E2E:** PostgreSQL en ejecución con la base de datos configurada en `.env.test`. Ejecutar migraciones antes: `yarn migration:run`.

---

## Scripts disponibles

| Comando | Descripción |
|--------|-------------|
| `yarn start` | Iniciar en modo normal |
| `yarn start:dev` | Iniciar en modo watch |
| `yarn start:prod` | Iniciar en producción |
| `yarn build` | Compilar |
| `yarn migration:run` | Ejecutar migraciones (desde host, requiere PostgreSQL accesible en localhost) |
| `yarn migration:run:docker` | Ejecutar migraciones dentro del contenedor Docker |
| `yarn migration:revert` | Revertir última migración |
| `yarn seed` | Ejecutar seeders |
| `yarn test` | Tests unitarios |
| `yarn test:e2e` | Tests E2E |
| `yarn test:cov` | Tests con cobertura |

---

## Licencia

UNLICENSED
