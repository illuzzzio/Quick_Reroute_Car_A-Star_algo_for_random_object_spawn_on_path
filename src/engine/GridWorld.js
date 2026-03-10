/**
 * GridWorld - Main simulation grid world engine
 * Manages grid state, obstacles, and world data
 */

export class GridWorld {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    
    // Create grid: true = obstacle, false = walkable
    this.grid = Array(height)
      .fill(null)
      .map(() => Array(width).fill(false));

    // Obstacles set for quick lookup
    this.obstacles = new Set();
    
    // Track buildings (static obstacles) separately from dynamic obstacles
    this.buildings = new Set();
    
    // Generate urban map with buildings
    this.generateUrbanMap();
  }

  /**
   * Generate an urban map with buildings and roads
   */
  generateUrbanMap() {
    // Simplified map: only a few small buildings so multiple direct routes exist
    this.obstacles.clear();
    this.buildings.clear();

    // place some scattered 2x2 building clusters
    const clusters = 10; // a few more building clusters
    for (let n = 0; n < clusters; n++) {
      const bx = Math.floor(Math.random() * (this.width - 2));
      const by = Math.floor(Math.random() * (this.height - 2));
      // avoid placing clusters in extreme right columns (hospital area)
      if (bx >= this.width - 3) continue;
      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          const x = bx + dx;
          const y = by + dy;
          this.grid[y][x] = true;
          const key = `${x},${y}`;
          this.obstacles.add(key);
          this.buildings.add(key);
        }
      }
    }

    // add a few random single-cell obstacles but not near rightmost columns
    for (let i = 0; i < 25; i++) {
      const x = Math.floor(Math.random() * (this.width - 3));
      const y = Math.floor(Math.random() * this.height);
      if (!this.grid[y][x]) {
        this.grid[y][x] = true;
        const key = `${x},${y}`;
        this.obstacles.add(key);
        this.buildings.add(key);
      }
    }
  }

  /**
   * Clear only dynamic obstacles (spawned after initialization)
   */
  clearDynamicObstacles() {
    const toRemove = [];
    for (const key of this.obstacles) {
      if (!this.buildings.has(key)) {
        toRemove.push(key);
      }
    }
    
    for (const key of toRemove) {
      const [x, y] = key.split(',').map(Number);
      this.grid[y][x] = false;
      this.obstacles.delete(key);
    }
  }

  /**
   * Add an obstacle to the grid
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  addObstacle(x, y) {
    if (this.isInBounds(x, y)) {
      this.grid[y][x] = true;
      this.obstacles.add(`${x},${y}`);
    }
  }

  /**
   * Remove an obstacle from the grid
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  removeObstacle(x, y) {
    if (this.isInBounds(x, y)) {
      this.grid[y][x] = false;
      this.obstacles.delete(`${x},${y}`);
    }
  }

  /**
   * Check if a cell has an obstacle
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {boolean}
   */
  hasObstacle(x, y) {
    return this.isInBounds(x, y) && this.grid[y][x];
  }

  /**
   * Check if a cell is walkable (no obstacle)
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {boolean}
   */
  isWalkable(x, y) {
    return this.isInBounds(x, y) && !this.grid[y][x];
  }

  /**
   * Check if position is within grid bounds
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {boolean}
   */
  isInBounds(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  /**
   * Clear all obstacles
   */
  clearObstacles() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.grid[y][x] = false;
      }
    }
    this.obstacles.clear();
  }

  /**
   * Get all obstacles
   * @returns {Array} Array of obstacle positions
   */
  getObstacles() {
    return Array.from(this.obstacles).map(key => {
      const [x, y] = key.split(',').map(Number);
      return { x, y };
    });
  }

  /**
   * Check if a path intersects with obstacles
   * @param {Array} path - Array of positions
   * @returns {boolean} True if path is blocked
   */
  isPathBlocked(path) {
    if (!path || path.length === 0) return false;

    for (const pos of path) {
      if (this.hasObstacle(pos.x, pos.y)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get dimensions
   * @returns {Object} {width, height}
   */
  getDimensions() {
    return { width: this.width, height: this.height };
  }
}

export default GridWorld;
