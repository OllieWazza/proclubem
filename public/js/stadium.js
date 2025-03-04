class Stadium {
    constructor(scene) {
        this.scene = scene;
        this.createField();
        this.createGoals();
        this.createStands();
        this.createAdvertisingBoards();
        this.createFloodlights();
    }

    createField() {
        // Field dimensions - making it bigger (x2)
        const fieldWidth = 300; // Increased from 150
        const fieldLength = 180; // Increased from 90
        const boardGap = 2; // Gap between pitch and boards

        // Main field
        const fieldGeometry = new THREE.PlaneGeometry(fieldWidth, fieldLength);
        const fieldTexture = this.createFieldTexture(fieldWidth, fieldLength);
        const fieldMaterial = new THREE.MeshPhongMaterial({
            map: fieldTexture,
            side: THREE.DoubleSide
        });
        const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
        field.rotation.x = -Math.PI / 2;
        field.receiveShadow = true;
        this.scene.add(field);

        // Field boundaries (invisible walls) - moved outside the advertising boards
        const wallGeometry = new THREE.BoxGeometry(1, 20, fieldLength + (boardGap * 2 + 2)); // Added extra width for boards
        const wallMaterial = new THREE.MeshBasicMaterial({ visible: false });
        
        // Left wall
        const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
        leftWall.position.set(-(fieldWidth/2 + boardGap + 1), 10, 0); // Moved out by board gap + thickness
        this.scene.add(leftWall);
        
        // Right wall
        const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
        rightWall.position.set(fieldWidth/2 + boardGap + 1, 10, 0); // Moved out by board gap + thickness
        this.scene.add(rightWall);
        
        // Back walls (behind goals)
        const backWallGeometry = new THREE.BoxGeometry(fieldWidth + (boardGap * 2 + 2), 20, 1);
        
        const backWall1 = new THREE.Mesh(backWallGeometry, wallMaterial);
        backWall1.position.set(0, 10, fieldLength/2 + boardGap + 1);
        this.scene.add(backWall1);
        
        const backWall2 = new THREE.Mesh(backWallGeometry, wallMaterial);
        backWall2.position.set(0, 10, -(fieldLength/2 + boardGap + 1));
        this.scene.add(backWall2);
    }

    createFieldTexture(width, length) {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');

        // Green base
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Field lines
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 4;
        const scale = canvas.width / width;

        // Outer boundary
        ctx.strokeRect(
            canvas.width * 0.05,
            canvas.height * 0.05,
            canvas.width * 0.9,
            canvas.height * 0.9
        );

        // Center line
        ctx.beginPath();
        ctx.moveTo(canvas.width/2, canvas.height * 0.05);
        ctx.lineTo(canvas.width/2, canvas.height * 0.95);
        ctx.stroke();

        // Center circle
        ctx.beginPath();
        ctx.arc(
            canvas.width/2,
            canvas.height/2,
            canvas.width * 0.1,
            0,
            Math.PI * 2
        );
        ctx.stroke();

        // Penalty areas
        const penaltyAreaWidth = canvas.width * 0.3;
        const penaltyAreaHeight = canvas.height * 0.2;
        
        // Left penalty area
        ctx.strokeRect(
            canvas.width * 0.05,
            (canvas.height - penaltyAreaHeight) / 2,
            penaltyAreaWidth,
            penaltyAreaHeight
        );

        // Right penalty area
        ctx.strokeRect(
            canvas.width * 0.95 - penaltyAreaWidth,
            (canvas.height - penaltyAreaHeight) / 2,
            penaltyAreaWidth,
            penaltyAreaHeight
        );

        // Create grass pattern
        for (let i = 0; i < 50; i++) {
            ctx.strokeStyle = i % 2 === 0 ? '#43A047' : '#388E3C';
            ctx.lineWidth = canvas.width / 50;
            ctx.beginPath();
            ctx.moveTo(i * canvas.width / 25, 0);
            ctx.lineTo(i * canvas.width / 25, canvas.height);
            ctx.stroke();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    createGoals() {
        const goalWidth = 14.64; // Doubled from 7.32
        const goalHeight = 4.88; // Doubled from 2.44
        const goalDepth = 4;     // Doubled from 2
        const poleRadius = 0.12;  // Doubled from 0.06
        const fieldWidth = 300;   // Field width
        const whiteLineOffset = fieldWidth * 0.9; // Match the white line position from createFieldTexture

        const goalGeometry = new THREE.CylinderGeometry(poleRadius, poleRadius, goalHeight);
        const goalMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });

        // Create goals at the east/west sides
        [-1, 1].forEach(side => {
            const goalGroup = new THREE.Group();

            // Vertical posts
            const leftPost = new THREE.Mesh(goalGeometry, goalMaterial);
            leftPost.position.set(-goalWidth/2, goalHeight/2, 0);
            goalGroup.add(leftPost);

            const rightPost = new THREE.Mesh(goalGeometry, goalMaterial);
            rightPost.position.set(goalWidth/2, goalHeight/2, 0);
            goalGroup.add(rightPost);

            // Crossbar
            const crossbarGeometry = new THREE.CylinderGeometry(poleRadius, poleRadius, goalWidth);
            crossbarGeometry.rotateZ(Math.PI/2);
            const crossbar = new THREE.Mesh(crossbarGeometry, goalMaterial);
            crossbar.position.set(0, goalHeight, 0);
            goalGroup.add(crossbar);

            // Net
            const netGeometry = new THREE.PlaneGeometry(goalWidth, goalHeight);
            const netMaterial = new THREE.MeshPhongMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide
            });

            // Back net
            const backNet = new THREE.Mesh(netGeometry, netMaterial);
            backNet.position.set(0, goalHeight/2, -goalDepth);
            goalGroup.add(backNet);

            // Top net
            const topNet = new THREE.Mesh(
                new THREE.PlaneGeometry(goalWidth, goalDepth),
                netMaterial
            );
            topNet.rotation.x = Math.PI/2;
            topNet.position.set(0, goalHeight, -goalDepth/2);
            goalGroup.add(topNet);

            // Side nets
            [-1, 1].forEach(sideSign => {
                const sideNet = new THREE.Mesh(
                    new THREE.PlaneGeometry(goalDepth, goalHeight),
                    netMaterial
                );
                sideNet.rotation.y = Math.PI/2;
                sideNet.position.set(sideSign * goalWidth/2, goalHeight/2, -goalDepth/2);
                goalGroup.add(sideNet);
            });

            // Position the goal at the east/west sides on the white lines
            goalGroup.position.set(side * (whiteLineOffset/2), 0, 0);
            goalGroup.rotation.y = side > 0 ? -Math.PI/2 : Math.PI/2; // Rotate to face inward
            this.scene.add(goalGroup);
        });
    }

    createStands() {
        const fieldWidth = 300;
        const fieldLength = 180;
        const standHeight = 30; // Slightly reduced height for bleachers
        const standDepth = 40;  // Increased depth for diagonal seating
        const seatRows = 30;    // More rows
        const seatsPerSection = 80;
        const gapBetweenPitch = 8;
        const bleacherAngle = Math.PI * 0.2; // About 36 degrees slope

        // Create stands on all four sides
        const standConfigs = [
            // Long sides (left and right)
            {
                width: fieldLength + 40,
                depth: standDepth,
                position: { x: -(fieldWidth/2 + gapBetweenPitch + standDepth/2), z: 0 },
                rotation: -Math.PI/2,
                sections: Math.ceil(fieldLength/15)
            },
            {
                width: fieldLength + 40,
                depth: standDepth,
                position: { x: (fieldWidth/2 + gapBetweenPitch + standDepth/2), z: 0 },
                rotation: Math.PI/2,
                sections: Math.ceil(fieldLength/15)
            },
            // Short sides (goals)
            {
                width: fieldWidth + 40,
                depth: standDepth,
                position: { x: 0, z: -(fieldLength/2 + gapBetweenPitch + standDepth/2) },
                rotation: Math.PI,
                sections: Math.ceil(fieldWidth/15)
            },
            {
                width: fieldWidth + 40,
                depth: standDepth,
                position: { x: 0, z: (fieldLength/2 + gapBetweenPitch + standDepth/2) },
                rotation: 0,
                sections: Math.ceil(fieldWidth/15)
            }
        ];

        standConfigs.forEach(config => {
            const standGroup = new THREE.Group();

            // Create diagonal bleacher base
            const baseGeometry = new THREE.BoxGeometry(config.width, 2, config.depth);
            const baseMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
            const base = new THREE.Mesh(baseGeometry, baseMaterial);
            base.position.y = 1;
            standGroup.add(base);

            // Create bleacher steps
            const stepHeight = standHeight / seatRows;
            const stepDepth = config.depth / seatRows;

            for (let row = 0; row < seatRows; row++) {
                const stepGeometry = new THREE.BoxGeometry(config.width, stepHeight, stepDepth);
                const step = new THREE.Mesh(stepGeometry, baseMaterial);
                
                // Position each step diagonally
                step.position.set(
                    0,
                    row * stepHeight * Math.cos(bleacherAngle) + stepHeight/2,
                    -config.depth/2 + row * stepDepth + stepDepth/2
                );
                
                standGroup.add(step);

                // Add seats and spectators on each step
                const seatsPerRow = Math.floor(seatsPerSection * (config.width / 300));
                const seatSpacing = config.width / seatsPerRow;

                for (let seat = 0; seat < seatsPerRow; seat++) {
                    if (Math.random() > 0.3) { // 70% chance of spectator
                        // Create spectator
                        const spectator = this.createSpectatorModel();
                        
                        // Position spectator on the step
                        spectator.position.set(
                            (seat * seatSpacing) - (config.width/2) + (seatSpacing/2),
                            row * stepHeight * Math.cos(bleacherAngle) + stepHeight,
                            -config.depth/2 + row * stepDepth + stepDepth/2
                        );

                        // Make spectator face the field
                        spectator.lookAt(new THREE.Vector3(
                            spectator.position.x,
                            0,
                            spectator.position.z - config.depth
                        ));

                        standGroup.add(spectator);
                    }
                }
            }

            standGroup.position.set(config.position.x, 0, config.position.z);
            standGroup.rotation.y = config.rotation;
            this.scene.add(standGroup);
        });
    }

    createSpectatorModel() {
        const spectator = new THREE.Group();

        // Random spectator color
        const spectatorColors = [
            0xff0000, 0x00ff00, 0x0000ff, 0xffff00,
            0xff00ff, 0x00ffff, 0xff8800, 0x8800ff
        ];
        const color = spectatorColors[Math.floor(Math.random() * spectatorColors.length)];

        // Body
        const bodyGeometry = new THREE.BoxGeometry(0.4, 0.6, 0.4);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: color });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.3;
        spectator.add(body);

        // Head
        const headGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const headMaterial = new THREE.MeshPhongMaterial({ color: 0xffdbac });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 0.75;
        spectator.add(head);

        // Arms
        const armGeometry = new THREE.BoxGeometry(0.2, 0.4, 0.2);
        const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
        leftArm.position.set(-0.3, 0.4, 0);
        spectator.add(leftArm);

        const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
        rightArm.position.set(0.3, 0.4, 0);
        spectator.add(rightArm);

        // Random slight variations
        spectator.rotation.y = (Math.random() - 0.5) * 0.2;
        return spectator;
    }

    createFloodlights() {
        const fieldWidth = 300;
        const fieldLength = 180;
        const standDepth = 40;
        const gapBetweenPitch = 8;
        const totalStandWidth = standDepth + gapBetweenPitch;

        const floodlightPositions = [
            { x: fieldWidth/2 + totalStandWidth, z: fieldLength/2 + totalStandWidth },  // Behind stands in corners
            { x: -(fieldWidth/2 + totalStandWidth), z: fieldLength/2 + totalStandWidth },
            { x: fieldWidth/2 + totalStandWidth, z: -(fieldLength/2 + totalStandWidth) },
            { x: -(fieldWidth/2 + totalStandWidth), z: -(fieldLength/2 + totalStandWidth) }
        ];

        floodlightPositions.forEach(pos => {
            const poleHeight = 60;
            const poleRadius = 1;

            // Create pole
            const poleGeometry = new THREE.CylinderGeometry(poleRadius, poleRadius * 1.5, poleHeight);
            const poleMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
            const pole = new THREE.Mesh(poleGeometry, poleMaterial);
            pole.position.set(pos.x, poleHeight/2, pos.z);
            this.scene.add(pole);

            // Create light housing
            const housingGeometry = new THREE.BoxGeometry(8, 4, 8);
            const housingMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
            const housing = new THREE.Mesh(housingGeometry, housingMaterial);
            housing.position.set(pos.x, poleHeight, pos.z);
            
            // Angle the housing towards the field center
            housing.lookAt(0, poleHeight, 0);
            housing.rotateX(Math.PI * 0.15); // Angle downwards
            this.scene.add(housing);

            // Add light effect (glowing material)
            const glowGeometry = new THREE.BoxGeometry(7.8, 3.8, 0.1);
            const glowMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xffffcc,
                transparent: true,
                opacity: 0.8
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            glow.position.z = -3.9; // Position just in front of the housing
            housing.add(glow);
        });
    }

    createAdvertisingBoards() {
        const fieldWidth = 300;
        const fieldLength = 180;
        const boardWidth = 10;
        const boardHeight = 1.5;
        const boardGeometry = new THREE.BoxGeometry(boardWidth, boardHeight, 0.2);
        const boardMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            map: this.createAdvertisingTexture()
        });

        // Place boards around the entire pitch with a small gap
        const gap = 2; // Gap between pitch and boards

        // Long sides
        for (let x = -fieldWidth/2; x <= fieldWidth/2 - boardWidth; x += boardWidth) {
            [-fieldLength/2 - gap, fieldLength/2 + gap].forEach(z => {
                const board = new THREE.Mesh(boardGeometry, boardMaterial);
                board.position.set(x + boardWidth/2, boardHeight/2, z);
                board.rotation.y = z > 0 ? Math.PI : 0;
                this.scene.add(board);
            });
        }

        // Short sides
        const shortBoardGeometry = new THREE.BoxGeometry(boardWidth, boardHeight, 0.2);
        for (let z = -fieldLength/2; z <= fieldLength/2 - boardWidth; z += boardWidth) {
            [-fieldWidth/2 - gap, fieldWidth/2 + gap].forEach(x => {
                const board = new THREE.Mesh(shortBoardGeometry, boardMaterial);
                board.position.set(x, boardHeight/2, z + boardWidth/2);
                board.rotation.y = x > 0 ? -Math.PI/2 : Math.PI/2;
                this.scene.add(board);
            });
        }
    }

    createAdvertisingTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024; // Increased from 512 for more detail
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Create a pattern with clear spacing between sections
        const sectionWidth = 340; // Width of each section
        const spacing = 120; // Space between sections
        
        // Draw multiple sections with spacing
        for (let x = 0; x < canvas.width; x += sectionWidth + spacing) {
            // Section background with gradient
            const gradient = ctx.createLinearGradient(x, 0, x + sectionWidth, 0);
            gradient.addColorStop(0, '#f0f0f0');
            gradient.addColorStop(0.5, '#ffffff');
            gradient.addColorStop(1, '#f0f0f0');
            ctx.fillStyle = gradient;
            ctx.fillRect(x, 0, sectionWidth, canvas.height);
            
            // Add border to section
            ctx.strokeStyle = '#cccccc';
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 2, 2, sectionWidth - 4, canvas.height - 4);
            
            // Text
            ctx.fillStyle = '#000066'; // Dark blue for better contrast
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Add text shadow for better readability
            ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            
            ctx.fillText('www.scoutersports.com', x + sectionWidth/2, canvas.height/2);
            
            // Reset shadow
            ctx.shadowColor = 'transparent';
        }

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
} 