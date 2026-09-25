// Intérprete de Node opcional para PM2 (p. ej. una versión concreta de nvm).
// El path se deja FUERA del repo para no atarlo a una máquina:
//   PM2_NODE_INTERPRETER=/root/.nvm/versions/node/vX/bin/node pm2 start ecosystem.config.js --env production
const nodeInterpreter = process.env.PM2_NODE_INTERPRETER;

module.exports = {
  apps: [
    {
      name: 'socket_repotencia',
      // En la rama "dist" desplegada se copia el contenido de dist/ a la raíz
      // del proyecto, así que el entry compilado queda en ./src/main.js.
      script: './src/main.js',
      // cwd explícito = carpeta de este archivo = raíz del despliegue.
      // De aquí dependen: .env (dotenv/ConfigModule), client/ (ServeStatic),
      // config/keys/ y public/. Sin esto, PM2 usa el cwd desde donde se
      // ejecutó `pm2 start` y esas rutas relativas pueden no resolverse.
      cwd: __dirname,
      ...(nodeInterpreter ? { interpreter: nodeInterpreter } : {}),
      instances: '1', // Número de instancias, 'max' para utilizar todos los núcleos de CPU
      exec_mode: 'fork', // Modo cluster para aprovechar múltiples núcleos
      // Sin watch en PM2: cada cambio reiniciaba el proceso y abría un pool nuevo.
      // En desarrollo se usa `npm run start:dev` (nest --watch).
      watch: false,
      ignore_watch: ['public/uploads', 'node_modules'],
      // Da tiempo al SIGINT para cerrar el pool antes del SIGKILL de PM2
      kill_timeout: 5000,
      listen_timeout: 10000,
      // env_* SOLO para variables de proceso. DATABASE_*, DB_POOL_*, SERVICE_AUTH_TOKEN
      // y JWT_ISSUERS viven en el .env del servidor (única fuente de verdad):
      // PM2 no sobreescribe, pero una clave definida aquí (aunque sea vacía)
      // impide que @nestjs/config/dotenv la rellene desde .env.
      env_development: {
        NODE_ENV: 'development',
        DEBUG: '*',
        PORT: 3009,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3009,
      },
    },
  ],
};
