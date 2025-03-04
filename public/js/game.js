class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('gameCanvas'),
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x87CEEB); // Sky blue color
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Socket.IO connection with Railway configuration
        const serverUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : 'https://proclubem-production.up.railway.app';
            
        this.socket = io(serverUrl, {
            path: '/socket.io/',
            transports: ['websocket', 'polling'],
            upgrade: true,
            rememberUpgrade: true,
            secure: true,
            rejectUnauthorized: false,
            withCredentials: true,
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 45000,
            forceNew: true
        });
        this.players = new Map();
        this.localPlayer = null;
        this.ball = null;

        // FPS tracking
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        this.lastFpsUpdate = 0;

        // Initialize game components
        this.setupLighting();
        this.setupEventListeners();
        this.initializeSocketListeners();

        // Initialize stadium
        this.stadium = new Stadium(this.scene);

        // Set initial camera position
        this.camera.position.set(0, 30, 50);
        this.camera.lookAt(0, 0, 0);

        // Start game loop
        this.animate();
    }

    setupLighting() {
        // Ambient light
        const ambient = new THREE.AmbientLight(0xffffff, 0.7); // Increased intensity
        this.scene.add(ambient);

        // Directional light (sun)
        const directional = new THREE.DirectionalLight(0xffffff, 1.0); // Increased intensity
        directional.position.set(100, 150, 0);
        directional.castShadow = true;
        
        // Adjust shadow camera for larger field
        directional.shadow.camera.left = -100;
        directional.shadow.camera.right = 100;
        directional.shadow.camera.top = 100;
        directional.shadow.camera.bottom = -100;
        directional.shadow.camera.far = 300;
        directional.shadow.mapSize.width = 2048;
        directional.shadow.mapSize.height = 2048;
        
        this.scene.add(directional);
    }

    setupEventListeners() {
        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Handle pointer lock for mouse control
        const canvas = this.renderer.domElement;
        canvas.addEventListener('click', () => {
            canvas.requestPointerLock();
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                document.exitPointerLock();
            }
        });
    }

    initializeSocketListeners() {
        // Debug connection status
        this.socket.on('connect', () => {
            console.log('Connected to server successfully');
            console.log('Transport:', this.socket.io.engine.transport.name);
            console.log('Protocol:', window.location.protocol);
            console.log('Host:', window.location.host);
            document.getElementById('instructions').style.display = 'block';
            console.log('Current players:', Array.from(this.players.keys()));
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            document.getElementById('instructions').innerHTML += '<p style="color: red">Connection error. Please refresh the page.</p>';
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Disconnected from server:', reason);
            console.log('Clearing all players...');
            // Clear all players on disconnect
            this.players.forEach(player => {
                if (player.mesh) {
                    this.scene.remove(player.mesh);
                }
            });
            this.players.clear();
            this.localPlayer = null;
            console.log('Players cleared');
        });

        // Handle initial game state
        this.socket.on('gameState', (state) => {
            console.log('\n=== Received Game State ===');
            console.log('Your ID:', state.yourId);
            console.log('Number of players in state:', state.players.length);
            console.log('Player IDs in state:', state.players.map(p => p.id));
            
            try {
                // Initialize players from game state
                state.players.forEach(playerData => {
                    if (playerData.id === state.yourId) {
                        // Create local player
                        console.log('\nCreating local player:', playerData);
                        this.localPlayer = new Player(playerData, true);
                        if (!this.localPlayer.mesh) {
                            console.error('Failed to create local player mesh!');
                            return;
                        }
                        console.log('Local player mesh created at position:', this.localPlayer.mesh.position);
                        this.scene.add(this.localPlayer.mesh);
                        this.players.set(playerData.id, this.localPlayer);
                    } else {
                        // Create remote players
                        console.log('\nCreating remote player:', playerData);
                        const player = new Player(playerData, false);
                        if (!player.mesh) {
                            console.error('Failed to create remote player mesh!');
                            return;
                        }
                        console.log('Remote player mesh created at position:', player.mesh.position);
                        this.scene.add(player.mesh);
                        this.players.set(playerData.id, player);
                    }
                });

                console.log('\nPlayers after initialization:');
                console.log('Total players:', this.players.size);
                console.log('Player IDs:', Array.from(this.players.keys()));
                console.log('Local player ID:', this.localPlayer ? this.localPlayer.id : 'none');
                
                // Initialize ball
                if (!this.ball && state.ball) {
                    this.ball = new Ball(state.ball);
                    this.scene.add(this.ball.mesh);
                    console.log('Ball initialized at position:', this.ball.mesh.position);
                }

                // Update score display
                if (state.scores) {
                    this.updateScore(state.scores);
                }
                
                // Update player count
                document.getElementById('playerCount').textContent = this.players.size;
            } catch (error) {
                console.error('Error processing game state:', error);
                console.error('Stack trace:', error.stack);
            }
        });

        this.socket.on('playerJoined', (playerData) => {
            console.log('\n=== Player Joined ===');
            console.log('New player data:', playerData);
            console.log('Current players before adding:', Array.from(this.players.keys()));
            
            try {
                if (!playerData || !playerData.id) {
                    console.error('Invalid player data received:', playerData);
                    return;
                }

                if (this.players.has(playerData.id)) {
                    console.log('Player already exists:', playerData.id);
                    return;
                }

                console.log('Creating new remote player:', playerData);
                const newPlayer = new Player(playerData, false);
                
                if (!newPlayer.mesh) {
                    console.error('Failed to create player mesh for:', playerData.id);
                    return;
                }

                console.log('Adding new player to scene:', playerData.id);
                this.scene.add(newPlayer.mesh);
                this.players.set(playerData.id, newPlayer);
                
                console.log('Players after adding new player:');
                console.log('Total players:', this.players.size);
                console.log('Player IDs:', Array.from(this.players.keys()));
                console.log('New player position:', newPlayer.mesh.position);
                
                document.getElementById('playerCount').textContent = this.players.size;
            } catch (error) {
                console.error('Error handling player join:', error);
                console.error('Stack trace:', error.stack);
            }
        });

        this.socket.on('playerMoved', (data) => {
            try {
                const player = this.players.get(data.id);
                if (player && !player.isLocal) {
                    player.updatePosition(data);
                }
            } catch (error) {
                console.error('Error handling player movement:', error);
            }
        });

        this.socket.on('ballMoved', (ballData) => {
            if (this.ball) {
                this.ball.updatePosition(ballData);
            }
        });

        this.socket.on('playerDisconnected', (playerId) => {
            const player = this.players.get(playerId);
            if (player) {
                this.scene.remove(player.mesh);
                this.players.delete(playerId);
                // Update player count
                document.getElementById('playerCount').textContent = this.players.size;
            }
        });

        this.socket.on('playerDamaged', (data) => {
            const player = this.players.get(data.id);
            if (player) {
                player.updateHealth(data.health);
                
                // Apply knockback if provided
                if (data.knockback && data.position) {
                    player.mesh.position.set(
                        data.position.x,
                        data.position.y,
                        data.position.z
                    );
                }
            }
        });

        this.socket.on('scoreUpdate', (scores) => {
            this.updateScore(scores);
        });

        // Handle player respawn
        this.socket.on('playerRespawned', (data) => {
            const player = this.players.get(data.id);
            if (player) {
                player.health = data.health;
                player.mesh.position.set(
                    data.position.x,
                    data.position.y,
                    data.position.z
                );
            }
        });
    }

    updateScore(scores) {
        document.getElementById('score').textContent = `Blue: ${scores.blue} - Red: ${scores.red}`;
    }

    updateHealthBar(health) {
        document.querySelector('#healthBar .fill').style.width = `${health}%`;
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Debug log player positions periodically
        if (this.frameCount % 60 === 0) { // Once per second at 60fps
            this.players.forEach((player, id) => {
                if (player.mesh) {
                    console.log(`Player ${id} position:`, player.mesh.position);
                }
            });
        }

        // Calculate FPS
        const now = performance.now();
        this.frameCount++;
        
        // Update FPS counter every second
        if (now - this.lastFpsUpdate >= 1000) {
            const fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
            document.getElementById('fpsCounter').textContent = fps;
            this.frameCount = 0;
            this.lastFpsUpdate = now;
        }

        if (this.localPlayer) {
            // Update local player
            this.localPlayer.update();
            
            // Update camera position to follow player with vertical rotation
            const playerPos = this.localPlayer.mesh.position;
            const cameraOffset = new THREE.Vector3(0, 2, 8); // Base camera offset
            
            // Apply vertical rotation first
            const verticalQuat = new THREE.Quaternion();
            verticalQuat.setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.localPlayer.verticalRotation);
            cameraOffset.applyQuaternion(verticalQuat);
            
            // Then apply horizontal rotation from player's mesh
            cameraOffset.applyQuaternion(this.localPlayer.mesh.quaternion);
            
            // Ensure camera doesn't go below ground level
            const minCameraHeight = 0.5; // Minimum height above ground
            const newCameraPos = playerPos.clone().add(cameraOffset);
            if (newCameraPos.y < minCameraHeight) {
                // Adjust camera height while maintaining distance
                const heightDiff = minCameraHeight - newCameraPos.y;
                newCameraPos.y = minCameraHeight;
                
                // Move camera slightly back to maintain viewing angle
                const backVector = new THREE.Vector3(0, 0, 1)
                    .applyQuaternion(this.localPlayer.mesh.quaternion)
                    .multiplyScalar(heightDiff);
                newCameraPos.add(backVector);
            }
            
            // Set camera position
            this.camera.position.copy(newCameraPos);
            
            // Make camera look at point in front of player
            const lookOffset = new THREE.Vector3(0, 1, -10);
            lookOffset.applyQuaternion(verticalQuat);
            lookOffset.applyQuaternion(this.localPlayer.mesh.quaternion);
            const lookTarget = playerPos.clone().add(lookOffset);
            
            // Ensure look target doesn't go below ground
            lookTarget.y = Math.max(0, lookTarget.y);
            this.camera.lookAt(lookTarget);

            // Emit player position to server
            this.socket.emit('playerUpdate', {
                x: playerPos.x,
                y: playerPos.y,
                z: playerPos.z,
                rotation: this.localPlayer.mesh.rotation.y
            });
        }

        // Update ball physics if it exists
        if (this.ball) {
            this.ball.update();
        }

        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize game when window loads
window.addEventListener('load', () => {
    window.game = new Game();
}); 