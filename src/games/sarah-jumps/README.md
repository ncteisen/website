# Sarah Jumps Game

A Doodle Jump clone built with TypeScript and Astro.

## Game Structure

The game is structured in a modular way to make it easy to extend and maintain:

```
src/games/sarah-jumps/
├── js/
│   ├── core/
│   │   └── GameEngine.ts       # Core game engine that handles the game loop and state management
│   ├── entities/
│   │   ├── Player.ts           # Player entity
│   │   ├── Platform.ts         # Platform entity
│   │   └── PlatformManager.ts  # Manages multiple platforms and their interactions with the player
│   ├── ui/
│   │   └── ScoreDisplay.ts     # UI component for displaying the current score
│   ├── utils/
│   │   └── InputHandler.ts     # Manages keyboard input for the game
│   └── SarahJumps.ts           # Main game class that initializes and runs the game
└── README.md                   # This file
```

## How to Extend the Game

### Adding New Entities

To add a new entity to the game:

1. Create a new file in the `entities` directory
2. Implement the entity with the following methods:
   - `init(game)`: Initialize the entity
   - `update(deltaTime, game)`: Update the entity
   - `render(ctx)`: Render the entity
   - `reset()`: Reset the entity

3. Add the entity to the game in `SarahJumps.ts`:

```typescript
// Initialize the new entity
const newEntity = new NewEntity(this.game.getCanvas());

// Add the entity to the game
this.game.addEntity(newEntity);
```

### Adding New UI Components

To add a new UI component:

1. Create a new file in the `ui` directory
2. Implement the component with the following methods:
   - `init(game)`: Initialize the component
   - `update(deltaTime, game)`: Update the component
   - `render(ctx, game)`: Render the component
   - `reset()`: Reset the component

3. Add the component to the game in `SarahJumps.ts`:

```typescript
// Initialize the new UI component
const newUIComponent = new NewUIComponent();

// Add the component to the game
this.game.addEntity(newUIComponent);
```

### Adding New Game Features

To add a new game feature:

1. Identify which part of the game the feature belongs to (core, entities, ui, utils)
2. Implement the feature in the appropriate file
3. If the feature requires a new entity or UI component, follow the steps above

## Game States

The game has three states:

- `start`: The game is at the start screen
- `playing`: The game is being played
- `gameOver`: The game is over

## Input Handling

The game handles keyboard input through the `InputHandler` class. To add new input handling:

1. Modify the `InputHandler.ts` file
2. Add new key handlers in the `handleKeyDown` and `handleKeyUp` methods
3. Add new continuous key handling in the `update` method

## Rendering

The game uses the HTML5 Canvas API for rendering. To add new rendering:

1. Modify the appropriate entity or UI component
2. Add new rendering code in the `render` method

## Physics

The game uses a simple physics system for the player and platforms. To modify the physics:

1. Modify the `Player.ts` and `Platform.ts` files
2. Adjust the physics parameters in the constructor
3. Modify the physics calculations in the `update` method 