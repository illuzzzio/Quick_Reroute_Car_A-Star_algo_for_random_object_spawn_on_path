/**
 * A* Pathfinding Algorithm
 * Finds the optimal path from start to goal using heuristic-based search
 * f(n) = g(n) + h(n)
 * g(n) = distance from start
 * h(n) = Manhattan distance heuristic to goal
 */

class PriorityQueue {
  constructor() {
    this.elements = [];
  }

  enqueue(element, priority) {
    const queueElement = { element, priority };
    let added = false;

    for (let i = 0; i < this.elements.length; i++) {
      if (queueElement.priority < this.elements[i].priority) {
        this.elements.splice(i, 0, queueElement);
        added = true;
        break;
      }
    }

    if (!added) {
      this.elements.push(queueElement);
    }
  }

  dequeue() {
    return this.elements.shift();
  }

  isEmpty() {
    return this.elements.length === 0;
  }
}

/**
 * Calculate Manhattan distance heuristic
 * @param {Object} pos - Current position {x, y}
 * @param {Object} goal - Goal position {x, y}
 * @returns {number} Manhattan distance
 */
function heuristic(pos, goal) {
  return Math.abs(pos.x - goal.x) + Math.abs(pos.y - goal.y);
}

/**
 * Get neighboring cells (4-directional movement)
 * @param {Object} pos - Current position
 * @param {number} gridWidth - Grid width
 * @param {number} gridHeight - Grid height
 * @returns {Array} Array of neighbor positions
 */
function getNeighbors(pos, gridWidth, gridHeight) {
  const neighbors = [];
  const directions = [
    { x: 0, y: 1 },   // down
    { x: 0, y: -1 },  // up
    { x: 1, y: 0 },   // right
    { x: -1, y: 0 }   // left
  ];

  for (const dir of directions) {
    const newX = pos.x + dir.x;
    const newY = pos.y + dir.y;

    if (newX >= 0 && newX < gridWidth && newY >= 0 && newY < gridHeight) {
      neighbors.push({ x: newX, y: newY });
    }
  }

  return neighbors;
}

/**
 * Position to string for set/map operations
 * @param {Object} pos - Position {x, y}
 * @returns {string} String key
 */
function posToKey(pos) {
  return `${pos.x},${pos.y}`;
}

/**
 * A* pathfinding algorithm
 * @param {Object} start - Start position {x, y}
 * @param {Object} goal - Goal position {x, y}
 * @param {Function} isWalkable - Function to check if a cell is walkable
 * @param {number} gridWidth - Grid width
 * @param {number} gridHeight - Grid height
 * @returns {Object} {path, explored, found}
 */
export function aStar(start, goal, isWalkable, gridWidth, gridHeight) {
  const openSet = new PriorityQueue();
  const closedSet = new Set();
  const explored = [];
  
  const gScore = new Map();
  const cameFrom = new Map();

  const startKey = posToKey(start);
  const goalKey = posToKey(goal);

  gScore.set(startKey, 0);
  openSet.enqueue(start, heuristic(start, goal));

  let iterations = 0;
  const maxIterations = gridWidth * gridHeight * 2;

  while (!openSet.isEmpty() && iterations < maxIterations) {
    iterations++;

    const current = openSet.dequeue().element;
    const currentKey = posToKey(current);

    explored.push({ ...current });

    if (currentKey === goalKey) {
      // Reconstruct path
      const path = [];
      let temp = goalKey;

      while (temp !== startKey) {
        const [x, y] = temp.split(',').map(Number);
        path.unshift({ x, y });
        temp = cameFrom.get(temp) || startKey;
      }

      path.unshift(start);
      // Remove the start position if it's the same as current position
      // to avoid immediate "reaching" the first point
      if (path.length > 1 && path[0].x === start.x && path[0].y === start.y) {
        path.shift();
      }
      return { path, explored, found: true };
    }

    closedSet.add(currentKey);

    const neighbors = getNeighbors(current, gridWidth, gridHeight);

    for (const neighbor of neighbors) {
      const neighborKey = posToKey(neighbor);

      if (closedSet.has(neighborKey) || !isWalkable(neighbor.x, neighbor.y)) {
        continue;
      }

      const tentativeGScore =
        (gScore.get(currentKey) || 0) + 1;

      if (
        !gScore.has(neighborKey) ||
        tentativeGScore < gScore.get(neighborKey)
      ) {
        cameFrom.set(neighborKey, currentKey);
        gScore.set(neighborKey, tentativeGScore);
        const fScore = tentativeGScore + heuristic(neighbor, goal);
        openSet.enqueue(neighbor, fScore);
      }
    }
  }

  // No path found
  return { path: [], explored, found: false };
}

export default { aStar };
