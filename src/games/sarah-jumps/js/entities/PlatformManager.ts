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
      
      // Create the platform (always normal type for initial platforms)
      const platform = new Platform({
        x: platformX,
        y: platformY,
        width: this.platformWidth,
        height: this.platformHeight,
        platformType: 'normal'
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
    
    const viewOffset = game.getViewOffset();
    const canvasHeight = this.canvas.height;
    
    // Update only platforms that are near the player
    this.platforms.forEach(platform => {
      const platformY = platform.getY() + viewOffset;
      if (platformY >= -platform.getHeight() && platformY <= canvasHeight + 100) {
        platform.update(deltaTime);
      }
    });
    
    // Remove platforms that are below the screen or fully dissolved
    this.platforms = this.platforms.filter(platform => {
      const platformY = platform.getY() + viewOffset;
      return platformY < canvasHeight + platform.getHeight() && !platform.isFullyDissolved();
    });
    
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
      
      // Determine platform type based on score
      const score = game.getScore();
      const rand = Math.random() * 100;
      let platformType: 'normal' | 'horizontal' | 'vertical' | 'dissolving' = 'normal';

      if (score >= 50) {
        // Score 50+: 60% normal, 20% horizontal, 10% vertical, 10% dissolving
        if (rand < 60) {
          platformType = 'normal';
        } else if (rand < 80) {
          platformType = 'horizontal';
        } else if (rand < 90) {
          platformType = 'vertical';
        } else {
          platformType = 'dissolving';
        }
      } else if (score >= 25) {
        // Score 25+: 70% normal, 20% horizontal, 10% vertical
        if (rand < 70) {
          platformType = 'normal';
        } else if (rand < 90) {
          platformType = 'horizontal';
        } else {
          platformType = 'vertical';
        }
      } else if (score >= 10) {
        // Score 10+: 85% normal, 10% horizontal, 5% vertical
        if (rand < 85) {
          platformType = 'normal';
        } else if (rand < 95) {
          platformType = 'horizontal';
        } else {
          platformType = 'vertical';
        }
      }
      // Score 0+: 100% normal (default)
      
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
      const platformY = platform.getY() + viewOffset;
      if (platformY >= -platform.getHeight() && platformY <= canvasHeight + 100) {
        if (player.checkPlatformCollision(platform)) {
          if (platform.getPlatformType() === 'dissolving') {
            platform.startDissolving();
          }
          player.handlePlatformCollision(platform);
        }
      }
    });
  }
  
  /**
   * Render the platform manager
   */
  public render(ctx: CanvasRenderingContext2D, game: any): void {
    const viewOffset = game.getViewOffset();
    const canvasHeight = this.canvas.height;
    
    // Only render platforms that are visible on screen
    this.platforms.forEach(platform => {
      const platformY = platform.getY() + viewOffset;
      if (platformY >= -platform.getHeight() && platformY <= canvasHeight) {
        // Apply camera offset for rendering
        const originalY = platform.getY();
        platform.setY(originalY + viewOffset);
        platform.render(ctx);
        // Reset platform position
        platform.setY(originalY);
      }
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