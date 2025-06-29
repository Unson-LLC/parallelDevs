class InputHandler {
  constructor() {
    this._keys = {
      left: false,
      right: false,
      space: false,
      reset: false
    };
    this._spacePressed = false;
    this._resetPressed = false;
  }

  init() {
    document.addEventListener('keydown', this._handleKeyDown.bind(this));
    document.addEventListener('keyup', this._handleKeyUp.bind(this));
  }

  _handleKeyDown(event) {
    switch (event.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this._keys.left = true;
        event.preventDefault();
        break;
      case 'ArrowRight':
      case 'KeyD':
        this._keys.right = true;
        event.preventDefault();
        break;
      case 'Space':
        if (!this._keys.space) {
          this._spacePressed = true;
        }
        this._keys.space = true;
        event.preventDefault();
        break;
      case 'KeyR':
        if (!this._keys.reset) {
          this._resetPressed = true;
        }
        this._keys.reset = true;
        event.preventDefault();
        break;
    }
  }

  _handleKeyUp(event) {
    switch (event.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this._keys.left = false;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this._keys.right = false;
        break;
      case 'Space':
        this._keys.space = false;
        break;
      case 'KeyR':
        this._keys.reset = false;
        break;
    }
  }

  isLeftPressed() {
    return this._keys.left;
  }

  isRightPressed() {
    return this._keys.right;
  }

  isSpacePressed() {
    const pressed = this._spacePressed;
    this._spacePressed = false;
    return pressed;
  }

  isResetPressed() {
    const pressed = this._resetPressed;
    this._resetPressed = false;
    return pressed;
  }

  reset() {
    this._keys = {
      left: false,
      right: false,
      space: false,
      reset: false
    };
    this._spacePressed = false;
    this._resetPressed = false;
  }
}

export { InputHandler };