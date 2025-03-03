class Ball {
    constructor(data) {
        this.radius = 0.8;
        this.friction = 0.98;
        this.gravity = 0.02;
        this.bounceEnergy = 0.7;
        this.velocity = new THREE.Vector3(0, 0, 0);
        
        // Create ball mesh
        const geometry = new THREE.SphereGeometry(this.radius, 32, 32);
        const material = new THREE.MeshPhongMaterial({ color: 0xffffff });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Set initial position
        if (data) {
            this.mesh.position.set(data.x, data.y + this.radius, data.z);
            this.velocity.set(data.velocityX || 0, data.velocityY || 0, data.velocityZ || 0);
        }
    }

    update() {
        // Apply gravity
        this.velocity.y -= this.gravity;
        
        // Apply friction
        this.velocity.multiplyScalar(this.friction);
        
        // Update position
        this.mesh.position.add(this.velocity);
        
        // Ground collision
        if (this.mesh.position.y <= this.radius) {
            this.mesh.position.y = this.radius;
            this.velocity.y = Math.abs(this.velocity.y) * this.bounceEnergy;
        }

        // Check for player collisions (dribbling)
        if (game.players) {
            game.players.forEach(player => {
                const distance = player.mesh.position.distanceTo(this.mesh.position);
                if (distance < player.height/2 + this.radius) {
                    // Calculate collision response
                    const direction = this.mesh.position.clone().sub(player.mesh.position).normalize();
                    const force = 0.3; // Reduced force for dribbling
                    
                    // Add player's movement to ball velocity
                    if (player.controls && (player.controls.forward || player.controls.backward || player.controls.left || player.controls.right)) {
                        const playerDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(player.mesh.quaternion);
                        this.velocity.add(playerDirection.multiplyScalar(force));
                    }
                    
                    // Push ball away from player
                    this.velocity.add(direction.multiplyScalar(force));
                }
            });
        }

        // Boundary checks
        const fieldWidth = 300;
        const fieldLength = 180;
        const maxX = fieldWidth/2;
        const maxZ = fieldLength/2;
        
        if (Math.abs(this.mesh.position.x) > maxX) {
            this.mesh.position.x = Math.sign(this.mesh.position.x) * maxX;
            this.velocity.x *= -this.bounceEnergy;
        }
        
        if (Math.abs(this.mesh.position.z) > maxZ) {
            this.mesh.position.z = Math.sign(this.mesh.position.z) * maxZ;
            this.velocity.z *= -this.bounceEnergy;
        }

        // Emit position update if significant movement
        if (this.velocity.length() > 0.01) {
            game.socket.emit('ballUpdate', {
                x: this.mesh.position.x,
                y: this.mesh.position.y - this.radius,
                z: this.mesh.position.z,
                velocityX: this.velocity.x,
                velocityY: this.velocity.y,
                velocityZ: this.velocity.z
            });
        }
    }

    kick(player) {
        const kickDirection = new THREE.Vector3(0, 0, -1)
            .applyQuaternion(player.mesh.quaternion)
            .normalize();
        
        // Add upward component
        kickDirection.y = 0.3;
        
        const kickForce = 2.0;
        this.velocity.copy(kickDirection.multiplyScalar(kickForce));
    }

    updatePosition(data) {
        this.mesh.position.set(data.x, data.y + this.radius, data.z);
        this.velocity.set(data.velocityX || 0, data.velocityY || 0, data.velocityZ || 0);
    }

    createBallTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 256, 256);

        // Black pentagons
        ctx.fillStyle = 'black';
        const numPentagons = 12;
        for (let i = 0; i < numPentagons; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const size = 20 + Math.random() * 10;
            this.drawPentagon(ctx, x, y, size);
        }

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    drawPentagon(ctx, x, y, size) {
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
            const px = x + size * Math.cos(angle);
            const py = y + size * Math.sin(angle);
            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.closePath();
        ctx.fill();
    }

    playGoalEffect(goalX, goalZ) {
        // Create confetti particles
        const particleCount = 200; // Doubled for more particles
        const particles = new THREE.Group();
        
        // Create explosion effect
        const explosionCount = 20;
        for (let i = 0; i < explosionCount; i++) {
            const geometry = new THREE.SphereGeometry(0.3, 8, 8);
            const material = new THREE.MeshPhongMaterial({
                color: 0xff8800,
                emissive: 0xff4400,
                transparent: true
            });
            const explosion = new THREE.Mesh(geometry, material);
            
            // Position around the goal
            explosion.position.set(
                goalX + (Math.random() - 0.5) * 10,
                Math.random() * goalHeight,
                goalZ
            );
            
            // Random velocity
            explosion.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.5,
                Math.random() * 0.3,
                (Math.random() - 0.5) * 0.5
            );
            
            particles.add(explosion);
        }
        
        // Create confetti
        for (let i = 0; i < particleCount; i++) {
            const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.01);
            const material = new THREE.MeshPhongMaterial({
                color: Math.random() * 0xffffff,
                emissive: Math.random() * 0x444444
            });
            const particle = new THREE.Mesh(geometry, material);
            
            // Random position around the goal
            particle.position.set(
                goalX + (Math.random() - 0.5) * 15,
                Math.random() * 15,
                goalZ + (Math.random() - 0.5) * 2
            );
            
            // Random velocity
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.3,
                Math.random() * 0.4,
                (Math.random() - 0.5) * 0.3
            );
            
            particles.add(particle);
        }
        
        this.mesh.parent.add(particles);
        
        // Play goal sound
        const audio = new Audio('/sounds/goal.mp3');
        audio.volume = 0.8;
        audio.play();
        
        // Play crowd cheer
        const cheer = new Audio('/sounds/cheer.mp3');
        cheer.volume = 0.6;
        cheer.play();
        
        // Animate particles
        const startTime = Date.now();
        const duration = 2000; // 2 seconds
        
        const animateParticles = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed > duration) {
                this.mesh.parent.remove(particles);
                return;
            }
            
            const progress = elapsed / duration;
            
            particles.children.forEach((particle, index) => {
                // Different behavior for explosions and confetti
                if (index < explosionCount) {
                    // Explosion particles
                    particle.position.add(particle.velocity);
                    particle.velocity.y -= 0.002; // Less gravity
                    particle.scale.multiplyScalar(0.97); // Shrink
                    particle.material.opacity = 1 - progress; // Fade out
                } else {
                    // Confetti particles
                    particle.position.add(particle.velocity);
                    particle.velocity.y -= 0.001; // Gravity
                    particle.rotation.x += 0.1;
                    particle.rotation.y += 0.1;
                    particle.rotation.z += 0.1;
                }
            });
            
            requestAnimationFrame(animateParticles);
        };
        
        animateParticles();
    }
} 