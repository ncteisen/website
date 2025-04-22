/**
 * ScoreDisplay - UI component for displaying the current score
 */
export class ScoreDisplay {
  private color: string;
  private fontSize: string;
  private fontFamily: string;
  
  constructor(color: string = '#333', fontSize: string = '20px', fontFamily: string = 'Arial') {
    this.color = color;
    this.fontSize = fontSize;
    this.fontFamily = fontFamily;
  }
  
  /**
   * Initialize the score display
   */
  public init(game: any): void {
    // Nothing to initialize for now
  }
  
  /**
   * Update the score display
   */
  public update(deltaTime: number, game: any): void {
    // Nothing to update for now
  }
  
  /**
   * Render the score display
   */
  public render(ctx: CanvasRenderingContext2D, game: any): void {
    if (game.getGameState() !== 'playing') return;
    
    ctx.fillStyle = this.color;
    ctx.font = `${this.fontSize} ${this.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText(`Score: ${game.getScore()}`, game.getCanvas().width / 2, 30);
  }
  
  /**
   * Reset the score display
   */
  public reset(): void {
    // Nothing to reset for now
  }
} 