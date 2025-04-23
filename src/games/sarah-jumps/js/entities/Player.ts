import jumpingSprite from '../../assets/sprites/player-jumping.png';
import peakingSprite from '../../assets/sprites/player-peaking.png';
import jumpingSpriteFlipped from '../../assets/sprites/player-jumping-flipped.png';
import peakingSpriteFlipped from '../../assets/sprites/player-peaking-flipped.png';

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
  private sprites: {
    jumping: { normal: HTMLImageElement; flipped: HTMLImageElement };
    peaking: { normal: HTMLImageElement; flipped: HTMLImageElement };
  };
  private spritesLoaded: boolean = false;
  private currentSprite: 'jumping' | 'peaking' = 'jumping';
  private isFacingLeft: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.width = 30;
    this.height = 40;
    this.initialX = canvas.width / 2;
    this.initialY = canvas.height - 100;
    this.x = this.initialX;
    this.y = this.initialY;
    this.speed = 5;
    this.velocityY = 0;
    this.gravity = 0.2;
    this.jumpForce = -9;
    this.color = '#FF69B4';
    this.airResistance = 0.01;
    this.maxFallSpeed = 8;

    // Initialize sprites
    this.sprites = {
      jumping: { normal: new Image(), flipped: new Image() },
      peaking: { normal: new Image(), flipped: new Image() }
    };
    this.loadSprites();
  }

  private loadSprites(): void {
    // Load normal sprites
    this.sprites.jumping.normal.src = jumpingSprite.src;
    this.sprites.peaking.normal.src = peakingSprite.src;

    // Load flipped sprites
    this.sprites.jumping.flipped.src = jumpingSpriteFlipped.src;
    this.sprites.peaking.flipped.src = peakingSpriteFlipped.src;

    // Check when all sprites are loaded
    let loadedCount = 0;
    const totalSprites = Object.values(this.sprites).length * 2; // normal and flipped

    Object.values(this.sprites).forEach(state => {
      state.normal.onload = () => {
        loadedCount++;
        if (loadedCount === totalSprites) {
          this.spritesLoaded = true;
          console.log('All sprites loaded successfully');
        }
      };
      state.flipped.onload = () => {
        loadedCount++;
        if (loadedCount === totalSprites) {
          this.spritesLoaded = true;
          console.log('All sprites loaded successfully');
        }
      };
    });
  }

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

    // Update sprite state based on jump phase
    if (this.velocityY < 0) {
      this.currentSprite = 'jumping'; // Upward motion
    } else {
      this.currentSprite = 'peaking'; // Downward motion
    }
    
    // Check if player fell off the bottom. Give a buffer of 100 pixels.
    if (this.y + game.getViewOffset() > this.canvas.height + 100) {
      game.endGame();
    }
  }

  /**
   * Render the player
   */
  public render(ctx: CanvasRenderingContext2D, game: any): void {
    const originalY = this.y;
    this.y += game.getViewOffset();

    const spriteState = this.sprites[this.currentSprite];
    const sprite = this.isFacingLeft ? spriteState.normal : spriteState.flipped;
    
    ctx.drawImage(
      sprite,
      this.x - this.width / 2,
      this.y - this.height / 2,
      this.width,
      this.height
    );

    this.y = originalY;
  }

  public reset(): void {
    this.x = this.initialX;
    this.y = this.initialY;
    this.velocityY = 0;
  }

  public moveLeft(): void {
    this.x -= this.speed;
    this.isFacingLeft = true;
    
    // Keep player within canvas bounds
    if (this.x < this.width / 2) {
      this.x = this.width / 2;
    }
  }

  public moveRight(): void {
    this.x += this.speed;
    this.isFacingLeft = false;
    
    // Keep player within canvas bounds
    if (this.x > this.canvas.width - this.width / 2) {
      this.x = this.canvas.width - this.width / 2;
    }
  }

  public jump(): void {
    this.velocityY = this.jumpForce;
  }

  public checkPlatformCollision(platform: any): boolean {
    // Only check collision when falling
    if (this.velocityY <= 0) return false;

    // Calculate the player's feet position
    const feetY = this.y + this.height / 2;
    const platformTop = platform.getY();

    // Check if player is within the landing zone (just above the platform)
    return (
      feetY >= platformTop && 
      feetY <= platformTop + 15 && // Landing zone height
      this.x + this.width / 2 >= platform.getX() && 
      this.x - this.width / 2 <= platform.getX() + platform.getWidth()
    );
  }

  public handlePlatformCollision(platform: any): void {
    // Position player exactly on the platform
    this.y = platform.getY() - this.height / 2;
    this.velocityY = 0;
    this.jump();
  }

  public getX(): number {
    return this.x;
  }

  public getY(): number {
    return this.y;
  }

  public getWidth(): number {
    return this.width;
  }

  public getHeight(): number {
    return this.height;
  }
} 