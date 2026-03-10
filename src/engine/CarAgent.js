/**
 * CarAgent - Represents the autonomous vehicle
 * Handles movement, path following, and decision-making
 */

export class CarAgent {
  constructor(x, y, speed = 0.15) {
    this.x = x;
    this.y = y;
    
    // Current grid position
    this.gridX = Math.floor(x);
    this.gridY = Math.floor(y);
    
    this.speed = speed; // Movement speed per frame (0.05 cells per frame = ~3 cells/sec at 60fps)
    this.path = []; // Current path to follow
    this.pathIndex = 0; // Current position in path
    this.target = null; // Target position
    
    // Statistics
    this.distanceTraveled = 0;
    this.pathsComputed = 0;
    this.isMoving = false;
  }

  /**
   * Set the path for the car to follow
   * @param {Array} path - Array of grid positions [{x, y}, ...]
   */
  setPath(path) {
    this.path = path || [];
    this.pathIndex = 0;
    // Don't automatically set isMoving - controlled by simulation engine
  }

  /**
   * Update car position (smooth movement along path)
   * @returns {boolean} True if still moving
   */
  update() {
    // Only move if we have a valid path
    if (!this.path || this.path.length === 0) {
      // no route: drift toward a main road (row 0 or 10) so we don't stay stuck
      const targetRow = Math.abs(this.y - 0) < Math.abs(this.y - 10) ? 0 : 10;
      const dy = targetRow - this.y;
      if (Math.abs(dy) > 0.01) {
        this.y += Math.sign(dy) * this.speed;
        this.distanceTraveled += this.speed;
        this.gridX = Math.floor(this.x);
        this.gridY = Math.floor(this.y);
        return true;
      }
      return false;
    }

    if (!this.isMoving) {
      return false;
    }

    if (this.pathIndex >= this.path.length) {
      this.isMoving = false;
      return false;
    }

    const targetCell = this.path[this.pathIndex];
    const dx = targetCell.x - this.x;
    const dy = targetCell.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If very close to target, snap to it and move to next
    if (distance < 0.05) {
      this.x = targetCell.x;
      this.y = targetCell.y;
      this.gridX = Math.floor(this.x);
      this.gridY = Math.floor(this.y);
      this.pathIndex++;

      // If we reached the final destination, stop
      if (this.pathIndex >= this.path.length) {
        this.isMoving = false;
        return false;
      }

      return true;
    }

    // Smooth movement towards target
    const moveX = (dx / distance) * Math.min(this.speed, distance);
    const moveY = (dy / distance) * Math.min(this.speed, distance);

    this.x += moveX;
    this.y += moveY;
    this.distanceTraveled += Math.sqrt(moveX * moveX + moveY * moveY);

    return true;
  }

  /**
   * Get current grid position
   * @returns {Object} {x, y}
   */
  getPosition() {
    return { x: Math.round(this.x), y: Math.round(this.y) };
  }

  /**
   * Get smooth float position for rendering
   * @returns {Object} {x, y}
   */
  getSmoothPosition() {
    return { x: this.x, y: this.y };
  }

  /**
   * Check if car has reached destination
   * @param {Object} destination - {x, y}
   * @returns {boolean}
   */
  hasReachedDestination(destination) {
    const dist = Math.abs(this.x - destination.x) + Math.abs(this.y - destination.y);
    return dist < 0.2;
  }

  /**
   * Reset car to starting position
   * @param {number} x - Start X
   * @param {number} y - Start Y
   */
  reset(x, y) {
    this.x = x;
    this.y = y;
    this.gridX = Math.floor(x);
    this.gridY = Math.floor(y);
    this.path = [];
    this.pathIndex = 0;
    this.isMoving = false;
    this.distanceTraveled = 0;
    this.pathsComputed = 0;
  }

  /**
   * Increment path computation counter
   */
  incrementPathComputations() {
    this.pathsComputed++;
  }

  /**
   * Get car statistics
   * @returns {Object} Stats object
   */
  getStats() {
    return {
      position: this.getPosition(),
      distanceTraveled: Math.floor(this.distanceTraveled * 10) / 10,
      pathsComputed: this.pathsComputed,
      isMoving: this.isMoving
    };
  }
}

export default CarAgent;
