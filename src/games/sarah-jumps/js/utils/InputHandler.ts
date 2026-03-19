import { GameEngine } from '../core/GameEngine';
import { Player } from '../entities/Player';

/**
 * InputHandler - Manages keyboard and touch input for the game
 */
export class InputHandler {
  private game: GameEngine;
  private player: Player;
  private keys: { [key: string]: boolean } = {};
  private isTouching: boolean = false;
  private touchX: number = 0;
  private isMobile: boolean = false;
  private canvasRect: DOMRect;

  constructor(game: GameEngine, player: Player) {
    this.game = game;
    this.player = player;

    // Check if user is on mobile
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Cache canvas rect; refresh on resize to avoid querying layout on every touch
    this.canvasRect = this.game.getCanvas().getBoundingClientRect();
    window.addEventListener('resize', () => {
      this.canvasRect = this.game.getCanvas().getBoundingClientRect();
    });

    // Set up event listeners
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    // Add touch event listeners if on mobile
    if (this.isMobile) {
      const canvas = this.game.getCanvas();
      canvas.addEventListener('touchstart', this.handleTouchStart);
      canvas.addEventListener('touchmove', this.handleTouchMove);
      canvas.addEventListener('touchend', this.handleTouchEnd);
    }
  }
  
  /**
   * Update the input handler
   */
  public update(deltaTime: number, game: GameEngine): void {
    if (game.getGameState() !== 'playing') return;

    const dt = deltaTime / 16.67;

    // Handle continuous key presses
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
      this.player.moveLeft(dt);
    }

    if (this.keys['ArrowRight'] || this.keys['KeyD']) {
      this.player.moveRight(dt);
    }

    // Handle touch movement
    if (this.isTouching) {
      this.updateTouchMovement(dt);
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
   * Handle touch start event
   */
  private handleTouchStart = (e: TouchEvent): void => {
    e.preventDefault();
    
    // Start/restart game if not playing
    if (this.game.getGameState() === 'start' || this.game.getGameState() === 'gameOver') {
      this.game.startGame();
      return;
    }
    
    // Otherwise handle movement
    this.isTouching = true;
    this.updateTouchPosition(e);
  };

  /**
   * Handle touch move event
   */
  private handleTouchMove = (e: TouchEvent): void => {
    e.preventDefault();
    this.updateTouchPosition(e);
  };

  /**
   * Handle touch end event
   */
  private handleTouchEnd = (e: TouchEvent): void => {
    e.preventDefault();
    this.isTouching = false;
  };

  /**
   * Update touch position
   */
  private updateTouchPosition(e: TouchEvent): void {
    const touch = e.touches[0];
    this.touchX = touch.clientX - this.canvasRect.left;
  }

  /**
   * Update player movement based on touch position
   */
  private updateTouchMovement(dt: number): void {
    const playerX = this.player.getX();
    const touchDiff = this.touchX - playerX;

    if (Math.abs(touchDiff) > 20) { // Dead zone to prevent jitter
      if (touchDiff > 0) {
        this.player.moveRight(dt);
      } else {
        this.player.moveLeft(dt);
      }
    }
  }
  
  /**
   * Clean up event listeners
   */
  public cleanup(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);

    if (this.isMobile) {
      const canvas = this.game.getCanvas();
      canvas.removeEventListener('touchstart', this.handleTouchStart);
      canvas.removeEventListener('touchmove', this.handleTouchMove);
      canvas.removeEventListener('touchend', this.handleTouchEnd);
    }
  }
} 