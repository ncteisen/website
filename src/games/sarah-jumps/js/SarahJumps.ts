import { GameEngine } from './core/GameEngine';
import { InputHandler } from './utils/InputHandler';

/**
 * SarahJumps - Main game class that initializes and runs the game
 */
export class SarahJumps {
  private game: GameEngine;
  private inputHandler: InputHandler;
  
  constructor(canvasId: string) {
    // Initialize game engine
    this.game = new GameEngine(canvasId);
    
    // Initialize input handler
    this.inputHandler = new InputHandler(this.game, this.game.getPlayer());
  }
  
  /**
   * Start the game
   */
  public start(): void {
    this.game.init();
  }
  
  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.inputHandler.cleanup();
  }
} 