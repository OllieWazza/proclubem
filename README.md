# Soccer Combat

A multiplayer soccer game with combat elements, built with HTML, JavaScript, and Socket.IO. The game combines traditional soccer gameplay with combat mechanics in a Roblox-like visual style.

## Features

- Third-person perspective soccer game with combat elements
- Team-based gameplay (Blue vs Red)
- Real-time multiplayer using Socket.IO
- Simple, Roblox-style graphics
- Full-size soccer field with proper markings
- Combat system with punching and shooting mechanics
- Stamina system for sprinting
- Goal scoring and tracking
- Stadium environment with spectators and advertising boards

## Controls

- **WASD**: Move player
- **Mouse**: Control camera direction
- **Shift**: Sprint (with stamina meter)
- **Space/Left Click**: Kick ball
- **E**: Punch (25 damage, 2-second stun)
- **Q**: Shoot bullets (75 damage, 100 for headshots)
- **Esc**: Release mouse cursor

## Installation

1. Make sure you have Node.js installed on your system
2. Clone this repository
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm start
   ```
5. Open your browser and navigate to `http://localhost:3000`

## Game Rules

- Teams compete to score goals
- First team to score 20 goals wins, and the match resets
- Players have 100 HP and can be damaged by punches (25 damage) or bullets (75 damage)
- Players respawn after 5 seconds when killed
- Combat is used to disrupt opponents but doesn't contribute to scoring
- Sprinting uses stamina, which regenerates when not sprinting

## Technical Details

- Built with vanilla JavaScript and Three.js for 3D graphics
- Uses Socket.IO for real-time multiplayer functionality
- Implements physics for ball movement and player interactions
- Features a modular codebase with separate components for:
  - Game management
  - Player controls and animation
  - Ball physics
  - Stadium environment
  - Combat system
  - Multiplayer synchronization

## Development

The project is structured as follows:

```
soccer-combat/
├── public/
│   ├── index.html
│   ├── js/
│   │   ├── game.js
│   │   ├── player.js
│   │   ├── ball.js
│   │   └── stadium.js
│   └── sounds/
│       └── cheer.mp3
├── server.js
├── package.json
└── README.md
```

## Contributing

Feel free to submit issues and enhancement requests! 