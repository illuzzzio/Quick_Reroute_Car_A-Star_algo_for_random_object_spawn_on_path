/**
 * ObstacleSystem - Manages dynamic obstacle spawning and removal
 */

export class ObstacleSystem {
  constructor(gridWorld, spawnInterval = 5000) {
    this.gridWorld = gridWorld;
    this.spawnInterval = spawnInterval; // CHANGED: 5 seconds (5000ms) between spawns
    this.lastSpawnTime = 0;
    this.obstaclesPerSpawn = 1; // Spawn 1 obstacle per cycle
    this.maxObstacles = 20; // Allow more obstacles
    this.spawnedCount = 0;
  }

  /**
   * Update obstacle system (no automatic spawning)
   * @param {number} currentTime - Current timestamp
   * @param {Object} carPos - Car position to avoid
   * @param {Object} hospitalPos - Hospital position to avoid
   * @returns {boolean} Always false (no automatic spawning)
   */
  update(currentTime, carPos, hospitalPos) {
    // Disabled automatic obstacle spawning
    return false;
  }

  /**
   * Spawn random obstacles on the grid
   * @param {Object} carPos - Car position to avoid
   * @param {Object} hospitalPos - Hospital position to avoid
   * @returns {boolean} True if obstacles were spawned
   */
  spawnObstacles(carPos, hospitalPos) {
    const { width, height } = this.gridWorld.getDimensions();
    let spawnedCount = 0;

    for (let i = 0; i < this.obstaclesPerSpawn; i++) {
      let x, y, attempts = 0;
      const maxAttempts = 50;

      // Find a valid random position
      do {
        x = Math.floor(Math.random() * width);
        y = Math.floor(Math.random() * height);
        attempts++;
      } while (
        (x === carPos.x && y === carPos.y) ||
        (x === hospitalPos.x && y === hospitalPos.y) ||
        this.gridWorld.hasObstacle(x, y) ||
        attempts < maxAttempts
      );

      if (attempts < maxAttempts) {
        this.gridWorld.addObstacle(x, y);
        spawnedCount++;
        this.spawnedCount++;
      }
    }

    return spawnedCount > 0;
  }

  /**
   * Spawn a single obstacle at specific location
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  spawnAt(x, y) {
    if (this.gridWorld.isInBounds(x, y) && !this.gridWorld.hasObstacle(x, y)) {
      this.gridWorld.addObstacle(x, y);
      this.spawnedCount++;
    }
  }

  /**
   * Clear all obstacles
   */
  clearAll() {
    this.gridWorld.clearDynamicObstacles();
  }

  /**
   * Reset system state
   */
  reset() {
    this.clearAll();
    this.lastSpawnTime = 0;
    this.spawnedCount = 0;
  }

  /**
   * Get spawn statistics
   * @returns {Object} Stats
   */
  getStats() {
    return {
      obstacleCount: this.gridWorld.getObstacles().length,
      totalSpawned: this.spawnedCount,
      maxObstacles: this.maxObstacles
    };
  }
}

export default ObstacleSystem;
