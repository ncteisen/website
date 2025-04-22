import { Platform } from './Platform';
import type { PlatformProps } from './Platform';
import { Player } from './Player';

/**
 * PlatformManager - Manages multiple platforms and their interactions with the player
 */
export class PlatformManager {
  private platforms: Platform[] = [];
  private platformWidth: number;
  private platformHeight: number;
  private canvas: HTMLCanvasElement;
  private maxJumpHeight: number;
  private minPlatformSpacing: number;
  private maxHorizontalDistance: number;
  private minPlatforms: number;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.platformWidth = 100;
    this.platformHeight = 20;
    this.maxJumpHeight = 200;
    this.minPlatformSpacing = 30;
    this.maxHorizontalDistance = 100;
    this.minPlatforms = 20;
  }
  
  /**
   * Initialize the platform manager
   */
  public init(): void {
    this.generateInitialPlatforms();
  }
  
  /**
   * Generate initial platforms
   */
  private generateInitialPlatforms(): void {
    this.platforms = [];
    
    // Create the starting platform at the bottom
    const startPlatform = new Platform({
      x: this.canvas.width / 2 - this.platformWidth / 2,
      y: this.canvas.height - 50,
      width: this.platformWidth,
      height: this.platformHeight,
      platformType: 'normal'
    });
    this.platforms.push(startPlatform);
    
    // Generate additional platforms above with proper spacing
    let currentY = startPlatform.getY();
    let currentX = startPlatform.getX();
    
    for (let i = 0; i < this.minPlatforms - 1; i++) {
      // Calculate the next platform's y position
      const minY = Math.floor(currentY - this.maxJumpHeight);
      const maxY = Math.floor(currentY - this.minPlatformSpacing);
      const platformY = Math.floor(Math.random() * (maxY - minY + 1)) + minY;
      
      // Calculate the next platform's x position
      const minX = Math.max(0, Math.floor(currentX - this.maxHorizontalDistance));
      const maxX = Math.min(this.canvas.width - this.platformWidth, Math.floor(currentX + this.maxHorizontalDistance));
      const platformX = Math.floor(Math.random() * (maxX - minX + 1)) + minX;
      
      // Determine platform type
      const rand = Math.random();
      let platformType: 'normal' | 'horizontal' | 'vertical' | 'dissolving' = 'normal';
      if (rand < 0.2) {
        platformType = 'horizontal';
      } else if (rand < 0.3) {
        platformType = 'vertical';
      } else if (rand < 0.4) {
        platformType = 'dissolving';
      }
      
      // Create the platform
      const platform = new Platform({
        x: platformX,
        y: platformY,
        width: this.platformWidth,
        height: this.platformHeight,
        platformType
      });
      
      this.platforms.push(platform);
      currentY = platformY;
      currentX = platformX;
    }
  }
  
  /**
   * Update the platform manager
   */
  public update(deltaTime: number, game: any): void {
    if (game.getGameState() !== 'playing') return;
    
    const player = game.getPlayer() as Player;
    if (!player) return;
    
    // Update all platforms
    this.platforms.forEach(platform => {
      platform.update(deltaTime);
    });
    
    // Remove platforms that are below the screen or fully dissolved
    this.platforms = this.platforms.filter(platform => 
      platform.getY() < player.getY() + this.canvas.height && !platform.isFullyDissolved()
    );
    
    // Add new platforms at the top
    while (this.platforms.length < this.minPlatforms) {
      // Find the highest platform
      const highestPlatform = this.platforms.reduce((highest, current) => 
        current.getY() < highest.getY() ? current : highest
      );
      
      // Calculate the next platform's y position
      const minY = Math.floor(highestPlatform.getY() - this.maxJumpHeight);
      const maxY = Math.floor(highestPlatform.getY() - this.minPlatformSpacing);
      const newY = Math.floor(Math.random() * (maxY - minY + 1)) + minY;
      
      // Calculate the next platform's x position
      const minX = Math.max(0, Math.floor(highestPlatform.getX() - this.maxHorizontalDistance));
      const maxX = Math.min(this.canvas.width - this.platformWidth, Math.floor(highestPlatform.getX() + this.maxHorizontalDistance));
      const newX = Math.floor(Math.random() * (maxX - minX + 1)) + minX;
      
      // Determine platform type
      const rand = Math.random();
      let platformType: 'normal' | 'horizontal' | 'vertical' | 'dissolving' = 'normal';
      if (rand < 0.2) {
        platformType = 'horizontal';
      } else if (rand < 0.3) {
        platformType = 'vertical';
      } else if (rand < 0.4) {
        platformType = 'dissolving';
      }
      
      // Create new platform
      const newPlatform = new Platform({
        x: newX,
        y: newY,
        width: this.platformWidth,
        height: this.platformHeight,
        platformType
      });
      
      this.platforms.push(newPlatform);
    }
    
    // Check for collisions with the player
    this.platforms.forEach(platform => {
      if (player.checkPlatformCollision(platform)) {
        if (platform.getPlatformType() === 'dissolving') {
          platform.startDissolving();
        }
        player.handlePlatformCollision(platform);
        game.incrementScore();
      }
    });
  }
  
  /**
   * Render the platform manager
   */
  public render(ctx: CanvasRenderingContext2D, game: any): void {
    this.platforms.forEach(platform => {
      // Apply camera offset for rendering
      const originalY = platform.getY();
      platform.setY(originalY + game.getViewOffset());
      platform.render(ctx);
      // Reset platform position
      platform.setY(originalY);
    });
  }
  
  /**
   * Reset the platform manager
   */
  public reset(): void {
    this.generateInitialPlatforms();
  }
  
  /**
   * Get all platforms
   */
  public getPlatforms(): Platform[] {
    return this.platforms;
  }
} 