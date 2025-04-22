/**
 * Player entity for the Sarah Jumps game
 */
export class Player {
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private speed: number;
  private velocityY: number;
  private gravity: number;
  private jumpForce: number;
  private color: string;
  private initialX: number;
  private initialY: number;
  private canvas: HTMLCanvasElement;
  private airResistance: number;
  private maxFallSpeed: number;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.width = 40;
    this.height = 40;
    this.initialX = canvas.width / 2;
    this.initialY = canvas.height - 100;
    this.x = this.initialX;
    this.y = this.initialY;
    this.speed = 5;
    this.velocityY = 0;
    this.gravity = 0.2;
    this.jumpForce = -8;
    this.color = '#FF69B4';
    this.airResistance = 0.01;
    this.maxFallSpeed = 8;
  }
  
  /**
   * Initialize the player
   */
  public init(): void {
    this.reset();
  }
  
  /**
   * Update the player
   */
  public update(deltaTime: number, game: any): void {
    if (game.getGameState() !== 'playing') return;
    
    // Apply gravity with air resistance
    this.velocityY += this.gravity;
    
    // Apply air resistance when falling
    if (this.velocityY > 0) {
      this.velocityY -= this.velocityY * this.airResistance;
    }
    
    // Limit maximum falling speed
    if (this.velocityY > this.maxFallSpeed) {
      this.velocityY = this.maxFallSpeed;
    }
    
    this.y += this.velocityY;
    
    // Check if player fell off the bottom. Give a buffer of 100 pixels.
    if (this.y + game.getViewOffset() > this.canvas.height + 100) {
      game.endGame();
    }
  }
  
  /**
   * Render the player
   */
  public render(ctx: CanvasRenderingContext2D, game: any): void {
    // Apply camera offset for rendering
    const originalY = this.y;
    this.y += game.getViewOffset();
    
    // Draw the player
    ctx.fillStyle = this.color;
    ctx.fillRect(
      this.x - this.width / 2, 
      this.y - this.height / 2, 
      this.width, 
      this.height
    );
    
    // Reset position
    this.y = originalY;
  }
  
  /**
   * Reset the player
   */
  public reset(): void {
    this.x = this.initialX;
    this.y = this.initialY;
    this.velocityY = 0;
  }
  
  /**
   * Move the player left
   */
  public moveLeft(): void {
    this.x -= this.speed;
    
    // Keep player within canvas bounds
    if (this.x < this.width / 2) {
      this.x = this.width / 2;
    }
  }
  
  /**
   * Move the player right
   */
  public moveRight(): void {
    this.x += this.speed;
    
    // Keep player within canvas bounds
    if (this.x > this.canvas.width - this.width / 2) {
      this.x = this.canvas.width - this.width / 2;
    }
  }
  
  /**
   * Make the player jump
   */
  public jump(): void {
    this.velocityY = this.jumpForce;
  }
  
  /**
   * Check if the player is colliding with a platform
   */
  public checkPlatformCollision(platform: any): boolean {
    return (
      this.velocityY > 0 && 
      this.y + this.height / 2 > platform.getY() &&
      this.y - this.height / 2 < platform.getY() + platform.getHeight() &&
      this.x + this.width / 2 > platform.getX() && 
      this.x - this.width / 2 < platform.getX() + platform.getWidth()
    );
  }
  
  /**
   * Handle platform collision
   */
  public handlePlatformCollision(platform: any): void {
    this.y = platform.getY() - this.height / 2;
    this.jump();
  }
  
  /**
   * Get the player's x position
   */
  public getX(): number {
    return this.x;
  }
  
  /**
   * Get the player's y position
   */
  public getY(): number {
    return this.y;
  }
  
  /**
   * Get the player's width
   */
  public getWidth(): number {
    return this.width;
  }
  
  /**
   * Get the player's height
   */
  public getHeight(): number {
    return this.height;
  }
} 