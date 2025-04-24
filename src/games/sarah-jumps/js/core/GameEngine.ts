/**
 * GameEngine - Core game engine that handles the game loop and state management
 */
import { Player } from '../entities/Player';
import { PlatformManager } from '../entities/PlatformManager';
import { InputHandler } from '../utils/InputHandler';
import { ScoreSharer } from '../utils/ScoreSharer';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private isGameOver: boolean = false;
  private lastTimestamp: number = 0;
  private gameState: 'start' | 'playing' | 'gameOver' = 'start';
  private score: number = 0;
  private highScore: number = 0;
  private viewOffset: number = 0;
  private highestY: number = 0;
  private isMobile: boolean = false;
  private scoreSharer: ScoreSharer;
  
  // Game entities
  private player: Player;
  private platformManager: PlatformManager;
  private inputHandler: InputHandler;
  
  private clouds: { x: number; y: number; radius: number; speed: number }[] = [];
  private lastHighestY: number = 0; // Track player's previous highest Y position
  
  constructor(canvasId: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      throw new Error(`Canvas with id ${canvasId} not found`);
    }
    
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get canvas context');
    this.ctx = context;

    // Initialize score sharer
    this.scoreSharer = new ScoreSharer();

    // Initialize clouds
    for (let i = 0; i < 5; i++) {
      this.clouds.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        radius: 50 + Math.random() * 100,
        speed: 0.1 + Math.random() * 0.2 // Slow movement speed
      });
    }

    // Check if user is on mobile
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Load high score from localStorage
    this.highScore = parseInt(localStorage.getItem('sarahJumpsHighScore') || '0', 10);

    // Initialize game entities
    this.player = new Player(canvas);
    this.platformManager = new PlatformManager(canvas);
    this.inputHandler = new InputHandler(this, this.player);
    
    // Initialize lastHighestY with starting position
    this.lastHighestY = this.canvas.height / 2;
  }
  
  /**
   * Initialize the game
   */
  public init(): void {
    // Initialize game entities
    this.platformManager.init();
    
    // Start the game loop
    this.isRunning = true;
    this.isPaused = false;
    this.isGameOver = false;
    this.score = 0;
    this.lastTimestamp = performance.now();
    requestAnimationFrame((t) => this.gameLoop(t));
  }
  
  /**
   * Main game loop
   */
  private gameLoop(timestamp: number = performance.now()): void {
    if (!this.isRunning) return;

    // Calculate delta time
    const deltaTime = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    // Cap delta time to prevent large jumps
    const cappedDeltaTime = Math.min(deltaTime, 1000 / 30);

    if (!this.isPaused && !this.isGameOver) {
      this.update(cappedDeltaTime);
    }

    // Only render if we're not in the start or game over state
    if (this.gameState === 'playing') {
      this.render(timestamp);
    } else {
      this.renderGameState();
    }

    requestAnimationFrame((t) => this.gameLoop(t));
  }
  
  /**
   * Update game state
   */
  private update(deltaTime: number): void {
    if (this.gameState !== 'playing') return;

    // Update input handler
    this.inputHandler.update(deltaTime, this);

    // Update player
    this.player.update(deltaTime, this);

    // Update view offset based on player position
    this.updateViewOffset(this.player.getY());

    // Update platform manager
    this.platformManager.update(deltaTime, this);

    // Update score based on view offset
    this.score = Math.floor(this.viewOffset / 100);

    // Check collisions
    this.checkCollisions();
  }
  
  /**
   * Render game
   */
  private render(timestamp: number): void {
    if (!this.ctx) return;

    // Clear the canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw sky background with gradient
    const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    skyGradient.addColorStop(0, '#87CEEB');    // Sky blue at top
    skyGradient.addColorStop(1, '#E0F7FF');    // Lighter blue at bottom
    
    this.ctx.fillStyle = skyGradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    // Draw clouds
    this.updateClouds(timestamp);

    // Render game entities
    this.platformManager.render(this.ctx, this);
    this.player.render(this.ctx, this);

    // Render score
    this.ctx.fillStyle = 'black';
    this.ctx.font = '20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`Score: ${this.score}`, this.canvas.width / 2, 30);
  }
  
  /**
   * Render game state screens
   */
  private renderGameState(): void {
    if (!this.ctx) return;

    if (this.gameState === 'start') {
      this.renderStartScreen();
    } else if (this.gameState === 'gameOver') {
      this.renderGameOver();
    }
  }
  
  /**
   * Render start screen
   */
  private renderStartScreen(): void {
    if (!this.ctx) return;
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '30px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Sarah Jumps', this.canvas.width / 2, this.canvas.height / 2 - 30);
    
    this.ctx.font = '20px Arial';
    this.ctx.fillText(this.isMobile ? 'Tap to Start' : 'Press Space to Start', this.canvas.width / 2, this.canvas.height / 2 + 10);
    
    this.ctx.font = '16px Arial';
    if (this.isMobile) {
      this.ctx.fillText('Touch left or right to move', this.canvas.width / 2, this.canvas.height / 2 + 50);
      // Add warning for mobile users
      this.ctx.fillStyle = '#ff0000';
      this.ctx.font = '14px Arial';
      this.ctx.fillText('Warning: Game runs slowly on mobile devices', this.canvas.width / 2, this.canvas.height / 2 + 80);
    } else {
      this.ctx.fillText('Use Arrow Keys or A/D to Move', this.canvas.width / 2, this.canvas.height / 2 + 50);
    }
  }
  
  /**
   * Render game over screen
   */
  private renderGameOver(): void {
    if (!this.ctx) return;
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.font = '24px Arial';
    this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
    this.ctx.fillText(`High Score: ${this.highScore}`, this.canvas.width / 2, this.canvas.height / 2 + 70);
    this.ctx.fillText(this.isMobile ? 'Tap to restart' : 'Space to restart', this.canvas.width / 2, this.canvas.height / 2 + 110);
  }
  
  /**
   * Start the game
   */
  public startGame(): void {
    this.gameState = 'playing';
    this.score = 0;
    this.viewOffset = 0;
    this.highestY = this.canvas.height / 2;
    
    // Reset entities
    this.player.reset();
    this.platformManager.reset();
  }
  
  /**
   * End the game
   */
  public endGame(): void {
    this.gameState = 'gameOver';
    // Update high score if current score is higher
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('sarahJumpsHighScore', this.highScore.toString());
    }
    // Show score sharing UI
    this.scoreSharer.show(this.score);
  }
  
  /**
   * Get the canvas context
   */
  public getContext(): CanvasRenderingContext2D | null {
    return this.ctx;
  }
  
  /**
   * Get the canvas
   */
  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
  
  /**
   * Get the current game state
   */
  public getGameState(): 'start' | 'playing' | 'gameOver' {
    return this.gameState;
  }
  
  /**
   * Get the current score
   */
  public getScore(): number {
    return this.score;
  }
  
  /**
   * Get the player entity
   */
  public getPlayer(): Player {
    return this.player;
  }
  
  /**
   * Update the view offset based on player position
   */
  private updateViewOffset(playerY: number): void {
    // If player is above the highest point reached, update the view
    if (playerY < this.highestY) {
      this.highestY = playerY;
      this.viewOffset = this.canvas.height / 2 - playerY;
    }
  }

  /**
   * Get the current view offset
   */
  public getViewOffset(): number {
    return this.viewOffset;
  }

  /**
   * Check if the game is running on a mobile device
   */
  public isMobileDevice(): boolean {
    return this.isMobile;
  }

  /**
   * Check for collisions
   */
  private checkCollisions(): void {
    const platforms = this.platformManager.getPlatforms();
    for (const platform of platforms) {
      if (this.player.checkPlatformCollision(platform)) {
        this.player.handlePlatformCollision(platform);
      }
    }
  }

  private updateClouds(timestamp: number): void {
    const isMovingUp = this.highestY < this.lastHighestY;
    this.lastHighestY = this.highestY;

    this.clouds.forEach(cloud => {
      // Move cloud horizontally
      cloud.x += cloud.speed;
      
      // Only move cloud downward if player is moving upward
      if (isMovingUp) {
        cloud.y += 1; // Move clouds down at a constant rate when player is climbing
      }
      
      // Wrap around when cloud moves off screen
      if (cloud.x > this.canvas.width + cloud.radius) {
        cloud.x = -cloud.radius;
        cloud.y = Math.random() * this.canvas.height;
      }
      
      // Reset cloud position if it moves too far down
      if (cloud.y > this.canvas.height + cloud.radius) {
        cloud.y = -cloud.radius;
        cloud.x = Math.random() * this.canvas.width;
      }
    });

    // Draw clouds
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    this.clouds.forEach(cloud => {
      this.ctx.beginPath();
      this.ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
} 