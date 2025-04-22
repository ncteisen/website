/**
 * Platform interface
 */
export interface PlatformProps {
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  platformType?: 'normal' | 'horizontal' | 'vertical' | 'dissolving';
}

/**
 * Platform entity for the Sarah Jumps game
 */
export class Platform {
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private color: string;
  private platformType: 'normal' | 'horizontal' | 'vertical' | 'dissolving';
  private moveSpeed: number;
  private moveDirection: number;
  private moveRange: number;
  private startX: number;
  private startY: number;
  private isDissolving: boolean;
  private dissolveStartTime: number | null;
  private dissolveDuration: number;
  private alpha: number;
  
  constructor(props: PlatformProps) {
    this.x = props.x;
    this.y = props.y;
    this.width = props.width;
    this.height = props.height;
    this.platformType = props.platformType || 'normal';
    this.color = this.getPlatformColor();
    this.moveSpeed = this.platformType === 'normal' ? 0 : 2;
    this.moveDirection = 1;
    this.moveRange = 100;
    this.startX = props.x;
    this.startY = props.y;
    this.isDissolving = false;
    this.dissolveStartTime = null;
    this.dissolveDuration = 1000; // 1 second in milliseconds
    this.alpha = 255;
  }
  
  private getPlatformColor(): string {
    switch (this.platformType) {
      case 'horizontal':
        return '#FFA500'; // Orange
      case 'vertical':
        return '#FF0000'; // Red
      case 'dissolving':
        return '#800080'; // Purple
      default:
        return '#4CAF50'; // Green
    }
  }
  
  /**
   * Initialize the platform
   */
  public init(): void {
    // Nothing to initialize for now
  }
  
  /**
   * Update the platform
   */
  public update(deltaTime: number): void {
    if (this.platformType === 'horizontal') {
      this.x += this.moveSpeed * this.moveDirection;
      if (Math.abs(this.x - this.startX) >= this.moveRange) {
        this.moveDirection *= -1;
      }
    } else if (this.platformType === 'vertical') {
      this.y += this.moveSpeed * this.moveDirection;
      if (Math.abs(this.y - this.startY) >= this.moveRange) {
        this.moveDirection *= -1;
      }
    } else if (this.platformType === 'dissolving' && this.isDissolving && this.dissolveStartTime) {
      const elapsedTime = Date.now() - this.dissolveStartTime;
      this.alpha = Math.max(0, 255 * (1 - elapsedTime / this.dissolveDuration));
    }
  }
  
  /**
   * Start dissolving the platform
   */
  public startDissolving(): void {
    if (this.platformType === 'dissolving' && !this.isDissolving) {
      this.isDissolving = true;
      this.dissolveStartTime = Date.now();
    }
  }
  
  /**
   * Check if the platform is fully dissolved
   */
  public isFullyDissolved(): boolean {
    return this.platformType === 'dissolving' && this.isDissolving && this.alpha <= 0;
  }
  
  /**
   * Render the platform
   */
  public render(ctx: CanvasRenderingContext2D): void {
    ctx.globalAlpha = this.alpha / 255;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.globalAlpha = 1;
  }
  
  /**
   * Reset the platform
   */
  public reset(props: PlatformProps): void {
    this.x = props.x;
    this.y = props.y;
    this.width = props.width;
    this.height = props.height;
    this.platformType = props.platformType || 'normal';
    this.color = this.getPlatformColor();
    this.moveSpeed = this.platformType === 'normal' ? 0 : 2;
    this.moveDirection = 1;
    this.startX = props.x;
    this.startY = props.y;
    this.isDissolving = false;
    this.dissolveStartTime = null;
    this.alpha = 255;
  }
  
  /**
   * Get the platform's x position
   */
  public getX(): number {
    return this.x;
  }
  
  /**
   * Get the platform's y position
   */
  public getY(): number {
    return this.y;
  }
  
  /**
   * Set the platform's y position
   */
  public setY(y: number): void {
    this.y = y;
  }
  
  /**
   * Get the platform's width
   */
  public getWidth(): number {
    return this.width;
  }
  
  /**
   * Get the platform's height
   */
  public getHeight(): number {
    return this.height;
  }
  
  /**
   * Get the platform's type
   */
  public getPlatformType(): string {
    return this.platformType;
  }
} 