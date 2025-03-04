class MobileControls {
    constructor(game) {
        this.game = game;
        this.isMobile = this.detectMobile();
        this.isActive = false;
        this.joystickSize = 120;
        this.actionButtonSize = 70;
        this.margin = 20;
        this.isLandscape = window.innerWidth > window.innerHeight;
        
        // Movement joystick state
        this.moveJoystick = {
            active: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            direction: { x: 0, y: 0 }
        };
        
        // Look joystick state
        this.lookJoystick = {
            active: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            direction: { x: 0, y: 0 }
        };
        
        // Action buttons state
        this.actionButtons = {
            jump: false,
            sprint: false,
            kick: false,
            punch: false,
            shoot: false
        };
        
        if (this.isMobile) {
            this.init();
        }
    }
    
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               window.innerWidth <= 800 || window.orientation !== undefined;
    }
    
    init() {
        this.isActive = true;
        this.createMobileUI();
        this.setupEventListeners();
        
        // Disable default touch behaviors
        document.addEventListener('touchmove', (e) => {
            if (this.isActive) {
                e.preventDefault();
            }
        }, { passive: false });
        
        document.addEventListener('touchstart', (e) => {
            if (this.isActive && e.target.classList.contains('mobile-control')) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Handle orientation change
        window.addEventListener('resize', () => {
            this.handleOrientationChange();
        });
        
        window.addEventListener('orientationchange', () => {
            this.handleOrientationChange();
        });
    }
    
    handleOrientationChange() {
        // Check if orientation has changed
        const wasLandscape = this.isLandscape;
        this.isLandscape = window.innerWidth > window.innerHeight;
        
        // If orientation changed, update control sizes and positions
        if (wasLandscape !== this.isLandscape) {
            // Adjust control sizes based on orientation
            if (this.isLandscape) {
                // Landscape mode - larger controls
                this.joystickSize = 120;
                this.actionButtonSize = 70;
            } else {
                // Portrait mode - smaller controls
                this.joystickSize = 100;
                this.actionButtonSize = 60;
            }
            
            // Update joystick sizes
            this.moveJoystickOuter.style.width = `${this.joystickSize}px`;
            this.moveJoystickOuter.style.height = `${this.joystickSize}px`;
            this.lookJoystickOuter.style.width = `${this.joystickSize}px`;
            this.lookJoystickOuter.style.height = `${this.joystickSize}px`;
            
            this.moveJoystickInner.style.width = `${this.joystickSize / 2}px`;
            this.moveJoystickInner.style.height = `${this.joystickSize / 2}px`;
            this.lookJoystickInner.style.width = `${this.joystickSize / 2}px`;
            this.lookJoystickInner.style.height = `${this.joystickSize / 2}px`;
            
            // Update action button sizes
            const actionButtons = document.querySelectorAll('.action-button');
            actionButtons.forEach(button => {
                button.style.width = `${this.actionButtonSize}px`;
                button.style.height = `${this.actionButtonSize}px`;
            });
        }
        
        // Always update positions when size changes
        this.updateControlPositions();
    }
    
    createMobileUI() {
        // Create container for mobile controls
        this.container = document.createElement('div');
        this.container.id = 'mobileControls';
        this.container.style.position = 'fixed';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.pointerEvents = 'none';
        this.container.style.zIndex = '1000';
        document.body.appendChild(this.container);
        
        // Create movement joystick
        this.moveJoystickOuter = this.createJoystick('moveJoystickOuter', 'left');
        this.moveJoystickInner = this.createJoystickInner('moveJoystickInner');
        this.moveJoystickOuter.appendChild(this.moveJoystickInner);
        this.container.appendChild(this.moveJoystickOuter);
        
        // Create look joystick
        this.lookJoystickOuter = this.createJoystick('lookJoystickOuter', 'right');
        this.lookJoystickInner = this.createJoystickInner('lookJoystickInner');
        this.lookJoystickOuter.appendChild(this.lookJoystickInner);
        this.container.appendChild(this.lookJoystickOuter);
        
        // Create action buttons
        this.createActionButtons();
        
        // Update positions based on screen size
        this.updateControlPositions();
    }
    
    createJoystick(id, position) {
        const joystick = document.createElement('div');
        joystick.id = id;
        joystick.className = 'mobile-control joystick';
        joystick.style.position = 'absolute';
        joystick.style.width = `${this.joystickSize}px`;
        joystick.style.height = `${this.joystickSize}px`;
        joystick.style.borderRadius = '50%';
        joystick.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        joystick.style.border = '2px solid rgba(255, 255, 255, 0.5)';
        joystick.style.pointerEvents = 'auto';
        
        if (position === 'left') {
            joystick.style.left = `${this.margin}px`;
            joystick.style.bottom = `${this.margin}px`;
        } else {
            joystick.style.right = `${this.margin}px`;
            joystick.style.bottom = `${this.margin}px`;
        }
        
        return joystick;
    }
    
    createJoystickInner(id) {
        const inner = document.createElement('div');
        inner.id = id;
        inner.className = 'mobile-control joystick-inner';
        inner.style.position = 'absolute';
        inner.style.width = `${this.joystickSize / 2}px`;
        inner.style.height = `${this.joystickSize / 2}px`;
        inner.style.borderRadius = '50%';
        inner.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
        inner.style.left = '50%';
        inner.style.top = '50%';
        inner.style.transform = 'translate(-50%, -50%)';
        inner.style.pointerEvents = 'none';
        
        return inner;
    }
    
    createActionButtons() {
        // Rearranged button configurations with more spacing
        // Jump and Sprint moved to left side, other buttons on right with more spacing
        const buttonConfigs = [
            // Left side buttons
            { id: 'jumpButton', text: 'JUMP', action: 'jump', position: { left: this.margin + this.joystickSize + this.margin, bottom: this.margin + this.actionButtonSize * 1.5 } },
            { id: 'sprintButton', text: 'SPRINT', action: 'sprint', position: { left: this.margin + this.joystickSize + this.margin, bottom: this.margin + this.actionButtonSize * 0.2 } },
            
            // Right side buttons with more spacing
            { id: 'kickButton', text: 'KICK', action: 'kick', position: { right: this.margin + this.joystickSize + this.margin * 2, bottom: this.margin + this.actionButtonSize * 0.2 } },
            { id: 'punchButton', text: 'PUNCH', action: 'punch', position: { right: this.margin + this.joystickSize + this.margin * 2, bottom: this.margin + this.actionButtonSize * 2 } },
            { id: 'shootButton', text: 'SHOOT', action: 'shoot', position: { right: this.margin + this.joystickSize + this.margin * 2, bottom: this.margin + this.actionButtonSize * 3.8 } }
        ];
        
        buttonConfigs.forEach(config => {
            const button = document.createElement('div');
            button.id = config.id;
            button.className = 'mobile-control action-button';
            button.dataset.action = config.action;
            button.style.position = 'absolute';
            button.style.width = `${this.actionButtonSize}px`;
            button.style.height = `${this.actionButtonSize}px`;
            button.style.borderRadius = '50%';
            button.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            button.style.border = '2px solid rgba(255, 255, 255, 0.5)';
            button.style.display = 'flex';
            button.style.justifyContent = 'center';
            button.style.alignItems = 'center';
            button.style.color = 'white';
            button.style.fontWeight = 'bold';
            button.style.fontSize = '12px';
            button.style.userSelect = 'none';
            button.style.pointerEvents = 'auto';
            
            // Set position
            Object.keys(config.position).forEach(key => {
                button.style[key] = `${config.position[key]}px`;
            });
            
            button.textContent = config.text;
            this.container.appendChild(button);
        });
    }
    
    updateControlPositions() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Adjust margin based on screen size
        this.margin = Math.min(20, Math.max(10, Math.floor(Math.min(width, height) * 0.03)));
        
        // Update joystick positions
        this.moveJoystickOuter.style.left = `${this.margin}px`;
        this.moveJoystickOuter.style.bottom = `${this.margin}px`;
        
        this.lookJoystickOuter.style.right = `${this.margin}px`;
        this.lookJoystickOuter.style.bottom = `${this.margin}px`;
        
        // Update action buttons with new positions
        const jumpButton = document.getElementById('jumpButton');
        const sprintButton = document.getElementById('sprintButton');
        const kickButton = document.getElementById('kickButton');
        const punchButton = document.getElementById('punchButton');
        const shootButton = document.getElementById('shootButton');
        
        // Left side buttons
        if (jumpButton) {
            jumpButton.style.left = `${this.margin + this.joystickSize + this.margin}px`;
            jumpButton.style.bottom = `${this.margin + this.actionButtonSize * 1.5}px`;
        }
        
        if (sprintButton) {
            sprintButton.style.left = `${this.margin + this.joystickSize + this.margin}px`;
            sprintButton.style.bottom = `${this.margin + this.actionButtonSize * 0.2}px`;
        }
        
        // Right side buttons with more spacing
        if (kickButton) {
            kickButton.style.right = `${this.margin + this.joystickSize + this.margin * 2}px`;
            kickButton.style.bottom = `${this.margin + this.actionButtonSize * 0.2}px`;
        }
        
        if (punchButton) {
            punchButton.style.right = `${this.margin + this.joystickSize + this.margin * 2}px`;
            punchButton.style.bottom = `${this.margin + this.actionButtonSize * 2}px`;
        }
        
        if (shootButton) {
            shootButton.style.right = `${this.margin + this.joystickSize + this.margin * 2}px`;
            shootButton.style.bottom = `${this.margin + this.actionButtonSize * 3.8}px`;
        }
    }
    
    setupEventListeners() {
        // Touch events for movement joystick
        this.moveJoystickOuter.addEventListener('touchstart', (e) => {
            this.moveJoystick.active = true;
            this.moveJoystick.startX = e.touches[0].clientX;
            this.moveJoystick.startY = e.touches[0].clientY;
            this.moveJoystick.currentX = this.moveJoystick.startX;
            this.moveJoystick.currentY = this.moveJoystick.startY;
            this.updateJoystickPosition('move');
        });
        
        // Touch events for look joystick
        this.lookJoystickOuter.addEventListener('touchstart', (e) => {
            this.lookJoystick.active = true;
            this.lookJoystick.startX = e.touches[0].clientX;
            this.lookJoystick.startY = e.touches[0].clientY;
            this.lookJoystick.currentX = this.lookJoystick.startX;
            this.lookJoystick.currentY = this.lookJoystick.startY;
            this.updateJoystickPosition('look');
        });
        
        // Global touch move event
        document.addEventListener('touchmove', (e) => {
            for (let i = 0; i < e.touches.length; i++) {
                const touch = e.touches[i];
                
                // Check if touch is on move joystick
                if (this.moveJoystick.active && this.isTouchOnJoystick(touch, this.moveJoystickOuter)) {
                    this.moveJoystick.currentX = touch.clientX;
                    this.moveJoystick.currentY = touch.clientY;
                    this.updateJoystickPosition('move');
                }
                
                // Check if touch is on look joystick
                if (this.lookJoystick.active && this.isTouchOnJoystick(touch, this.lookJoystickOuter)) {
                    this.lookJoystick.currentX = touch.clientX;
                    this.lookJoystick.currentY = touch.clientY;
                    this.updateJoystickPosition('look');
                }
            }
        });
        
        // Global touch end event
        document.addEventListener('touchend', (e) => {
            // Check if all touches on move joystick are gone
            if (this.moveJoystick.active && !this.isTouchActiveOnElement(e.touches, this.moveJoystickOuter)) {
                this.resetJoystick('move');
            }
            
            // Check if all touches on look joystick are gone
            if (this.lookJoystick.active && !this.isTouchActiveOnElement(e.touches, this.lookJoystickOuter)) {
                this.resetJoystick('look');
            }
            
            // Reset action buttons if needed
            this.resetActionButtonsIfNeeded(e.touches);
        });
        
        // Action button events
        const actionButtons = document.querySelectorAll('.action-button');
        actionButtons.forEach(button => {
            button.addEventListener('touchstart', (e) => {
                const action = button.dataset.action;
                this.actionButtons[action] = true;
                button.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
                this.triggerAction(action, true);
            });
            
            button.addEventListener('touchend', (e) => {
                const action = button.dataset.action;
                this.actionButtons[action] = false;
                button.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                this.triggerAction(action, false);
            });
        });
    }
    
    isTouchOnJoystick(touch, joystickElement) {
        const rect = joystickElement.getBoundingClientRect();
        return (
            touch.clientX >= rect.left &&
            touch.clientX <= rect.right &&
            touch.clientY >= rect.top &&
            touch.clientY <= rect.bottom
        );
    }
    
    isTouchActiveOnElement(touches, element) {
        for (let i = 0; i < touches.length; i++) {
            if (this.isTouchOnJoystick(touches[i], element)) {
                return true;
            }
        }
        return false;
    }
    
    updateJoystickPosition(joystickType) {
        const joystick = joystickType === 'move' ? this.moveJoystick : this.lookJoystick;
        const joystickInner = joystickType === 'move' ? this.moveJoystickInner : this.lookJoystickInner;
        const joystickOuter = joystickType === 'move' ? this.moveJoystickOuter : this.lookJoystickOuter;
        
        // Calculate joystick displacement
        const deltaX = joystick.currentX - joystick.startX;
        const deltaY = joystick.currentY - joystick.startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const maxDistance = this.joystickSize / 2;
        
        // Normalize and limit displacement
        if (distance > maxDistance) {
            const ratio = maxDistance / distance;
            joystick.direction.x = deltaX * ratio / maxDistance;
            joystick.direction.y = deltaY * ratio / maxDistance;
            
            // Position inner joystick at the edge
            joystickInner.style.transform = `translate(calc(-50% + ${maxDistance * (deltaX / distance)}px), calc(-50% + ${maxDistance * (deltaY / distance)}px))`;
        } else {
            joystick.direction.x = deltaX / maxDistance;
            joystick.direction.y = deltaY / maxDistance;
            
            // Position inner joystick
            joystickInner.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
        }
        
        // Update player controls based on joystick input
        this.updatePlayerControls();
    }
    
    resetJoystick(joystickType) {
        const joystick = joystickType === 'move' ? this.moveJoystick : this.lookJoystick;
        const joystickInner = joystickType === 'move' ? this.moveJoystickInner : this.lookJoystickInner;
        
        joystick.active = false;
        joystick.direction.x = 0;
        joystick.direction.y = 0;
        joystickInner.style.transform = 'translate(-50%, -50%)';
        
        // Update player controls to stop movement
        this.updatePlayerControls();
    }
    
    resetActionButtonsIfNeeded(touches) {
        const actionButtons = document.querySelectorAll('.action-button');
        actionButtons.forEach(button => {
            if (!this.isTouchActiveOnElement(touches, button)) {
                const action = button.dataset.action;
                if (this.actionButtons[action]) {
                    this.actionButtons[action] = false;
                    button.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                    this.triggerAction(action, false);
                }
            }
        });
    }
    
    updatePlayerControls() {
        if (!this.game.localPlayer) return;
        
        // Update movement controls based on move joystick
        if (this.moveJoystick.active) {
            // Forward/backward
            this.game.localPlayer.controls.forward = this.moveJoystick.direction.y < -0.3;
            this.game.localPlayer.controls.backward = this.moveJoystick.direction.y > 0.3;
            
            // Left/right
            this.game.localPlayer.controls.left = this.moveJoystick.direction.x < -0.3;
            this.game.localPlayer.controls.right = this.moveJoystick.direction.x > 0.3;
        } else {
            // Reset movement controls when joystick is released
            this.game.localPlayer.controls.forward = false;
            this.game.localPlayer.controls.backward = false;
            this.game.localPlayer.controls.left = false;
            this.game.localPlayer.controls.right = false;
        }
        
        // Update camera rotation based on look joystick
        if (this.lookJoystick.active && this.lookJoystick.direction.x !== 0) {
            // Horizontal rotation (left/right)
            this.game.localPlayer.mesh.rotation.y -= this.lookJoystick.direction.x * 0.05;
            
            // Vertical rotation (up/down) with constraints
            const maxVerticalRotation = Math.PI / 3; // 60 degrees
            this.game.localPlayer.verticalRotation = Math.max(
                -maxVerticalRotation,
                Math.min(
                    maxVerticalRotation,
                    this.game.localPlayer.verticalRotation - this.lookJoystick.direction.y * 0.03
                )
            );
        }
        
        // Update sprint control
        this.game.localPlayer.controls.sprint = this.actionButtons.sprint;
    }
    
    triggerAction(action, isActive) {
        if (!this.game.localPlayer) return;
        
        switch (action) {
            case 'jump':
                if (isActive && !this.game.localPlayer.isJumping) {
                    this.game.localPlayer.jump();
                }
                break;
            case 'kick':
                if (isActive && this.game.ball) {
                    const distanceToBall = this.game.localPlayer.mesh.position.distanceTo(this.game.ball.mesh.position);
                    if (distanceToBall < 2) {
                        this.game.ball.kick(this.game.localPlayer);
                    }
                }
                break;
            case 'punch':
                if (isActive) {
                    this.game.localPlayer.punch();
                }
                break;
            case 'shoot':
                if (isActive) {
                    this.game.localPlayer.shoot();
                }
                break;
            case 'sprint':
                // Handled in updatePlayerControls
                break;
        }
    }
} 