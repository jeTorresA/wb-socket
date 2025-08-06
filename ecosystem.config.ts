module.exports = {
    apps: [
      {
        name: 'socket_repotencia',
        script: './src/main.js', // Archivo principal de tu aplicación
        instances: '1', // Número de instancias, 'max' para utilizar todos los núcleos de CPU
        exec_mode: 'fork', // Modo cluster para aprovechar múltiples núcleos
        watch: true,
        ignore_watch: ['public/uploads', 'node_modules'],
        env_development: {
            NODE_ENV: 'development',
            DEBUG: '*',
            PORT: 3009,
            DATABASE_HOST: '127.0.0.1',
            DATABASE_PORT: 3306,
            DATABASE_USERNAME: 'gc',
            DATABASE_PASSWORD: 'avisgc',
            DATABASE_NAME: 'gc'
        },
        env_production: {
            NODE_ENV: 'production',
            PORT: 3009,
            DATABASE_HOST: '',
            DATABASE_PORT: 3306,
            DATABASE_USERNAME: '',
            DATABASE_PASSWORD: '',
            DATABASE_NAME: ''
        },        
      },
    ],
  };
  