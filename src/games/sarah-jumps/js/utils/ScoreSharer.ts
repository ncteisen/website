export class ScoreSharer {
  private container!: HTMLDivElement;
  private nameInput!: HTMLInputElement;
  private shareButton!: HTMLButtonElement;
  private toast!: HTMLDivElement;
  private playerName: string;
  private currentScore: number = 0;
  private overlay!: HTMLDivElement;

  constructor() {
    this.playerName = localStorage.getItem('sarahJumpsPlayerName') || '';
    this.createUI();
  }

  private createUI(): void {
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      z-index: 1000;
      display: none;
    `;

    // Create container
    this.container = document.createElement('div');
    this.container.className = 'score-sharer';
    this.container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #2c3e50;
      padding: 30px;
      border-radius: 15px;
      color: white;
      text-align: center;
      z-index: 1001;
      display: none;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      min-width: 300px;
    `;

    // Create title
    const title = document.createElement('h2');
    title.textContent = 'Share Your Score';
    title.style.cssText = `
      margin: 0 0 20px 0;
      font-size: 24px;
      color: #ecf0f1;
    `;

    // Create name input container
    const inputContainer = document.createElement('div');
    inputContainer.style.cssText = `
      margin-bottom: 20px;
    `;

    // Create name input label
    const label = document.createElement('label');
    label.textContent = 'Enter your initials:';
    label.style.cssText = `
      display: block;
      margin-bottom: 10px;
      font-size: 16px;
      color: #bdc3c7;
    `;

    // Create name input
    this.nameInput = document.createElement('input');
    this.nameInput.type = 'text';
    this.nameInput.maxLength = 3;
    this.nameInput.placeholder = 'ABC';
    this.nameInput.value = this.playerName;
    this.nameInput.style.cssText = `
      width: 100px;
      padding: 10px;
      margin: 0 auto;
      text-transform: uppercase;
      text-align: center;
      font-size: 24px;
      border: 2px solid #3498db;
      border-radius: 8px;
      background: #34495e;
      color: white;
      outline: none;
      transition: border-color 0.3s;
    `;

    this.nameInput.addEventListener('focus', () => {
      this.nameInput.style.borderColor = '#2980b9';
    });

    this.nameInput.addEventListener('blur', () => {
      this.nameInput.style.borderColor = '#3498db';
    });

    // Create share button
    this.shareButton = document.createElement('button');
    this.shareButton.textContent = 'Share Score';
    this.shareButton.style.cssText = `
      background: #3498db;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
      font-weight: bold;
      transition: background-color 0.3s;
      width: 100%;
    `;

    this.shareButton.addEventListener('mouseover', () => {
      this.shareButton.style.backgroundColor = '#2980b9';
    });

    this.shareButton.addEventListener('mouseout', () => {
      this.shareButton.style.backgroundColor = '#3498db';
    });

    // Create toast
    this.toast = document.createElement('div');
    this.toast.className = 'toast';
    this.toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #2c3e50;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      display: none;
      z-index: 1002;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    `;

    // Assemble the UI
    inputContainer.appendChild(label);
    inputContainer.appendChild(this.nameInput);
    this.container.appendChild(title);
    this.container.appendChild(inputContainer);
    this.container.appendChild(this.shareButton);
    document.body.appendChild(this.overlay);
    document.body.appendChild(this.container);
    document.body.appendChild(this.toast);

    // Add event listeners
    this.nameInput.addEventListener('input', () => {
      this.nameInput.value = this.nameInput.value.toUpperCase();
    });

    this.shareButton.addEventListener('click', () => this.handleShare());
  }

  public show(score: number): void {
    this.currentScore = score;
    this.overlay.style.display = 'block';
    this.container.style.display = 'block';
  }

  public hide(): void {
    this.overlay.style.display = 'none';
    this.container.style.display = 'none';
  }

  private handleShare(): void {
    const name = this.nameInput.value.toUpperCase();
    if (name.length !== 3) {
      this.showToast('Please enter 3 letters');
      return;
    }

    // Save name to localStorage
    localStorage.setItem('sarahJumpsPlayerName', name);
    this.playerName = name;

    // Create share text with link
    const shareText = `${name} scored ${this.currentScore} points in Sarah Jumps 💁🏼‍♀️🦘! Can you beat their score?\n\nPlay at: https://www.noaheisen.com/projects/sarah-jumps/`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareText)
      .then(() => {
        this.showToast('Score copied to clipboard!');
        this.hide();
      })
      .catch(() => {
        this.showToast('Failed to copy score');
      });
  }

  private showToast(message: string): void {
    this.toast.textContent = message;
    this.toast.style.display = 'block';
    setTimeout(() => {
      this.toast.style.display = 'none';
    }, 3000);
  }
} 