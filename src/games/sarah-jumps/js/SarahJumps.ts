import { GameEngine } from './core/GameEngine';
import { Player } from './entities/Player';
import { PlatformManager } from './entities/PlatformManager';
import { ScoreDisplay } from './ui/ScoreDisplay';
import { InputHandler } from './utils/InputHandler';

/**
 * SarahJumps - Main game class that initializes and runs the game
 */
export class SarahJumps {
  private game: GameEngine;
  private player: Player;
  private platformManager: PlatformManager;
  private scoreDisplay: ScoreDisplay;
  private inputHandler: InputHandler;
  
  constructor(canvasId: string) {
    // Initialize game engine
    this.game = new GameEngine(canvasId);
    
    // Initialize player
    this.player = new Player(this.game.getCanvas());
    
    // Initialize platform manager
    this.platformManager = new PlatformManager(this.game.getCanvas());
    
    // Initialize score display
    this.scoreDisplay = new ScoreDisplay();
    
    // Initialize input handler
    this.inputHandler = new InputHandler(this.game, this.player);
    
    // Add entities to game
    this.game.addEntity(this.player);
    this.game.addEntity(this.platformManager);
    this.game.addEntity(this.scoreDisplay);
    this.game.addEntity(this.inputHandler);
    
    // Add player to game for reference
    (this.game as any).player = this.player;
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