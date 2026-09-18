module.exports = {
    apps: [
        {
            name: 'socket_repotencia',
            script: './src/main.js',
            instances: '1',
            exec_mode: 'fork',
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
                DATABASE_NAME: '',
                JWT_ISSUERS: '[{"iss":"repotencia","algo":"RS256","publicKey":"config/keys/repotencia-public.pem","idClaim":"user.id_usuario","nameClaim":"user.nombre_usuario"}]'
            },
        },
    ],
};
//# sourceMappingURL=ecosystem.config.js.map