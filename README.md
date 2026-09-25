<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).

## Despliegue y operación (PM2)

### ¿Qué es `ecosystem.config.ts`?
Es **configuración de PM2, no de la aplicación**. Ningún archivo de `src/` lo lee; su único
efecto es cuando PM2 arranca el proceso: `name`, `script`, `cwd`, `exec_mode`, `watch`,
`kill_timeout`, y las variables de `env_development` / `env_production` que PM2 inyecta en el
`process.env` del proceso hijo. Es un mecanismo de **arranque**, no de configuración de la app.

### ¿Por qué está configurado así?
- **`script: './src/main.js'`** — el deploy (`npm run deploy:dist`) publica en la rama `dist` el
  contenido de `dist/` **aplanado en la raíz**, así que el entry compilado queda en
  `./src/main.js`. Por eso `npm start:prod` (`node dist/main`) **no** aplica en el servidor.
- **`cwd: __dirname`** — la carpeta de este archivo es la raíz del despliegue. De ahí dependen
  rutas relativas: `.env` (dotenv / `ConfigModule`), `client/` (`ServeStaticModule`),
  `config/keys/` y `public/`. Sin fijarlo, PM2 usa el directorio desde donde se ejecutó
  `pm2 start`, y esas rutas pueden no resolverse.
- **`watch: false`** — en producción, `watch` reiniciaba el proceso ante cualquier cambio,
  abriendo un pool de conexiones nuevo cada vez. En desarrollo se usa `npm run start:dev`
  (`nest --watch`).
- **`kill_timeout: 5000`** — da margen al `SIGINT` para cerrar el pool de MySQL antes del
  `SIGKILL`. El cierre ordenado está en `src/main.ts`: `app.close()` dispara
  `onApplicationShutdown` de `@nestjs/typeorm`, que ejecuta `dataSource.destroy()` →
  `pool.end()`.
- **`env_*` solo con variables de proceso** (`NODE_ENV`, `PORT`, `DEBUG`). `DATABASE_*`,
  `DB_POOL_*`, `SERVICE_AUTH_TOKEN` y `JWT_ISSUERS` viven en el **`.env` del servidor**.
  Motivo: `@nestjs/config`/`dotenv` solo rellenan claves que **no** existan ya en
  `process.env`; una clave definida en el ecosystem —aunque sea con `''`— impide que el `.env`
  la sobreescriba.
- **Driver y pool de MySQL** — `db/data-source.ts` usa `connectorPackage: 'mysql2'` y configura
  el pool (`poolSize`, `maxIdle`, `idleTimeout`, `keepAlive`) para que las conexiones idle se
  cierren en vez de quedar abiertas.
- **`interpreter` (opcional)** — fija el binario de Node con el que PM2 lanza el proceso. El
  path **no se versiona** para no atarlo a una máquina; se pasa por entorno:
  ```bash
  PM2_NODE_INTERPRETER=/root/.nvm/versions/node/vX/bin/node pm2 start ecosystem.config.js --env production
  ```
  Si no se define, PM2 usa el Node de su propio daemon.

> **Importante:** `package.json` y `ecosystem.config.js` del servidor son archivos versionados:
> **los cambios hechos a mano en el servidor se pierden** en el próximo `git pull` /
> `git reset --hard origin/dist`. Cualquier ajuste debe hacerse en el código fuente (y
> redesplegarse), o pasarse por variables de entorno.

### Arranque en producción
```bash
cd /ruta/al/deploy          # raíz de la rama dist en el servidor
npm ci --omit=dev           # el deploy solo trae package.json / package-lock.json
pm2 start ecosystem.config.js --env production
```
`--env production` es obligatorio: de ahí sale `NODE_ENV=production`, que `src/main.ts` usa para
elegir los certificados (`config/keys/llave.key` + `certificado.crt` en prod) y que evita que
TypeORM active `synchronize`.

El payload del deploy es: el contenido de `dist/` aplanado en la raíz (`src/`, `db/`,
`ecosystem.config.js`), `client/`, `package.json`, `package-lock.json`, `index.html` y
`.gitignore`. No incluye `node_modules/`, `.env`, `config/` ni `public/uploads/`: esos hay que
crearlos en el servidor.

### Actualizar un despliegue
```bash
git fetch origin dist
git reset --hard origin/dist
npm ci --omit=dev

pm2 restart socket_repotencia    # si solo cambió .env
# si cambió ecosystem.config.js, hay que releerlo:
pm2 delete socket_repotencia && pm2 start ecosystem.config.js --env production
```
`pm2 restart --update-env` relee las variables de PM2, **no** el `.env` (ese lo lee dotenv al
arrancar la app).

### Persistencia tras reiniciar el servidor
```bash
pm2 startup     # ejecuta el comando que imprime
pm2 save
```

### Verificar
```bash
pm2 describe socket_repotencia   # cwd = raíz del deploy, script ./src/main.js
pm2 env <id>                     # entorno efectivo del proceso
pm2 logs socket_repotencia       # "Listen on port 3009" y "ISSUERS DE JWT CARGADOS: ..."
```

## Base de datos y migraciones

El proyecto usa TypeORM con MySQL. La conexión se define en `db/data-source.ts` y toma las
credenciales de las variables de entorno (`DATABASE_*`), que carga `dotenv`.

### En desarrollo
Los scripts usan el data-source en TypeScript (`db/data-source.ts`) con `ts-node`:

```bash
npm run migration:show      # lista pendientes vs. ejecutadas
npm run migration:generate -- db/migrations/NombreDeLaMigracion   # hace build antes de generar
npm run migration:run       # ejecuta las pendientes
npm run migration:revert    # revierte la última
npm run typeorm -- migration:show   # equivalente directo
```

### En producción
En el servidor los artefactos ya están compilados (`db/data-source.js`, `db/migrations/*.js`,
`src/entities/*.entity.js`) y `ts-node` **no está instalado** (`npm ci --omit=dev`), así que se
usa el CLI `typeorm` directo contra el `.js`:

```bash
cd /ruta/al/deploy
npx typeorm -d db/data-source.js migration:show
npx typeorm -d db/data-source.js migration:run
npx typeorm -d db/data-source.js migration:revert
```

> No uses `typeorm-ts-node-commonjs` en producción: requiere `ts-node`, que es una
> devDependency. Y `-d db/data-source.js` solo es válido en la rama `dist` desplegada; en el
> repo fuente el compilado vive en `dist/db/data-source.js`.