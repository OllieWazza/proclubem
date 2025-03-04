const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: '*',  // Allow all origins for now
        methods: ["GET", "POST", "OPTIONS"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"]
    },
    path: '/socket.io',
    transports: ['websocket'],
    pingInterval: 10000,
    pingTimeout: 5000,
    connectTimeout: 45000
});

// Enable trust proxy for secure WebSocket behind proxy
app.enable('trust proxy');
app.set('trust proxy', 1);

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Max-Age', '86400');
        return res.status(200).end();
    }
    
    // Handle WebSocket upgrade requests
    if (req.headers.upgrade && req.headers.upgrade.toLowerCase() === 'websocket') {
        res.header('Connection', 'Upgrade');
        res.header('Upgrade', 'websocket');
    }
    
    // Redirect HTTP to HTTPS in production
    if (req.headers['x-forwarded-proto'] !== 'https' && process.env.NODE_ENV === 'production') {
        return res.redirect('https://' + req.headers.host + req.url);
    }
    
    next();
});

// Serve static files with appropriate headers
app.get('/socket.io/socket.io.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(require.resolve('socket.io/client-dist/socket.io.js'));
});

// Serve static files with caching
app.use(express.static('public', {
    maxAge: '1h',
    setHeaders: function(res, path) {
        if (path.endsWith('.js')) {
            res.setHeader('Cache-Control', 'public, max-age=3600');
        }
    }
}));

// Game state
const gameState = {
    players: new Map(),
    ball: {
        x: 0,
        y: 0,
        z: 0,
        velocityX: 0,
        velocityY: 0,
        velocityZ: 0
    },
    scores: {
        blue: 0,
        red: 0
    }
};

// Player template
const createPlayer = (id, team) => ({
    id,
    team,
    x: team === 'blue' ? -10 : 10,  // Start position based on team
    y: 0,
    z: 0,
    rotation: 0,
    health: 100,
    stamina: 100,
    isStunned: false
});

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    // Assign team based on current player count
    const team = gameState.players.size % 2 === 0 ? 'blue' : 'red';
    const newPlayer = createPlayer(socket.id, team);
    
    // Add the new player to the game state
    gameState.players.set(socket.id, newPlayer);
    
    // Send the complete game state including the new player
    const gameStateToSend = {
        players: Array.from(gameState.players.values()),
        ball: gameState.ball,
        scores: gameState.scores,
        yourId: socket.id
    };
    socket.emit('gameState', gameStateToSend);
    
    // Broadcast the new player to all other clients
    socket.broadcast.emit('playerJoined', newPlayer);

    // Handle player movement
    socket.on('playerUpdate', (data) => {
        const player = gameState.players.get(socket.id);
        if (player) {
            Object.assign(player, data);
            socket.broadcast.emit('playerMoved', { id: socket.id, ...data });
        }
    });

    // Handle ball updates
    socket.on('ballUpdate', (data) => {
        Object.assign(gameState.ball, data);
        socket.broadcast.emit('ballMoved', data);
    });

    // Handle combat actions
    socket.on('combat', (data) => {
        const { type, targetId, damage, knockback } = data;
        const target = gameState.players.get(targetId);
        if (target) {
            target.health = Math.max(0, target.health - damage);
            
            // Apply knockback to target's position
            if (knockback) {
                target.x += knockback.x;
                target.y += knockback.y;
                target.z += knockback.z;
            }
            
            // Broadcast damage and position update
            io.emit('playerDamaged', { 
                id: targetId, 
                health: target.health,
                position: {
                    x: target.x,
                    y: target.y,
                    z: target.z
                },
                knockback: knockback
            });
            
            if (target.health <= 0) {
                // Handle player death and respawn
                const respawnPosition = target.team === 'blue' ? 
                    { x: -140, y: 1, z: 0 } : 
                    { x: 140, y: 1, z: 0 };
                
                // Update player state
                target.health = 100;
                target.x = respawnPosition.x;
                target.y = respawnPosition.y;
                target.z = respawnPosition.z;
                
                // Broadcast respawn
                io.emit('playerRespawned', {
                    id: targetId,
                    position: respawnPosition,
                    health: 100
                });
            }
        }
    });

    // Handle player respawn request
    socket.on('playerRespawn', (data) => {
        const player = gameState.players.get(data.id);
        if (player) {
            player.health = 100;
            player.x = data.position.x;
            player.y = data.position.y;
            player.z = data.position.z;
            io.emit('playerRespawned', {
                id: data.id,
                position: data.position,
                health: 100
            });
        }
    });

    // Handle goal scored
    socket.on('goalScored', (team) => {
        gameState.scores[team]++;
        io.emit('scoreUpdate', gameState.scores);

        // Check for game reset (score of 20)
        if (gameState.scores[team] >= 20) {
            gameState.scores.blue = 0;
            gameState.scores.red = 0;
            io.emit('gameReset', gameState.scores);
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        gameState.players.delete(socket.id);
        io.emit('playerDisconnected', socket.id);
    });
});

// Add a route to check server status
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        environment: process.env.NODE_ENV || 'development',
        port: PORT,
        socketEnabled: true,
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`Socket.IO server available at ${process.env.NODE_ENV === 'production' ? 'https://proclubem-production.up.railway.app' : 'http://localhost:' + PORT}`);
}); 