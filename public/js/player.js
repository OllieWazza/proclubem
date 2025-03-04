class Player {
    constructor(data, isLocal) {
        if (!data || !data.team) {
            console.error('Invalid player data:', data);
            throw new Error('Invalid player data');
        }

        this.id = data.id;
        this.team = data.team;
        this.isLocal = isLocal;
        this.health = 100;
        this.stamina = 100;
        this.isStunned = false;
        this.isSprinting = false;
        this.lastShot = 0;
        this.lastPunch = 0;
        this.devMode = false;
        this.verticalRotation = 0;
        this.isJumping = false;
        this.jumpVelocity = 0;
        this.height = 2; // Player height in meters
        this.groundLevel = 0; // Player starts at ground level

        try {
            // Create player mesh
            this.createPlayerMesh();
            
            if (!this.mesh) {
                throw new Error('Failed to create player mesh');
            }

            // Set initial position at ground level
            this.mesh.position.set(
                data.x || 0, 
                this.groundLevel + this.height/2, // Always at ground level + half height
                data.z || 0
            );
            
            if (data.rotation) {
                this.mesh.rotation.y = data.rotation;
            }

            // Ensure mesh is visible and has proper materials
            this.mesh.visible = true;
            this.mesh.traverse(child => {
                if (child instanceof THREE.Mesh) {
                    child.material.transparent = false;
                    child.material.opacity = 1;
                    child.material.needsUpdate = true;
                    child.visible = true;
                }
            });

            console.log(`Player ${this.id} created at position:`, this.mesh.position);
        } catch (error) {
            console.error('Error creating player:', error);
            throw error;
        }
        
        // Movement controls for local player
        if (isLocal) {
            this.moveSpeed = 0.6;
            this.sprintSpeed = 1.2;
            this.rotationSpeed = 0.004;
            this.controls = {
                forward: false,
                backward: false,
                left: false,
                right: false,
                sprint: false,
                jump: false
            };
            this.setupControls();
        }
    }

    createPlayerMesh() {
        try {
            // Create composite mesh for player
            this.mesh = new THREE.Group();

            const materials = [
                new THREE.MeshPhongMaterial({ 
                    color: this.team === 'blue' ? 0x0000ff : 0xff0000,
                    transparent: false,
                    opacity: 1
                }), // shirt
                new THREE.MeshPhongMaterial({ 
                    color: this.team === 'blue' ? 0xffffff : 0x000000,
                    transparent: false,
                    opacity: 1
                }), // shorts
                new THREE.MeshPhongMaterial({ 
                    color: this.team === 'blue' ? 0xff0000 : 0x000000,
                    transparent: false,
                    opacity: 1
                })  // socks
            ];

            // Body (shirt) - positioned relative to mesh center
            const torso = new THREE.Mesh(
                new THREE.BoxGeometry(1, 1.2, 0.5),
                materials[0]
            );
            torso.position.y = 0.2; // Adjusted to be relative to center
            this.mesh.add(torso);

            // Head
            const head = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 0.5, 0.5),
                new THREE.MeshPhongMaterial({ color: 0xffdbac })
            );
            head.position.y = 1.1; // Adjusted to be relative to center
            this.mesh.add(head);

            // Arms
            const armGeometry = new THREE.BoxGeometry(0.25, 0.8, 0.25);
            
            // Left arm
            const leftArm = new THREE.Mesh(armGeometry, materials[0]);
            leftArm.position.set(-0.625, 0.4, 0); // Adjusted Y to be relative to center
            this.mesh.add(leftArm);

            // Right arm
            const rightArm = leftArm.clone();
            rightArm.position.x = 0.625;
            rightArm.position.y = 0.4; // Adjusted Y to be relative to center
            this.mesh.add(rightArm);

            // Upper legs
            const upperLegGeometry = new THREE.BoxGeometry(0.3, 0.6, 0.3);
            
            // Left upper leg
            const leftUpperLeg = new THREE.Mesh(upperLegGeometry, materials[1]);
            leftUpperLeg.position.set(-0.2, -0.3, 0); // Adjusted Y to be relative to center
            this.mesh.add(leftUpperLeg);
            this.leftUpperLeg = leftUpperLeg;

            // Right upper leg
            const rightUpperLeg = leftUpperLeg.clone();
            rightUpperLeg.position.x = 0.2;
            rightUpperLeg.position.y = -0.3; // Adjusted Y to be relative to center
            this.mesh.add(rightUpperLeg);
            this.rightUpperLeg = rightUpperLeg;

            // Lower legs
            const lowerLegGeometry = new THREE.BoxGeometry(0.25, 0.6, 0.25);
            
            // Left lower leg
            const leftLowerLeg = new THREE.Mesh(lowerLegGeometry, materials[2]);
            leftLowerLeg.position.set(-0.2, -0.8, 0); // Adjusted Y to be relative to center
            this.mesh.add(leftLowerLeg);
            this.leftLowerLeg = leftLowerLeg;

            // Right lower leg
            const rightLowerLeg = leftLowerLeg.clone();
            rightLowerLeg.position.x = 0.2;
            rightLowerLeg.position.y = -0.8; // Adjusted Y to be relative to center
            this.mesh.add(rightLowerLeg);
            this.rightLowerLeg = rightLowerLeg;

            // Feet
            const footGeometry = new THREE.BoxGeometry(0.3, 0.15, 0.4);
            
            // Left foot
            const leftFoot = new THREE.Mesh(footGeometry, materials[2]);
            leftFoot.position.set(-0.2, -1.0, 0.05); // Adjusted Y to be relative to center
            this.mesh.add(leftFoot);

            // Right foot
            const rightFoot = leftFoot.clone();
            rightFoot.position.x = 0.2;
            rightFoot.position.y = -1.0; // Adjusted Y to be relative to center
            this.mesh.add(rightFoot);

            // Store references for animation
            this.leftArm = leftArm;
            this.rightArm = rightArm;

            // Enable shadows
            this.mesh.traverse(child => {
                if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
        } catch (error) {
            console.error('Error creating player mesh:', error);
            throw error;
        }
    }

    setupControls() {
        this.verticalRotation = 0;
        const maxVerticalRotation = Math.PI / 3; // 60 degrees
        
        // Check if we're on mobile
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                        window.innerWidth <= 800 || window.orientation !== undefined;

        // Add dev mode toggle
        document.addEventListener('keydown', (event) => {
            if (event.key.toLowerCase() === 'p') {
                this.devMode = !this.devMode;
                if (this.devMode) {
                    this.createDevOverlay();
                } else {
                    this.removeDevOverlay();
                }
            }
        });

        // Only set up desktop controls if not on mobile
        if (!this.isMobile) {
            // Mouse movement for camera rotation
            document.addEventListener('mousemove', (event) => {
                if (document.pointerLockElement === game.renderer.domElement) {
                    // Horizontal rotation
                    this.mesh.rotation.y -= event.movementX * this.rotationSpeed;
                    
                    // Vertical rotation with constraints
                    this.verticalRotation = Math.max(
                        -maxVerticalRotation,
                        Math.min(
                            maxVerticalRotation,
                            this.verticalRotation - event.movementY * this.rotationSpeed
                        )
                    );
                }
            });

            // Mouse click for kicking
            game.renderer.domElement.addEventListener('click', () => {
                if (!document.pointerLockElement) {
                    game.renderer.domElement.requestPointerLock();
                } else if (game.ball) {
                    const distanceToBall = this.mesh.position.distanceTo(game.ball.mesh.position);
                    if (distanceToBall < 2) {
                        game.ball.kick(this);
                    }
                }
            });

            // Movement and action controls
            document.addEventListener('keydown', (event) => {
                switch(event.key.toLowerCase()) {
                    case 'w': this.controls.forward = true; break;
                    case 's': this.controls.backward = true; break;
                    case 'a': this.controls.left = true; break;
                    case 'd': this.controls.right = true; break;
                    case 'shift': this.controls.sprint = true; break;
                    case ' ': 
                        if (!this.isJumping && this.stamina >= 15) {
                            this.jump();
                        }
                        break;
                }
            });

            document.addEventListener('keyup', (event) => {
                switch(event.key.toLowerCase()) {
                    case 'w': this.controls.forward = false; break;
                    case 's': this.controls.backward = false; break;
                    case 'a': this.controls.left = false; break;
                    case 'd': this.controls.right = false; break;
                    case 'shift': this.controls.sprint = false; break;
                }
            });

            // Combat controls
            document.addEventListener('keydown', (event) => {
                switch(event.key.toLowerCase()) {
                    case 'q': this.shoot(); break;
                    case 'f': this.punch(); break;
                }
            });
        }
    }

    jump() {
        if (!this.isJumping && this.mesh.position.y <= this.groundLevel + this.height/2 && this.stamina >= 15) {
            this.isJumping = true;
            this.jumpVelocity = 0.9; // Increased to 3x previous value (0.3 * 3)
            this.stamina -= 15;
        }
    }

    update() {
        if (!this.isLocal || this.isStunned) return;

        // Update dev overlay if active
        if (this.devMode) {
            const overlay = document.getElementById('devOverlay');
            if (overlay) {
                let info = 'Developer Mode:\n';
                info += `Player Position: (${this.mesh.position.x.toFixed(2)}, ${this.mesh.position.y.toFixed(2)}, ${this.mesh.position.z.toFixed(2)})\n`;
                if (game.ball) {
                    info += `Ball Position: (${game.ball.mesh.position.x.toFixed(2)}, ${game.ball.mesh.position.y.toFixed(2)}, ${game.ball.mesh.position.z.toFixed(2)})\n`;
                    info += `Distance to Ball: ${this.mesh.position.distanceTo(game.ball.mesh.position).toFixed(2)}\n`;
                }
                info += `Field Dimensions: 300x180\n`;
                info += `Goal Width: 14.64\n`;
                overlay.textContent = info;
            }
        }

        // Update stamina
        if (this.controls.sprint && this.stamina > 0) {
            this.stamina = Math.max(0, this.stamina - 1);
            this.isSprinting = true;
        } else if (!this.controls.sprint && this.stamina < 100) {
            this.stamina = Math.min(100, this.stamina + 0.5);
            this.isSprinting = false;
        }

        // Update stamina bar
        document.querySelector('#staminaBar .fill').style.width = `${this.stamina}%`;

        // Handle jumping and gravity
        if (this.isJumping) {
            this.mesh.position.y += this.jumpVelocity;
            this.jumpVelocity -= 0.06; // Increased gravity for faster fall

            // Check for landing
            if (this.mesh.position.y <= this.groundLevel + this.height/2) {
                this.mesh.position.y = this.groundLevel + this.height/2;
                this.isJumping = false;
                this.jumpVelocity = 0;
            }
        } else {
            // Ensure player is at correct height when not jumping
            this.mesh.position.y = this.groundLevel + this.height/2;
        }

        const speed = this.isSprinting && this.stamina > 0 ? this.sprintSpeed : this.moveSpeed;
        const direction = new THREE.Vector3();

        // Calculate movement direction relative to camera
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(this.mesh.quaternion);
        forward.y = 0; // Keep movement horizontal
        forward.normalize();

        const right = new THREE.Vector3(1, 0, 0);
        right.applyQuaternion(this.mesh.quaternion);
        right.y = 0;
        right.normalize();

        if (this.controls.forward) direction.add(forward);
        if (this.controls.backward) direction.sub(forward);
        if (this.controls.left) direction.sub(right);
        if (this.controls.right) direction.add(right);

        // Only animate if moving
        if (direction.length() > 0) {
            direction.normalize();
            this.mesh.position.add(direction.multiplyScalar(speed));

            // Animate legs while moving
            const time = Date.now() * 0.005;
            const legMovement = Math.sin(time) * 0.6;
            const runningBob = Math.abs(Math.sin(time * 2)) * 0.3;

            // Running animation
            if (this.isSprinting) {
                // More exaggerated movements for running
                this.leftUpperLeg.rotation.x = legMovement * 2.0;
                this.rightUpperLeg.rotation.x = -legMovement * 2.0;
                this.leftLowerLeg.rotation.x = -Math.abs(legMovement) * 1.5;
                this.rightLowerLeg.rotation.x = -Math.abs(-legMovement) * 1.5;
                
                // Arm swing for running
                this.leftArm.rotation.x = -legMovement * 2.0;
                this.rightArm.rotation.x = legMovement * 2.0;
                
                // Add more pronounced body tilt forward when running
                this.mesh.children[0].rotation.x = 0.3;
            } else {
                // Normal walking animation
                this.leftUpperLeg.rotation.x = legMovement * 1.2;
                this.rightUpperLeg.rotation.x = -legMovement * 1.2;
                this.leftLowerLeg.rotation.x = -Math.abs(legMovement);
                this.rightLowerLeg.rotation.x = -Math.abs(-legMovement);
                
                // Arm swing for walking
                this.leftArm.rotation.x = -legMovement * 1.2;
                this.rightArm.rotation.x = legMovement * 1.2;
                
                // Reset torso rotation
                this.mesh.children[0].rotation.x = 0;
            }
        } else {
            // Reset animations when not moving
            this.leftUpperLeg.rotation.x = 0;
            this.rightUpperLeg.rotation.x = 0;
            this.leftLowerLeg.rotation.x = 0;
            this.rightLowerLeg.rotation.x = 0;
            this.leftArm.rotation.x = 0;
            this.rightArm.rotation.x = 0;
            this.mesh.children[0].rotation.x = 0;
        }

        // Boundary checks
        const fieldWidth = 300;
        const fieldLength = 180;
        const boardGap = 2;
        const maxX = fieldWidth/2 + boardGap;
        const maxZ = fieldLength/2 + boardGap;
        
        this.mesh.position.x = Math.max(-maxX, Math.min(maxX, this.mesh.position.x));
        this.mesh.position.z = Math.max(-maxZ, Math.min(maxZ, this.mesh.position.z));

        // Update kick indicator
        if (game.ball) {
            const distanceToBall = this.mesh.position.distanceTo(game.ball.mesh.position);
            
            if (distanceToBall < 2) {
                if (!this.kickIndicator) {
                    const geometry = new THREE.RingGeometry(1.9, 2, 32);
                    const material = new THREE.MeshBasicMaterial({
                        color: 0x00ff00,
                        transparent: true,
                        opacity: 0.5,
                        side: THREE.DoubleSide
                    });
                    this.kickIndicator = new THREE.Mesh(geometry, material);
                    this.kickIndicator.rotation.x = -Math.PI / 2;
                    game.scene.add(this.kickIndicator);
                }
                this.kickIndicator.position.copy(this.mesh.position);
                this.kickIndicator.position.y = 0.1;
                this.kickIndicator.visible = true;
            } else if (this.kickIndicator) {
                this.kickIndicator.visible = false;
            }
        }
    }

    updatePosition(data) {
        // Always set Y position to ground level + half height, ignore incoming Y
        this.mesh.position.set(
            data.x,
            this.groundLevel + this.height/2,
            data.z
        );
        if (data.rotation !== undefined) {
            this.mesh.rotation.y = data.rotation;
        }
    }

    updateHealth(health) {
        this.health = health;
        if (this.isLocal) {
            // Flash screen red when damaged
            const overlay = document.createElement('div');
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
            overlay.style.pointerEvents = 'none';
            document.body.appendChild(overlay);
            setTimeout(() => document.body.removeChild(overlay), 100);

            // Check for death
            if (this.health <= 0) {
                // Show death message
                const deathMessage = document.createElement('div');
                deathMessage.style.position = 'fixed';
                deathMessage.style.top = '50%';
                deathMessage.style.left = '50%';
                deathMessage.style.transform = 'translate(-50%, -50%)';
                deathMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                deathMessage.style.color = 'white';
                deathMessage.style.padding = '20px';
                deathMessage.style.borderRadius = '10px';
                deathMessage.style.fontSize = '24px';
                deathMessage.textContent = 'You died!';
                document.body.appendChild(deathMessage);
                
                // Remove death message after 2 seconds
                setTimeout(() => document.body.removeChild(deathMessage), 2000);

                // Respawn in team's goal
                const goalPosition = this.team === 'blue' ? 
                    { x: -140, y: this.groundLevel + this.height/2, z: 0 } : 
                    { x: 140, y: this.groundLevel + this.height/2, z: 0 };
                
                this.mesh.position.set(goalPosition.x, goalPosition.y, goalPosition.z);
                this.health = 100;
                this.stamina = 100;
                
                // Emit respawn event to server
                game.socket.emit('playerRespawn', {
                    id: this.id,
                    position: goalPosition,
                    team: this.team
                });
            }
        }
    }

    shoot() {
        if (!this.isLocal || this.isStunned) return;
        
        const now = Date.now();
        if (now - this.lastShot < 500) return;
        this.lastShot = now;

        const bulletGeometry = new THREE.SphereGeometry(0.1);
        const bulletMaterial = new THREE.MeshPhongMaterial({ color: 0xffff00 });
        const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
        
        // Position bullet at player position
        bullet.position.copy(this.mesh.position);
        bullet.position.y += 1;
        
        // Set bullet direction based on camera rotation
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.mesh.quaternion);
        direction.y = Math.sin(this.verticalRotation);
        direction.normalize();
        
        this.mesh.parent.add(bullet);
        
        const speed = 2.5;
        let currentDirection = direction.clone();
        
        const animate = () => {
            bullet.position.add(currentDirection.clone().multiplyScalar(speed));
            
            const players = Array.from(game.players.values());
            for (const player of players) {
                if (player !== this && bullet.position.distanceTo(player.mesh.position) < 1) {
                    // Apply reduced knockback immediately on the local representation
                    const knockbackForce = currentDirection.clone().multiplyScalar(1); // Reduced from 2 to 1
                    
                    // Calculate new position after knockback
                    const newPosition = player.mesh.position.clone().add(knockbackForce);
                    
                    // Ensure player doesn't go below ground
                    newPosition.y = Math.max(player.groundLevel + player.height/2, newPosition.y);
                    
                    // Apply the adjusted position
                    player.mesh.position.copy(newPosition);
                    
                    // Update player's health locally
                    player.updateHealth(Math.max(0, player.health - 75));
                    
                    // Send combat event to server
                    game.socket.emit('combat', {
                        type: 'shoot',
                        targetId: player.id,
                        damage: 75,
                        knockback: {
                            x: knockbackForce.x,
                            y: 0, // No vertical knockback
                            z: knockbackForce.z
                        }
                    });

                    // Remove the bullet
                    this.mesh.parent.remove(bullet);
                    return;
                }
            }
            
            if (bullet.position.distanceTo(this.mesh.position) > 50) {
                this.mesh.parent.remove(bullet);
                return;
            }
            
            requestAnimationFrame(animate);
        };
        animate();
    }

    punch() {
        if (!this.isLocal || this.isStunned) return;
        
        const now = Date.now();
        if (now - this.lastPunch < 1000) return;
        this.lastPunch = now;

        // Get punch direction based on camera rotation
        const punchDirection = new THREE.Vector3(0, 0, -1);
        punchDirection.applyQuaternion(this.mesh.quaternion);
        punchDirection.y = Math.sin(this.verticalRotation);
        punchDirection.normalize();

        // Check for nearby players - now using same radius as kick (2 meters)
        const players = Array.from(game.players.values());
        for (const player of players) {
            if (player !== this && this.mesh.position.distanceTo(player.mesh.position) < 2) {
                // Apply knockback
                if (player.mesh.position && player.velocity) {
                    player.velocity = punchDirection.multiplyScalar(1); // 1 meter knockback
                    player.mesh.position.add(player.velocity);
                }

                game.socket.emit('combat', {
                    type: 'punch',
                    targetId: player.id,
                    damage: 25,
                    knockback: {
                        x: punchDirection.x,
                        y: punchDirection.y,
                        z: punchDirection.z
                    }
                });
            }
        }

        // Punch animation
        const rightArm = this.mesh.children[6];
        const originalRotation = rightArm.rotation.z;
        const animationDuration = 200;
        const startTime = Date.now();

        const animatePunch = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(1, elapsed / animationDuration);

            if (progress < 0.5) {
                rightArm.rotation.z = originalRotation + (Math.PI / 2) * (progress * 2);
            } else {
                rightArm.rotation.z = originalRotation + (Math.PI / 2) * (2 - progress * 2);
            }

            if (progress < 1) {
                requestAnimationFrame(animatePunch);
            }
        };
        animatePunch();
    }

    createDevOverlay() {
        // Remove existing overlay if any
        this.removeDevOverlay();

        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'devOverlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '10px';
        overlay.style.left = '10px';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        overlay.style.color = 'white';
        overlay.style.padding = '10px';
        overlay.style.fontFamily = 'monospace';
        overlay.style.fontSize = '14px';
        overlay.style.zIndex = '1000';
        document.body.appendChild(overlay);
    }

    removeDevOverlay() {
        const existing = document.getElementById('devOverlay');
        if (existing) {
            existing.remove();
        }
    }
} 