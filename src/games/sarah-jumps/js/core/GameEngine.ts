/**
 * GameEngine - Core game engine that handles the game loop and state management
 */
export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private isRunning: boolean = false;
  private lastTime: number = 0;
  private gameState: 'start' | 'playing' | 'gameOver' = 'start';
  private score: number = 0;
  private highScore: number = 0;
  private viewOffset: number = 0;
  private highestY: number = 500; // Player starts at canvas.height - 100
  
  // Game entities
  private entities: any[] = [];
  
  constructor(canvasId: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      throw new Error(`Canvas with id ${canvasId} not found`);
    }
    
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    if (!this.ctx) {
      throw new Error('Could not get 2D context from canvas');
    }

    // Load high score from localStorage
    this.highScore = parseInt(localStorage.getItem('sarahJumpsHighScore') || '0', 10);
  }
  
  /**
   * Initialize the game
   */
  public init(): void {
    // Initialize game entities
    this.entities.forEach(entity => {
      if (entity.init) {
        entity.init(this);
      }
    });
    
    // Start the game loop
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }
  
  /**
   * Main game loop
   */
  private gameLoop = (currentTime: number = 0): void => {
    if (!this.isRunning) return;
    
    // Calculate delta time
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    // Clear canvas
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // Update and render based on game state
    switch (this.gameState) {
      case 'start':
        this.updateStartScreen(deltaTime);
        this.renderStartScreen();
        break;
      case 'playing':
        this.update(deltaTime);
        this.render();
        break;
      case 'gameOver':
        this.updateGameOver(deltaTime);
        this.renderGameOver();
        break;
    }
    
    // Request next frame
    requestAnimationFrame(this.gameLoop);
  };
  
  /**
   * Update game state
   */
  private update(deltaTime: number): void {
    if (this.gameState !== 'playing') return;

    const player = this.getPlayer();
    if (player) {
      this.updateViewOffset(player.getY());
    }

    // Update all entities
    this.entities.forEach(entity => {
      if (entity.update) {
        entity.update(deltaTime, this);
      }
    });
  }
  
  /**
   * Render game
   */
  private render(): void {
    // Render all entities
    this.entities.forEach(entity => {
      if (entity.render && this.ctx) {
        entity.render(this.ctx, this);
      }
    });
  }
  
  /**
   * Update start screen
   */
  private updateStartScreen(deltaTime: number): void {
    // Update start screen entities
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
    this.ctx.fillText('Press Space to Start', this.canvas.width / 2, this.canvas.height / 2 + 10);
    
    this.ctx.font = '16px Arial';
    this.ctx.fillText('Use Arrow Keys or A/D to Move', this.canvas.width / 2, this.canvas.height / 2 + 50);
  }
  
  /**
   * Update game over screen
   */
  private updateGameOver(deltaTime: number): void {
    // Update game over entities
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
    this.ctx.fillText('Space to restart', this.canvas.width / 2, this.canvas.height / 2 + 110);
  }
  
  /**
   * Start the game
   */
  public startGame(): void {
    this.gameState = 'playing';
    this.score = 0;
    this.viewOffset = 0;
    this.highestY = 500; // Reset to initial player position
    
    // Reset entities
    this.entities.forEach(entity => {
      if (entity.reset) {
        entity.reset();
      }
    });
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
  }
  
  /**
   * Add an entity to the game
   */
  public addEntity(entity: any): void {
    this.entities.push(entity);
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
   * Increment the score
   */
  public incrementScore(amount: number = 1): void {
    this.score += amount;
  }
  
  /**
   * Get the player entity
   */
  public getPlayer(): any {
    return (this as any).player;
  }
  
  /**
   * Update the view offset based on player position
   */
  private updateViewOffset(playerY: number): void {
    if (playerY < this.highestY) {
      this.highestY = playerY;
      if (playerY < this.canvas.height / 2) {
        this.viewOffset = this.canvas.height / 2 - playerY;
        // Calculate score based on view offset (1 point per 100 pixels)
        this.score = Math.floor(this.viewOffset / 100);
      }
    }
  }

  /**
   * Get the current view offset
   */
  public getViewOffset(): number {
    return this.viewOffset;
  }

  /**
   * Reset the game state
   */
  public reset(): void {
    this.gameState = 'start';
    this.score = 0;
    this.viewOffset = 0;
    this.highestY = 500;
    this.entities.forEach(entity => {
      if (entity.reset) {
        entity.reset();
      }
    });
  }
} 