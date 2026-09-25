const nodeInterpreter = '/root/.nvm/versions/node/v16.20.2/bin/node';
module.exports = {
    apps: [
        {
            name: 'socket_repotencia',
            script: './src/main.js',
            cwd: __dirname,
            ...(nodeInterpreter ? { interpreter: nodeInterpreter } : {}),
            instances: '1',
            exec_mode: 'fork',
            watch: false,
            ignore_watch: ['public/uploads', 'node_modules'],
            kill_timeout: 5000,
            listen_timeout: 10000,
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
//# sourceMappingURL=ecosystem.config.js.map