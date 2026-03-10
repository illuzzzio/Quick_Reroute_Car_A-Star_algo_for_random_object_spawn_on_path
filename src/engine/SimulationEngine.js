/**
 * SimulationEngine - Main controller for the autonomous driving simulation
 * Coordinates all systems: pathfinding, obstacle detection, car movement
 * Implements REAL A* based dynamic pathfinding like Google Maps
 */

import { aStar } from '../algorithms/astar.js';

export class SimulationEngine {
  constructor(gridWorld, carAgent, obstacleSystem) {
    this.gridWorld = gridWorld;
    this.carAgent = carAgent;
    this.obstacleSystem = obstacleSystem;

    // Random hospital position
    this.goal = this._generateRandomGoal();
    
    this.isRunning = false;
    this.lastPathComputeTime = 0;
    this.pathComputeInterval = 200; // Recompute every 200ms for responsive rerouting
    this.lastObstacleCheckTime = 0;
    
    // Rerouting state
    this.isRerouting = false;
    this.rerouteDelay = 2000; // 2 seconds delay before rerouting
    this.rerouteStartTime = 0;

    // Goal state
    this.goalReached = false;

    // Track how many path-based obstacles have been spawned
    this.obstaclesSpawnedOnPath = 0;

    // Statistics
    this.stats = {
      pathLength: 0,
      computeTime: 0,
      nodesExplored: 0,
      reroutes: 0,
      lastPathValid: true,
      totalDistance: 0
    };

    this._lastExplored = [];

    // Compute initial path
    this._computePath();
  }

  /**
   * Generate a random goal position far from start
   */
  _generateRandomGoal() {
    let x, y;
    const startPos = this.carAgent.getPosition();
    // always place in far right columns (18 or 19)
    const targetCol = Math.random() > 0.5 ? 18 : 19;
    do {
      x = targetCol;
      y = Math.floor(Math.random() * 20);
    } while (
      this.gridWorld.hasObstacle(x, y) ||
      Math.abs(x - startPos.x) + Math.abs(y - startPos.y) < 10 // at least distance away
    );
    return { x, y };
  }

  /**
   * Start the simulation
   */
  start() {
    this.isRunning = true;
    // Ensure car has a path and starts moving immediately
    if (!this.carAgent.path || this.carAgent.path.length === 0) {
      this._computePath();
    }
    this.carAgent.isMoving = true;
    this.isRerouting = false; // Reset rerouting state
  }

  /**
   * Stop the simulation
   */
  stop() {
    this.isRunning = false;
  }

  /**
   * Reset simulation to initial state with new hospital location
   */
  reset() {
    // New random goal position
    this.goal = this._generateRandomGoal();
    
    this.carAgent.reset(0, 0);
    this.obstacleSystem.reset();
    this.obstaclesSpawnedOnPath = 0;
    
    this.stats = {
      pathLength: 0,
      computeTime: 0,
      nodesExplored: 0,
      reroutes: 0,
      lastPathValid: true,
      totalDistance: 0
    };

    this.lastPathComputeTime = 0;
    this.lastObstacleCheckTime = 0;
    
    // Compute initial path to new goal
    this._computePath();
  }

  /**
   * Update simulation state - CONTINUOUS MOVEMENT WITH REROUTING
   */
  update(currentTime) {
    if (!this.isRunning) {
      return null;
    }

    // If currently rerouting (waiting), check if delay is over
    if (this.isRerouting) {
      if (currentTime - this.rerouteStartTime >= this.rerouteDelay) {
        // Time to reroute - recompute path and resume movement
        this._computePath();
        this.carAgent.isMoving = true;
        this.isRerouting = false;
        this.stats.reroutes++;
      } else {
        // Still waiting to reroute
        return { status: 'rerouting', waitTime: currentTime - this.rerouteStartTime };
      }
    }

    // Update car position
    const isMoving = this.carAgent.update();

    // Check if arrive at hospital (could update state but no message)
    const carPos = this.carAgent.getPosition();
    const dist = Math.abs(carPos.x - this.goal.x) + Math.abs(carPos.y - this.goal.y);
    if (!this.goalReached && dist < 0.5) {
      this.goalReached = true;
      this.carAgent.isMoving = false;
    }

    // Car keeps moving continuously - never stops at destination
    // Only stops temporarily for rerouting when path is blocked

    // Update obstacles (disabled - no automatic spawning)
    const obstaclesSpawned = this.obstacleSystem.update(
      currentTime,
      carPos,
      this.goal
    );

    // Check if path is still valid (every 200ms)
    if (this._shouldRecomputePath(currentTime)) {
      const pathWasValid = this.stats.lastPathValid;
      this._checkAndRecomputePath();
      
      // If path became invalid, start rerouting delay
      if (this.stats.lastPathValid === false && pathWasValid === true) {
        this.isRerouting = true;
        this.rerouteStartTime = currentTime;
        this.carAgent.isMoving = false; // Stop car during rerouting
      }
    }

    return { status: 'moving' };
  }

  /**
   * Check if path should be recomputed (every 200ms for real-time response)
   */
  _shouldRecomputePath(currentTime) {
    return currentTime - this.lastPathComputeTime >= this.pathComputeInterval;
  }

  /**
   * Check and recompute path if blocked
   */
  _checkAndRecomputePath() {
    const currentPath = this.carAgent.path;
    const carPos = this.carAgent.getPosition();

    // If no path or empty path, compute
    if (!currentPath || currentPath.length === 0) {
      this._computePath();
      return;
    }

    // Check remaining path for blockages
    const remainingPath = currentPath.slice(this.carAgent.pathIndex);

    // If path is blocked by obstacle, mark as invalid (don't recompute yet)
    if (this._isPathBlockedByObstacle(remainingPath, carPos)) {
      this.stats.lastPathValid = false;
    } else {
      this.stats.lastPathValid = true;
    }
  }

  /**
   * Check if path collides with obstacles
   */
  _isPathBlockedByObstacle(path, carPos) {
    if (!path || path.length === 0) return false;

    for (const pos of path) {
      // Skip the car's current position
      if (pos.x === Math.round(carPos.x) && pos.y === Math.round(carPos.y)) {
        continue;
      }
      
      if (this.gridWorld.hasObstacle(pos.x, pos.y)) {
        return true; // Path is blocked!
      }
    }

    return false;
  }

  /**
   * Handle user-triggered obstacle spawning (pressing O)
   * Places obstacle along the current path for the first 3 spawns,
   * then random thereafter.
   */
  spawnUserObstacle() {
    const path = this.carAgent.path || [];
    let spawnX, spawnY;

    if (this.obstaclesSpawnedOnPath < 3 && path.length > 2) {
      // choose a point along the remaining path (not start)
      const startIdx = Math.max(this.carAgent.pathIndex + 1, 0);
      const endIdx = path.length - 1;
      const idx = Math.floor(Math.random() * (endIdx - startIdx + 1)) + startIdx;
      const pos = path[idx];
      spawnX = pos.x;
      spawnY = pos.y;
      this.obstaclesSpawnedOnPath++;
    } else {
      // random spawn anywhere non-obstructed
      const { width, height } = this.gridWorld.getDimensions();
      let attempts = 0;
      do {
        spawnX = Math.floor(Math.random() * width);
        spawnY = Math.floor(Math.random() * height);
        attempts++;
      } while (this.gridWorld.hasObstacle(spawnX, spawnY) && attempts < 100);
    }

    // spawn a 2x2 obstacle block if possible to make spawning more impactful
    for (let dy = 0; dy < 2; dy++) {
      for (let dx = 0; dx < 2; dx++) {
        const sx = spawnX + dx;
        const sy = spawnY + dy;
        if (this.gridWorld.isInBounds(sx, sy) && !this.gridWorld.hasObstacle(sx, sy)) {
          // prevent obstacle near hospital (within 2 cells)
    const distToHospital = Math.abs(sx - this.goal.x) + Math.abs(sy - this.goal.y);
    if (distToHospital <= 2) continue;
    this.obstacleSystem.spawnAt(sx, sy);
        }
      }
    }
  }

  /**
   * Get current status for rendering
   */
  getStatus() {
    return {
      isRerouting: this.isRerouting,
      status: this.goalReached
        ? 'arrived'
        : this.isRerouting
        ? 'rerouting'
        : 'moving',
      arrived: this.goalReached
    };
  }

  /**
   * Compute new path using REAL A* ALGORITHM
   */
  _computePath() {
    const startTime = performance.now();
    const startPos = this.carAgent.getPosition();

    // A* heuristic function: Manhattan distance
    const isWalkable = (x, y) => this.gridWorld.isWalkable(x, y);

    // Call A* algorithm with all necessary parameters
    const { path, explored, found } = aStar(
      startPos,
      this.goal,
      isWalkable,
      this.gridWorld.width,
      this.gridWorld.height
    );

    const computeTime = performance.now() - startTime;
    this.lastPathComputeTime = performance.now();

    // Update statistics
    this.stats.pathLength = path.length;
    this.stats.computeTime = Math.round(computeTime * 100) / 100;
    this.stats.nodesExplored = explored.length;
    this.stats.lastPathValid = found;

    // Store explored nodes for visualization
    this._lastExplored = explored;

    if (found) {
      // Set new path for car to follow (don't start moving yet)
      this.carAgent.setPath(path);
      this.carAgent.incrementPathComputations();
      // Note: car.isMoving is controlled by rerouting logic, not set here
    } else {
      // No path found - mark as invalid
      this.carAgent.setPath([]);
      this.stats.lastPathValid = false;
    }

    return found;
  }

  /**
   * Get explored nodes for visualization
   */
  getExploredNodes() {
    return this._lastExplored || [];
  }

  /**
   * Get current path
   */
  getPath() {
    return this.carAgent.path;
  }

  /**
   * Get all statistics
   */
  getStats() {
    return {
      engine: this.stats,
      car: this.carAgent.getStats(),
      obstacles: this.obstacleSystem.getStats()
    };
  }

  /**
   * Get obstacle positions
   */
  getObstacles() {
    return this.gridWorld.getObstacles();
  }

  /**
   * Get car position
   */
  getCarPosition() {
    return this.carAgent.getSmoothPosition();
  }

  /**
   * Get goal position
   */
  getGoal() {
    return this.goal;
  }

  /**
   * Get grid dimensions
   */
  getGridDimensions() {
    return this.gridWorld.getDimensions();
  }

  /**
   * Set running state
   */
  setRunning(running) {
    this.isRunning = running;
  }

  /**
   * Get running state
   */
  getRunning() {
    return this.isRunning;
  }
}

export default SimulationEngine;
