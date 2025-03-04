/**
 * MobileControls - A complete rewrite of the mobile controls system
 * Focused on reliability, usability, and multi-touch support
 */
class MobileControls {
    constructor(game) {
        this.game = game;
        this.isMobile = this.detectMobile();
        
        // Only initialize on mobile devices
        if (!this.isMobile) return;
        
        // Control sizes and positioning
        this.viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        // Calculate sizes based on viewport
        this.sizes = {
            joystick: Math.min(this.viewport.width, this.viewport.height) * 0.15, // 15% of smaller dimension
            button: Math.min(this.viewport.width, this.viewport.height) * 0.09,   // 9% of smaller dimension
            margin: Math.min(this.viewport.width, this.viewport.height) * 0.02     // 2% of smaller dimension
        };
        
        // Touch tracking for multi-touch support
        this.touches = new Map(); // Maps touchId to control element
        
        // Joystick states
        this.moveJoystick = {
            active: false,
            baseX: 0,
            baseY: 0,
            currentX: 0,
            currentY: 0,
            direction: { x: 0, y: 0 },
            element: null,
            knob: null,
            touchId: null
        };
        
        this.lookJoystick = {
            active: false,
            baseX: 0,
            baseY: 0,
            currentX: 0,
            currentY: 0,
            direction: { x: 0, y: 0 },
            element: null,
            knob: null,
            touchId: null
        };
        
        // Action button states
        this.actionButtons = {
            jump: { active: false, element: null, touchId: null },
            sprint: { active: false, element: null, touchId: null },
            kick: { active: false, element: null, touchId: null },
            punch: { active: false, element: null, touchId: null },
            shoot: { active: false, element: null, touchId: null }
        };
        
        // Initialize the controls
        this.init();
    }
    
    /**
     * Detect if the device is mobile
     */
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               window.innerWidth <= 800 || window.orientation !== undefined;
    }
    
    /**
     * Initialize the mobile controls
     */
    init() {
        // Create the UI elements
        this.createControlsContainer();
        this.createJoysticks();
        this.createActionButtons();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Handle orientation and resize
        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('orientationchange', () => {
            // Delay to allow orientation change to complete
            setTimeout(() => this.handleResize(), 300);
        });
        
        console.log('Mobile controls initialized');
    }
    
    /**
     * Create the container for all mobile controls
     */
    createControlsContainer() {
        this.container = document.createElement('div');
        this.container.id = 'mobileControls';
        document.body.appendChild(this.container);
    }
    
    /**
     * Create both joysticks
     */
    createJoysticks() {
        // Create movement joystick (left side)
        this.moveJoystick.element = this.createJoystickBase('moveJoystick');
        this.moveJoystick.knob = this.createJoystickKnob('moveJoystickKnob');
        this.moveJoystick.element.appendChild(this.moveJoystick.knob);
        this.container.appendChild(this.moveJoystick.element);
        
        // Create look joystick (right side)
        this.lookJoystick.element = this.createJoystickBase('lookJoystick');
        this.lookJoystick.knob = this.createJoystickKnob('lookJoystickKnob');
        this.lookJoystick.element.appendChild(this.lookJoystick.knob);
        this.container.appendChild(this.lookJoystick.element);
    }
    
    /**
     * Create a joystick base element
     */
    createJoystickBase(id) {
        const base = document.createElement('div');
        base.id = id;
        base.className = 'mobile-joystick';
        base.style.position = 'absolute';
        base.style.width = `${this.sizes.joystick}px`;
        base.style.height = `${this.sizes.joystick}px`;
        base.style.borderRadius = '50%';
        base.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        base.style.border = '2px solid rgba(255, 255, 255, 0.5)';
        base.style.pointerEvents = 'auto';
        base.style.touchAction = 'none';
        base.style.userSelect = 'none';
        base.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
        return base;
    }
    
    /**
     * Create a joystick knob element
     */
    createJoystickKnob(id) {
        const knob = document.createElement('div');
        knob.id = id;
        knob.className = 'mobile-joystick-knob';
        knob.style.position = 'absolute';
        knob.style.width = `${this.sizes.joystick * 0.5}px`;
        knob.style.height = `${this.sizes.joystick * 0.5}px`;
        knob.style.borderRadius = '50%';
        knob.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
        knob.style.left = '50%';
        knob.style.top = '50%';
        knob.style.transform = 'translate(-50%, -50%)';
        knob.style.pointerEvents = 'none';
        knob.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.3)';
        return knob;
    }
    
    /**
     * Create all action buttons
     */
    createActionButtons() {
        // Button configurations with icons
        const buttonConfigs = [
            { id: 'jumpButton', action: 'jump', icon: '↑', position: 'left', offset: 1 },
            { id: 'sprintButton', action: 'sprint', icon: '⚡', position: 'left', offset: 0 },
            { id: 'kickButton', action: 'kick', icon: '👟', position: 'right', offset: 0 },
            { id: 'punchButton', action: 'punch', icon: '👊', position: 'right', offset: 1 },
            { id: 'shootButton', action: 'shoot', icon: '🔫', position: 'right', offset: 2 }
        ];
        
        buttonConfigs.forEach(config => {
            const button = this.createActionButton(config.id, config.action, config.icon);
            this.actionButtons[config.action].element = button;
            this.container.appendChild(button);
        });
    }
    
    /**
     * Create a single action button
     */
    createActionButton(id, action, icon) {
        const button = document.createElement('div');
        button.id = id;
        button.className = 'mobile-button';
        button.dataset.action = action;
        button.style.position = 'absolute';
        button.style.width = `${this.sizes.button}px`;
        button.style.height = `${this.sizes.button}px`;
        button.style.borderRadius = '50%';
        button.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        button.style.border = '2px solid rgba(255, 255, 255, 0.5)';
        button.style.display = 'flex';
        button.style.justifyContent = 'center';
        button.style.alignItems = 'center';
        button.style.fontSize = `${this.sizes.button * 0.5}px`;
        button.style.color = 'white';
        button.style.pointerEvents = 'auto';
        button.style.touchAction = 'none';
        button.style.userSelect = 'none';
        button.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
        button.textContent = icon;
        return button;
    }
    
    /**
     * Set up all event listeners for touch controls
     */
    setupEventListeners() {
        // Prevent default touch behaviors that might interfere with the game
        document.addEventListener('touchstart', e => {
            if (e.target.closest('#mobileControls')) {
                e.preventDefault();
            }
        }, { passive: false });
        
        document.addEventListener('touchmove', e => {
            if (e.target.closest('#mobileControls')) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Touch start - track new touches and assign them to controls
        document.addEventListener('touchstart', e => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                this.handleTouchStart(touch);
            }
        });
        
        // Touch move - update control positions
        document.addEventListener('touchmove', e => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                this.handleTouchMove(touch);
            }
        });
        
        // Touch end - remove touch tracking and reset controls
        document.addEventListener('touchend', e => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                this.handleTouchEnd(touch);
            }
        });
        
        document.addEventListener('touchcancel', e => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                this.handleTouchEnd(touch);
            }
        });
    }
    
    /**
     * Handle the start of a touch
     */
    handleTouchStart(touch) {
        const touchX = touch.clientX;
        const touchY = touch.clientY;
        
        // Check if touch is on a joystick
        if (this.isPointInElement(touchX, touchY, this.moveJoystick.element)) {
            this.activateJoystick('move', touch);
        } 
        else if (this.isPointInElement(touchX, touchY, this.lookJoystick.element)) {
            this.activateJoystick('look', touch);
        }
        // Check if touch is on an action button
        else {
            for (const action in this.actionButtons) {
                const button = this.actionButtons[action];
                if (button.element && this.isPointInElement(touchX, touchY, button.element)) {
                    this.activateButton(action, touch);
                    break;
                }
            }
        }
    }
    
    /**
     * Handle touch movement
     */
    handleTouchMove(touch) {
        const controlElement = this.touches.get(touch.identifier);
        if (!controlElement) return;
        
        // Handle joystick movement
        if (controlElement === this.moveJoystick.element) {
            this.updateJoystickPosition('move', touch.clientX, touch.clientY);
        } 
        else if (controlElement === this.lookJoystick.element) {
            this.updateJoystickPosition('look', touch.clientX, touch.clientY);
        }
    }
    
    /**
     * Handle the end of a touch
     */
    handleTouchEnd(touch) {
        const controlElement = this.touches.get(touch.identifier);
        if (!controlElement) return;
        
        // Handle joystick release
        if (controlElement === this.moveJoystick.element) {
            this.deactivateJoystick('move');
        } 
        else if (controlElement === this.lookJoystick.element) {
            this.deactivateJoystick('look');
        }
        // Handle button release
        else {
            for (const action in this.actionButtons) {
                const button = this.actionButtons[action];
                if (button.element === controlElement) {
                    this.deactivateButton(action);
                    break;
                }
            }
        }
        
        // Remove touch tracking
        this.touches.delete(touch.identifier);
    }
    
    /**
     * Activate a joystick with a touch
     */
    activateJoystick(type, touch) {
        const joystick = type === 'move' ? this.moveJoystick : this.lookJoystick;
        
        // Only activate if not already active
        if (!joystick.active) {
            joystick.active = true;
            joystick.touchId = touch.identifier;
            
            // Store the base position (center of the joystick)
            const rect = joystick.element.getBoundingClientRect();
            joystick.baseX = rect.left + rect.width / 2;
            joystick.baseY = rect.top + rect.height / 2;
            
            // Set initial position
            joystick.currentX = touch.clientX;
            joystick.currentY = touch.clientY;
            
            // Track this touch
            this.touches.set(touch.identifier, joystick.element);
            
            // Update joystick visually
            this.updateJoystickPosition(type, touch.clientX, touch.clientY);
        }
    }
    
    /**
     * Update a joystick's position based on touch coordinates
     */
    updateJoystickPosition(type, touchX, touchY) {
        try {
            const joystick = type === 'move' ? this.moveJoystick : this.lookJoystick;
            if (!joystick.active) return;
            
            // Calculate displacement from base position
            const deltaX = touchX - joystick.baseX;
            const deltaY = touchY - joystick.baseY;
            
            // Calculate distance
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // Maximum distance the knob can move (radius of joystick)
            const maxDistance = this.sizes.joystick / 2;
            
            // Normalize and limit displacement
            if (distance > maxDistance) {
                // Limit to the edge of the joystick
                const ratio = maxDistance / distance;
                joystick.direction.x = deltaX * ratio / maxDistance;
                joystick.direction.y = deltaY * ratio / maxDistance;
                
                // Position knob at the edge
                const limitedX = deltaX * ratio;
                const limitedY = deltaY * ratio;
                joystick.knob.style.transform = `translate(calc(-50% + ${limitedX}px), calc(-50% + ${limitedY}px))`;
            } else {
                // Within bounds, use actual position
                joystick.direction.x = deltaX / maxDistance;
                joystick.direction.y = deltaY / maxDistance;
                joystick.knob.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
            }
            
            // Update player controls
            this.updatePlayerControls();
        } catch (error) {
            console.error(`Error updating joystick position (${type}):`, error);
            this.deactivateJoystick(type);
        }
    }
    
    /**
     * Deactivate a joystick
     */
    deactivateJoystick(type) {
        try {
            const joystick = type === 'move' ? this.moveJoystick : this.lookJoystick;
            
            joystick.active = false;
            joystick.touchId = null;
            joystick.direction.x = 0;
            joystick.direction.y = 0;
            
            // Reset knob position
            joystick.knob.style.transform = 'translate(-50%, -50%)';
            
            // Update player controls to stop movement
            this.updatePlayerControls();
        } catch (error) {
            console.error(`Error deactivating joystick (${type}):`, error);
        }
    }
    
    /**
     * Activate a button with a touch
     */
    activateButton(action, touch) {
        const button = this.actionButtons[action];
        
        // Only activate if not already active
        if (!button.active) {
            button.active = true;
            button.touchId = touch.identifier;
            
            // Track this touch
            this.touches.set(touch.identifier, button.element);
            
            // Update button visually
            button.element.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
            button.element.style.transform = 'scale(0.95)';
            
            // Trigger the action
            this.triggerAction(action, true);
        }
    }
    
    /**
     * Deactivate a button
     */
    deactivateButton(action) {
        const button = this.actionButtons[action];
        
        button.active = false;
        button.touchId = null;
        
        // Update button visually
        button.element.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        button.element.style.transform = 'scale(1)';
        
        // Trigger the action (release)
        this.triggerAction(action, false);
    }
    
    /**
     * Update player controls based on joystick and button states
     */
    updatePlayerControls() {
        if (!this.game.localPlayer) return;
        
        try {
            // Update movement controls based on move joystick
            if (this.moveJoystick.active) {
                // Use a small deadzone to prevent accidental movement
                const deadzone = 0.2;
                
                // Forward/backward
                this.game.localPlayer.controls.forward = this.moveJoystick.direction.y < -deadzone;
                this.game.localPlayer.controls.backward = this.moveJoystick.direction.y > deadzone;
                
                // Left/right
                this.game.localPlayer.controls.left = this.moveJoystick.direction.x < -deadzone;
                this.game.localPlayer.controls.right = this.moveJoystick.direction.x > deadzone;
            } else {
                // Reset movement controls when joystick is released
                this.game.localPlayer.controls.forward = false;
                this.game.localPlayer.controls.backward = false;
                this.game.localPlayer.controls.left = false;
                this.game.localPlayer.controls.right = false;
            }
            
            // Update camera rotation based on look joystick
            if (this.lookJoystick.active) {
                // Use a small deadzone to prevent accidental camera movement
                const deadzone = 0.1;
                
                // Adjust rotation speed based on screen size
                const rotationSpeed = 0.03;
                
                // Only rotate if beyond deadzone
                if (Math.abs(this.lookJoystick.direction.x) > deadzone) {
                    // Horizontal rotation (left/right)
                    this.game.localPlayer.mesh.rotation.y -= this.lookJoystick.direction.x * rotationSpeed;
                }
                
                // Vertical rotation (up/down) with constraints
                if (Math.abs(this.lookJoystick.direction.y) > deadzone) {
                    const maxVerticalRotation = Math.PI / 3; // 60 degrees
                    this.game.localPlayer.verticalRotation = Math.max(
                        -maxVerticalRotation,
                        Math.min(
                            maxVerticalRotation,
                            this.game.localPlayer.verticalRotation - this.lookJoystick.direction.y * rotationSpeed
                        )
                    );
                }
            }
            
            // Update sprint control
            this.game.localPlayer.controls.sprint = this.actionButtons.sprint.active;
        } catch (error) {
            console.error("Error updating player controls:", error);
            // Reset all controls to prevent further errors
            if (this.game.localPlayer) {
                this.game.localPlayer.controls.forward = false;
                this.game.localPlayer.controls.backward = false;
                this.game.localPlayer.controls.left = false;
                this.game.localPlayer.controls.right = false;
                this.game.localPlayer.controls.sprint = false;
            }
        }
    }
    
    /**
     * Trigger game actions based on button presses
     */
    triggerAction(action, isActive) {
        if (!this.game.localPlayer) return;
        
        try {
            switch (action) {
                case 'jump':
                    if (isActive && !this.game.localPlayer.isJumping && this.game.localPlayer.stamina >= 15) {
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
        } catch (error) {
            console.error(`Error triggering action (${action}):`, error);
        }
    }
    
    /**
     * Check if a point is inside an element
     */
    isPointInElement(x, y, element) {
        const rect = element.getBoundingClientRect();
        return (
            x >= rect.left &&
            x <= rect.right &&
            y >= rect.top &&
            y <= rect.bottom
        );
    }
    
    /**
     * Handle resize and orientation changes
     */
    handleResize() {
        // Update viewport dimensions
        this.viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        // Recalculate sizes based on new viewport
        this.sizes = {
            joystick: Math.min(this.viewport.width, this.viewport.height) * 0.15,
            button: Math.min(this.viewport.width, this.viewport.height) * 0.09,
            margin: Math.min(this.viewport.width, this.viewport.height) * 0.02
        };
        
        // Update control positions and sizes
        this.updateControlPositions();
    }
    
    /**
     * Update positions and sizes of all controls
     */
    updateControlPositions() {
        // Only proceed if controls are created
        if (!this.moveJoystick.element || !this.lookJoystick.element) return;
        
        try {
            // Update joystick sizes
            this.moveJoystick.element.style.width = `${this.sizes.joystick}px`;
            this.moveJoystick.element.style.height = `${this.sizes.joystick}px`;
            this.lookJoystick.element.style.width = `${this.sizes.joystick}px`;
            this.lookJoystick.element.style.height = `${this.sizes.joystick}px`;
            
            this.moveJoystick.knob.style.width = `${this.sizes.joystick * 0.5}px`;
            this.moveJoystick.knob.style.height = `${this.sizes.joystick * 0.5}px`;
            this.lookJoystick.knob.style.width = `${this.sizes.joystick * 0.5}px`;
            this.lookJoystick.knob.style.height = `${this.sizes.joystick * 0.5}px`;
            
            // Position joysticks
            this.moveJoystick.element.style.left = `${this.sizes.margin}px`;
            this.moveJoystick.element.style.bottom = `${this.sizes.margin}px`;
            
            this.lookJoystick.element.style.right = `${this.sizes.margin}px`;
            this.lookJoystick.element.style.bottom = `${this.sizes.margin}px`;
            
            // Update button sizes
            for (const action in this.actionButtons) {
                const button = this.actionButtons[action];
                if (button.element) {
                    button.element.style.width = `${this.sizes.button}px`;
                    button.element.style.height = `${this.sizes.button}px`;
                    button.element.style.fontSize = `${this.sizes.button * 0.5}px`;
                }
            }
            
            // Position buttons
            const buttonSpacing = this.sizes.button * 1.3;
            
            // Left side buttons
            if (this.actionButtons.jump.element) {
                this.actionButtons.jump.element.style.left = `${this.sizes.margin + this.sizes.joystick + this.sizes.margin}px`;
                this.actionButtons.jump.element.style.bottom = `${this.sizes.margin + buttonSpacing}px`;
            }
            
            if (this.actionButtons.sprint.element) {
                this.actionButtons.sprint.element.style.left = `${this.sizes.margin + this.sizes.joystick + this.sizes.margin}px`;
                this.actionButtons.sprint.element.style.bottom = `${this.sizes.margin}px`;
            }
            
            // Right side buttons
            if (this.actionButtons.kick.element) {
                this.actionButtons.kick.element.style.right = `${this.sizes.margin + this.sizes.joystick + this.sizes.margin}px`;
                this.actionButtons.kick.element.style.bottom = `${this.sizes.margin}px`;
            }
            
            if (this.actionButtons.punch.element) {
                this.actionButtons.punch.element.style.right = `${this.sizes.margin + this.sizes.joystick + this.sizes.margin}px`;
                this.actionButtons.punch.element.style.bottom = `${this.sizes.margin + buttonSpacing}px`;
            }
            
            if (this.actionButtons.shoot.element) {
                this.actionButtons.shoot.element.style.right = `${this.sizes.margin + this.sizes.joystick + this.sizes.margin}px`;
                this.actionButtons.shoot.element.style.bottom = `${this.sizes.margin + buttonSpacing * 2}px`;
            }
        } catch (error) {
            console.error("Error updating control positions:", error);
        }
    }
} 