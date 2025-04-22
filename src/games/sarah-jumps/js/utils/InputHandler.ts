import { GameEngine } from '../core/GameEngine';
import { Player } from '../entities/Player';

/**
 * InputHandler - Manages keyboard input for the game
 */
export class InputHandler {
  private game: GameEngine;
  private player: Player;
  private keys: { [key: string]: boolean } = {};
  
  constructor(game: GameEngine, player: Player) {
    this.game = game;
    this.player = player;
    
    // Set up event listeners
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }
  
  /**
   * Initialize the input handler
   */
  public init(game: GameEngine): void {
    // Nothing to initialize for now
  }
  
  /**
   * Update the input handler
   */
  public update(deltaTime: number, game: GameEngine): void {
    if (game.getGameState() !== 'playing') return;
    
    // Handle continuous key presses
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
      this.player.moveLeft();
    }
    
    if (this.keys['ArrowRight'] || this.keys['KeyD']) {
      this.player.moveRight();
    }
  }
  
  /**
   * Handle key down events
   */
  private handleKeyDown = (e: KeyboardEvent): void => {
    // Store the key state
    this.keys[e.code] = true;
    
    // Handle one-time key presses
    if (e.code === 'Space') {
      if (this.game.getGameState() === 'start' || this.game.getGameState() === 'gameOver') {
        this.game.startGame();
      }
    }
  };
  
  /**
   * Handle key up events
   */
  private handleKeyUp = (e: KeyboardEvent): void => {
    // Clear the key state
    this.keys[e.code] = false;
  };
  
  /**
   * Clean up event listeners
   */
  public cleanup(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }
} 