class MobileControls {
    constructor(game) {
        this.game = game;
        this.isMobile = this.detectMobile();
        this.isActive = false;
        
        // Control sizes
        this.joystickSize = 120;
        this.actionButtonSize = 70;
        this.margin = 20;
        
        // Movement joystick state (bottom left)
        this.moveJoystick = {
            active: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            direction: { x: 0, y: 0 }
        };
        
        // Look joystick state (bottom right)
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
            console.log("Mobile device detected, initializing mobile controls");
            this.init();
            this.setupFullscreen();
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
            if (this.isActive && e.target.classList.contains('mobile-control')) {
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
            this.updateControlPositions();
        });
        
        window.addEventListener('orientationchange', () => {
            this.updateControlPositions();
            this.requestFullscreen();
        });
        
        console.log("Mobile controls initialized");
    }
    
    setupFullscreen() {
        // Request fullscreen when in landscape
        document.addEventListener('touchstart', () => {
            if (window.innerWidth > window.innerHeight) {
                this.requestFullscreen();
            }
        }, { once: true });
    }
    
    requestFullscreen() {
        const element = document.documentElement;
        
        if (document.fullscreenElement) return; // Already in fullscreen
        
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
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
        this.container.style.zIndex = '9999';
        document.body.appendChild(this.container);
        
        // Create movement joystick (bottom left)
        this.moveJoystickOuter = this.createJoystick('moveJoystickOuter', 'left');
        this.moveJoystickInner = this.createJoystickInner('moveJoystickInner');
        this.moveJoystickOuter.appendChild(this.moveJoystickInner);
        this.container.appendChild(this.moveJoystickOuter);
        
        // Create look joystick (bottom right)
        this.lookJoystickOuter = this.createJoystick('lookJoystickOuter', 'right');
        this.lookJoystickInner = this.createJoystickInner('lookJoystickInner');
        this.lookJoystickOuter.appendChild(this.lookJoystickInner);
        this.container.appendChild(this.lookJoystickOuter);
        
        // Create action buttons
        this.createActionButtons();
        
        // Update positions based on screen size
        this.updateControlPositions();
        
        // Move health and stamina bars to top right for mobile
        if (this.isMobile) {
            const stats = document.getElementById('stats');
            if (stats) {
                stats.style.top = '20px';
                stats.style.bottom = 'auto';
            }
        }
        
        // Hide default instructions and show mobile instructions
        this.setupMobileInstructions();
        
        console.log("Mobile UI created");
    }
    
    setupMobileInstructions() {
        // Hide default instructions
        const instructions = document.getElementById('instructions');
        if (instructions) {
            instructions.style.display = 'none';
        }
        
        // Create mobile instructions button
        const mobileInstructionsBtn = document.createElement('div');
        mobileInstructionsBtn.id = 'mobileInstructionsBtn';
        mobileInstructionsBtn.textContent = 'ℹ️';
        mobileInstructionsBtn.style.position = 'fixed';
        mobileInstructionsBtn.style.top = '20px';
        mobileInstructionsBtn.style.left = '20px';
        mobileInstructionsBtn.style.width = '40px';
        mobileInstructionsBtn.style.height = '40px';
        mobileInstructionsBtn.style.borderRadius = '50%';
        mobileInstructionsBtn.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        mobileInstructionsBtn.style.color = 'white';
        mobileInstructionsBtn.style.display = 'flex';
        mobileInstructionsBtn.style.justifyContent = 'center';
        mobileInstructionsBtn.style.alignItems = 'center';
        mobileInstructionsBtn.style.fontSize = '20px';
        mobileInstructionsBtn.style.zIndex = '9998';
        mobileInstructionsBtn.style.pointerEvents = 'auto';
        document.body.appendChild(mobileInstructionsBtn);
        
        // Create mobile instructions panel (initially hidden)
        const mobileInstructions = document.createElement('div');
        mobileInstructions.id = 'mobileInstructions';
        mobileInstructions.style.position = 'fixed';
        mobileInstructions.style.top = '70px';
        mobileInstructions.style.left = '20px';
        mobileInstructions.style.maxWidth = '250px';
        mobileInstructions.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        mobileInstructions.style.color = 'white';
        mobileInstructions.style.padding = '15px';
        mobileInstructions.style.borderRadius = '5px';
        mobileInstructions.style.fontSize = '14px';
        mobileInstructions.style.zIndex = '9997';
        mobileInstructions.style.display = 'none';
        mobileInstructions.innerHTML = `
            <h3>Pro club 'em</h3>
            <p>- Score goals to win (first to 20 resets the match)!</p>
            <p>- Use combat to stop opponents.</p>
            <h4>Controls:</h4>
            <p>- Left Joystick: Move</p>
            <p>- Right Joystick: Look/Aim</p>
            <p>- SPRINT Button: Sprint</p>
            <p>- JUMP Button: Jump</p>
            <p>- KICK Button: Kick Ball (when near)</p>
            <p>- PUNCH Button: Punch (25 damage)</p>
            <p>- SHOOT Button: Shoot Bullets (75 damage)</p>
            <p>Players Online: <span id="mobilePlayerCount">0</span></p>
        `;
        document.body.appendChild(mobileInstructions);
        
        // Toggle instructions visibility
        mobileInstructionsBtn.addEventListener('click', () => {
            if (mobileInstructions.style.display === 'none') {
                mobileInstructions.style.display = 'block';
            } else {
                mobileInstructions.style.display = 'none';
            }
        });
        
        // Sync player count
        setInterval(() => {
            const playerCount = document.getElementById('playerCount');
            const mobilePlayerCount = document.getElementById('mobilePlayerCount');
            if (playerCount && mobilePlayerCount) {
                mobilePlayerCount.textContent = playerCount.textContent;
            }
        }, 1000);
    }
    
    createJoystick(id, position) {
        const joystick = document.createElement('div');
        joystick.id = id;
        joystick.className = 'mobile-control joystick';
        joystick.style.position = 'absolute';
        joystick.style.width = `${this.joystickSize}px`;
        joystick.style.height = `${this.joystickSize}px`;
        joystick.style.borderRadius = '50%';
        joystick.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
        joystick.style.border = '3px solid rgba(255, 255, 255, 0.9)';
        joystick.style.pointerEvents = 'auto';
        joystick.style.touchAction = 'none';
        joystick.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.5)';
        
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
        inner.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        inner.style.left = '50%';
        inner.style.top = '50%';
        inner.style.transform = 'translate(-50%, -50%)';
        inner.style.pointerEvents = 'none';
        inner.style.boxShadow = '0 0 5px rgba(255, 255, 255, 0.7)';
        
        return inner;
    }
    
    createActionButtons() {
        // Button configurations as per requirements
        const buttonConfigs = [
            // Above left joystick - JUMP
            { id: 'jumpButton', text: 'JUMP', action: 'jump', position: { left: this.margin + (this.joystickSize - this.actionButtonSize) / 2, bottom: this.margin + this.joystickSize + this.margin } },
            
            // Right of left joystick - SPRINT
            { id: 'sprintButton', text: 'SPRINT', action: 'sprint', position: { left: this.margin + this.joystickSize + this.margin, bottom: this.margin + (this.joystickSize - this.actionButtonSize) / 2 } },
            
            // Above right joystick - SHOOT
            { id: 'shootButton', text: 'SHOOT', action: 'shoot', position: { right: this.margin + (this.joystickSize - this.actionButtonSize) / 2, bottom: this.margin + this.joystickSize + this.margin } },
            
            // Left of right joystick - PUNCH
            { id: 'punchButton', text: 'PUNCH', action: 'punch', position: { right: this.margin + this.joystickSize + this.margin, bottom: this.margin + (this.joystickSize - this.actionButtonSize) / 2 } },
            
            // Between joysticks at bottom - KICK
            { id: 'kickButton', text: 'KICK', action: 'kick', position: { left: '50%', transform: 'translateX(-50%)', bottom: this.margin } }
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
            button.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
            button.style.border = '3px solid rgba(255, 255, 255, 0.9)';
            button.style.display = 'flex';
            button.style.justifyContent = 'center';
            button.style.alignItems = 'center';
            button.style.color = 'white';
            button.style.fontWeight = 'bold';
            button.style.fontSize = '12px';
            button.style.userSelect = 'none';
            button.style.pointerEvents = 'auto';
            button.style.touchAction = 'none';
            button.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.5)';
            
            // Set position
            Object.keys(config.position).forEach(key => {
                button.style[key] = typeof config.position[key] === 'number' ? 
                    `${config.position[key]}px` : config.position[key];
            });
            
            button.textContent = config.text;
            this.container.appendChild(button);
        });
    }
    
    updateControlPositions() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Adjust sizes based on screen dimensions
        this.joystickSize = Math.min(120, Math.max(80, Math.floor(Math.min(width, height) * 0.15)));
        this.actionButtonSize = Math.min(70, Math.max(50, Math.floor(this.joystickSize * 0.6)));
        this.margin = Math.min(20, Math.max(10, Math.floor(Math.min(width, height) * 0.03)));
        
        // Update joystick sizes
        this.moveJoystickOuter.style.width = `${this.joystickSize}px`;
        this.moveJoystickOuter.style.height = `${this.joystickSize}px`;
        this.lookJoystickOuter.style.width = `${this.joystickSize}px`;
        this.lookJoystickOuter.style.height = `${this.joystickSize}px`;
        
        this.moveJoystickInner.style.width = `${this.joystickSize / 2}px`;
        this.moveJoystickInner.style.height = `${this.joystickSize / 2}px`;
        this.lookJoystickInner.style.width = `${this.joystickSize / 2}px`;
        this.lookJoystickInner.style.height = `${this.joystickSize / 2}px`;
        
        // Update joystick positions
        this.moveJoystickOuter.style.left = `${this.margin}px`;
        this.moveJoystickOuter.style.bottom = `${this.margin}px`;
        
        this.lookJoystickOuter.style.right = `${this.margin}px`;
        this.lookJoystickOuter.style.bottom = `${this.margin}px`;
        
        // Update action buttons
        const jumpButton = document.getElementById('jumpButton');
        const sprintButton = document.getElementById('sprintButton');
        const shootButton = document.getElementById('shootButton');
        const punchButton = document.getElementById('punchButton');
        const kickButton = document.getElementById('kickButton');
        
        if (jumpButton) {
            jumpButton.style.width = `${this.actionButtonSize}px`;
            jumpButton.style.height = `${this.actionButtonSize}px`;
            jumpButton.style.left = `${this.margin + (this.joystickSize - this.actionButtonSize) / 2}px`;
            jumpButton.style.bottom = `${this.margin + this.joystickSize + this.margin}px`;
        }
        
        if (sprintButton) {
            sprintButton.style.width = `${this.actionButtonSize}px`;
            sprintButton.style.height = `${this.actionButtonSize}px`;
            sprintButton.style.left = `${this.margin + this.joystickSize + this.margin}px`;
            sprintButton.style.bottom = `${this.margin + (this.joystickSize - this.actionButtonSize) / 2}px`;
        }
        
        if (shootButton) {
            shootButton.style.width = `${this.actionButtonSize}px`;
            shootButton.style.height = `${this.actionButtonSize}px`;
            shootButton.style.right = `${this.margin + (this.joystickSize - this.actionButtonSize) / 2}px`;
            shootButton.style.bottom = `${this.margin + this.joystickSize + this.margin}px`;
        }
        
        if (punchButton) {
            punchButton.style.width = `${this.actionButtonSize}px`;
            punchButton.style.height = `${this.actionButtonSize}px`;
            punchButton.style.right = `${this.margin + this.joystickSize + this.margin}px`;
            punchButton.style.bottom = `${this.margin + (this.joystickSize - this.actionButtonSize) / 2}px`;
        }
        
        if (kickButton) {
            kickButton.style.width = `${this.actionButtonSize}px`;
            kickButton.style.height = `${this.actionButtonSize}px`;
            kickButton.style.left = '50%';
            kickButton.style.transform = 'translateX(-50%)';
            kickButton.style.bottom = `${this.margin}px`;
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
                button.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
                button.style.transform = 'scale(0.95)';
                this.triggerAction(action, true);
            });
            
            button.addEventListener('touchend', (e) => {
                const action = button.dataset.action;
                this.actionButtons[action] = false;
                button.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
                button.style.transform = '';
                this.triggerAction(action, false);
            });
        });
    }
    
    isTouchOnJoystick(touch, joystickElement) {
        const rect = joystickElement.getBoundingClientRect();
        return touch.clientX >= rect.left && 
               touch.clientX <= rect.right && 
               touch.clientY >= rect.top && 
               touch.clientY <= rect.bottom;
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
        
        // Calculate distance from center
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Calculate max displacement (radius of outer joystick)
        const maxDistance = this.joystickSize / 2;
        
        // Normalize direction
        joystick.direction.x = deltaX / Math.max(distance, 1);
        joystick.direction.y = deltaY / Math.max(distance, 1);
        
        // Clamp distance to max radius
        const clampedDistance = Math.min(distance, maxDistance);
        
        // Calculate new position
        const newX = joystick.direction.x * clampedDistance;
        const newY = joystick.direction.y * clampedDistance;
        
        // Update inner joystick position
        joystickInner.style.transform = `translate(calc(-50% + ${newX}px), calc(-50% + ${newY}px))`;
        
        // Update player controls
        this.updatePlayerControls();
    }
    
    resetJoystick(joystickType) {
        const joystick = joystickType === 'move' ? this.moveJoystick : this.lookJoystick;
        const joystickInner = joystickType === 'move' ? this.moveJoystickInner : this.lookJoystickInner;
        
        joystick.active = false;
        joystick.direction.x = 0;
        joystick.direction.y = 0;
        
        // Reset inner joystick position
        joystickInner.style.transform = 'translate(-50%, -50%)';
        
        // Update player controls
        this.updatePlayerControls();
    }
    
    resetActionButtonsIfNeeded(touches) {
        const actionButtons = document.querySelectorAll('.action-button');
        
        actionButtons.forEach(button => {
            if (!this.isTouchActiveOnElement(touches, button)) {
                const action = button.dataset.action;
                if (this.actionButtons[action]) {
                    this.actionButtons[action] = false;
                    button.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
                    button.style.transform = '';
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
        if (this.lookJoystick.active) {
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
                if (isActive) this.game.localPlayer.jump();
                break;
            case 'kick':
                if (isActive) this.game.localPlayer.kick();
                break;
            case 'punch':
                if (isActive) this.game.localPlayer.punch();
                break;
            case 'shoot':
                if (isActive) this.game.localPlayer.shoot();
                break;
            // Sprint is handled in updatePlayerControls
        }
    }
} 