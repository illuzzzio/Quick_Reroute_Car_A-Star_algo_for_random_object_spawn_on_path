# Autonomous Vehicle Simulation - Architecture Guide

## Overview

This document provides an in-depth guide to the autonomous vehicle simulation architecture, explaining how each component works and how they integrate together.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React App (App.jsx)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           SimulationEngine (Core Controller)          │   │
│  │  • Coordinates all simulation systems                │   │
│  │  • Manages pathfinding operations                    │   │
│  │  • Handles obstacle detection & rerouting           │   │
│  └──────────────────────────────────────────────────────┘   │
│      │                          │                      │      │
│      ↓                          ↓                      ↓      │
│  ┌────────────┐  ┌────────────────┐  ┌──────────────────┐   │
│  │ GridWorld  │  │  CarAgent      │  │ ObstacleSystem   │   │
│  │            │  │                │  │                  │   │
│  │ • Grid     │  │ • Position     │  │ • Spawn logic    │   │
│  │   state    │  │ • Movement     │  │ • Obstacle pool  │   │
│  │ • Obstacle │  │ • Path follow  │  │ • Timing         │   │
│  │   map      │  │ • Statistics   │  │                  │   │
│  └────────────┘  └────────────────┘  └──────────────────┘   │
│      │                                                        │
│      └─────────────────────────────────────────────────────┘ │
│                     │                                        │
│  ┌──────────────────┴──────────────────┐                    │
│  │    A* Pathfinding Algorithm          │                    │
│  │  • Heuristic search                  │                    │
│  │  • Priority queue                    │                    │
│  │  • Manhattan distance h(n)           │                    │
│  └──────────────────────────────────────┘                    │
│         │                        │                          │
│  ┌──────┴──────┐         ┌──────┴──────┐                    │
│  │ Open Set    │         │ Closed Set   │                    │
│  │ Priority Q  │         │ Explored     │                    │
│  └─────────────┘         └──────────────┘                    │
└─────────────────────────────────────────────────────────────┘
           │                         │
    ┌──────┴──────┐         ┌────────┴────────┐
    ↓             ↓         ↓                 ↓
  UI Layer    Canvas      Control      Statistics
  (React)     Renderer    Panel        Display
```

## Core Components

### 1. SimulationEngine.js

**Purpose:** Central controller that orchestrates all simulation systems.

**Responsibilities:**
- Manages the main update loop
- Coordinates pathfinding operations
- Handles obstacle collision detection
- Triggers rerouting when paths are blocked
- Collects and aggregates statistics

**Key Methods:**
```javascript
start()                  // Begin simulation
stop()                   // Pause simulation
reset()                  // Reset to initial state
update(currentTime)      // Update world state
_computePath()           // Run A* algorithm
_checkAndRecomputePath() // Detect and handle blockages
getStats()               // Aggregate all statistics
```

**Update Cycle:**
```
update() {
  1. Move car forward
  2. Check if reached destination
  3. Update obstacles (spawn if due)
  4. Check if path is blocked
  5. If blocked and time elapsed → recompute path
  return result
}
```

### 2. GridWorld.js

**Purpose:** Manages the 2D grid world state and obstacle tracking.

**Responsibilities:**
- Maintains 30×30 grid representation
- Tracks obstacle positions
- Provides obstacle queries
- Validates cell walkability
- Detects path blockages

**Key Methods:**
```javascript
addObstacle(x, y)          // Place obstacle at cell
removeObstacle(x, y)       // Remove obstacle
hasObstacle(x, y)          // Check for obstacle
isWalkable(x, y)           // Check if cell is passable
isPathBlocked(path)        // Validate entire path
clearObstacles()           // Remove all obstacles
```

**Data Structure:**
```javascript
grid[30][30]           // 2D boolean array
obstacles Set<string>  // Fast O(1) lookup: "x,y"
```

### 3. CarAgent.js

**Purpose:** Represents the autonomous vehicle with movement and pathfinding capabilities.

**Responsibilities:**
- Maintains car position and state
- Follows computed paths
- Provides smooth animation interpolation
- Tracks movement statistics
- Reports agent state

**Key Methods:**
```javascript
setPath(path)              // Set new path to follow
update()                   // Move one frame along path
hasReachedDestination()    // Check if at goal
getPosition()              // Get integer grid position
getSmoothPosition()        // Get interpolated float position
getStats()                 // Get agent statistics
```

**Movement Model:**
```javascript
// Per frame (60fps = ~16ms per frame):
1. Calculate vector to next path cell
2. Move toward it by speed amount (0.1 cells/frame)
3. When reached cell, advance to next cell in path
4. Continue until path completed
```

**Position Tracking:**
```javascript
x, y                    // Continuous float position (0.0 to 30.0)
gridX, gridY            // Integer grid coordinates
pathIndex               // Current position in path array
```

### 4. ObstacleSystem.js

**Purpose:** Manages dynamic obstacle spawning and survival.

**Responsibilities:**
- Spawns obstacles on schedule (every 3 seconds)
- Respects obstacle limits (max 15)
- Avoids spawning on car or hospital
- Provides manual spawn capability
- Reports obstacle statistics

**Key Methods:**
```javascript
update(currentTime, carPos, hospitalPos)  // Check and spawn
spawnObstacles(carPos, hospitalPos)       // Spawn batch
spawnAt(x, y)                             // Manual spawn
clearAll()                                // Remove all
reset()                                   // Reset state
getStats()                                // Get statistics
```

**Spawn Logic:**
```javascript
if (now - lastSpawnTime >= 3000ms) {
  // Time to spawn
  for (each obstacle to spawn) {
    // Find random valid position
    repeat {
      x = random(0, 30)
      y = random(0, 30)
    } while (
      occupied by car ||
      occupied by hospital ||
      already has obstacle
    )
    
    if (valid position found) {
      addObstacle(x, y)
    }
  }
}
```

### 5. A* Pathfinding Algorithm (astar.js)

**Purpose:** Implements the A* pathfinding algorithm for optimal route planning.

**Algorithm Steps:**

1. **Initialize:**
   - Open set = {start}
   - Closed set = {}
   - g(start) = 0
   - f(start) = h(start)

2. **Main Loop:**
   ```
   while (open set not empty) {
     current = node with lowest f(n)
     if (current == goal) return path
     
     move current to closed set
     
     for each neighbor of current {
       if neighbor in closed set: skip
       tentative_g = g(current) + 1
       
       if neighbor not in open set {
         add to open set
       } else if (tentative_g >= g(neighbor)) {
         continue (not better path)
       }
       
       update g(neighbor) = tentative_g
       update f(neighbor) = g(neighbor) + h(neighbor)
       update parent(neighbor) = current
     }
   }
   ```

3. **Path Reconstruction:**
   ```
   current = goal
   path = [goal]
   while (parent(current) exists) {
     current = parent(current)
     path.prepend(current)
   }
   ```

**Cost Functions:**
```javascript
g(n) = distance from start     // Actual path cost
h(n) = Manhattan distance      // |x1-x2| + |y1-y2|
f(n) = g(n) + h(n)            // Total estimated cost
```

**Why Manhattan Distance?**
- Admissible for grid movement (never overestimates)
- Efficient heuristic (fast to compute)
- Works well for 4-directional movement
- More informed than Euclidean on grids

**Complexity:**
- Time: O(n log n) where n = grid area
- Space: O(n) for open/closed sets
- Practical: ~1-5ms for 30×30 grid

## Render Pipeline

### SimulationCanvas Component

**Rendering Steps:**
```javascript
function render() {
  // 1. Clear canvas
  fillRect(0, 0, canvasWidth, canvasHeight)
  
  // 2. Draw grid background
  drawGrid()
  
  // 3. Draw pathfinding visualization
  if (showExplored) drawExploredNodes()
  
  // 4. Draw computed path
  if (showPath) drawPath()
  
  // 5. Draw obstacles
  drawObstacles()
  
  // 6. Draw destination (hospital)
  drawHospital()
  
  // 7. Draw car
  drawCar()
}
```

**Canvas Coordinates:**
```
Grid Cell (x, y) → Canvas Pixel (x*25, y*25)
Cell size = 25 pixels
Total canvas = 750×750 pixels (30×25)
```

**Animation Loop:**
```javascript
function animate() {
  currentTime = now()
  
  // Update simulation
  engine.update(currentTime)
  
  // Render current state
  render()
  
  // Next frame
  if (engine.running) {
    requestAnimationFrame(animate)
  }
}
```

## State Flow Diagram

```
START
  ↓
[Engine Initialize]
  ├→ GridWorld (empty 30×30)
  ├→ CarAgent (position 0,0)
  ├→ ObstacleSystem (no obstacles)
  └→ A* finds initial path → set car path
  ↓
[User clicks Start]
  ↓
[Animation Loop]
  ├→ engine.update()
  │  ├→ car.update() → move along path
  │  ├→ obstacle.update()
  │  │  ├→ check spawn time
  │  │  └→ if due: spawn random obstacles
  │  └→ check if path blocked
  │     └→ if blocked: trigger A* recompute
  │
  ├→ canvas.render()
  │  ├→ draw grid
  │  ├→ draw path (optional)
  │  ├→ draw obstacles
  │  ├→ draw hospital
  │  └→ draw car
  │
  └→ update statistics display
     ├→ position, distance
     ├→ paths computed, reroutes
     └→ obstacles, compute time
  ↓
[Car reaches destination?]
  ├→ YES: Stop animation, show completion
  └→ NO: Continue loop (back to animation)
  ↓
[User clicks Reset] → Clear all, go to START
```

## Data Flow Example: Obstacle Blocking Path

```
1. Obstacles spawn during update()
   └→ gridWorld.addObstacle(x, y)
   └→ obstacle.spawnedCount++

2. Next animation frame:
   engine._checkAndRecomputePath()
   └→ gridWorld.isPathBlocked(currentPath)
   └→ Returns TRUE (obstacle on path)

3. Trigger A* recomputation:
   aStar(current_pos, hospital, isWalkable, ...)
   └→ Pathfinding explores around obstacle
   └→ Finds alternate route

4. Car path updated:
   carAgent.setPath(newPath)
   └→ pathIndex reset to 0
   └→ Car starts following new path

5. Statistics updated:
   stats.reroutes++
   stats.pathsComputed++
   
6. Next frame: Car follows new path
```

## Performance Characteristics

| Operation | Time | Notes |
|-----------|------|-------|
| A* for 30×30 | 1-5ms | Depends on path length |
| Frame render | <2ms | Canvas operations |
| Car position update | <0.1ms | Simple math |
| Obstacle spawn check | <0.1ms | Time comparison |
| Full frame cycle | ~16ms | 60fps target |

## Testing Strategies

### Unit Testing Concepts
- **A* Algorithm:** Verify path correctness
- **GridWorld:** Test obstacle management
- **CarAgent:** Verify smooth motion
- **ObstacleSystem:** Test spawn logic

### Integration Testing
- Path validity after reroute
- No obstacles on car/hospital
- Smooth animation without jank
- Statistics accuracy

### Performance Testing
- Frame rate consistency
- Pathfinding time limits
- Memory usage
- CPU utilization

## Extension Points

**Easy to add:**
1. Different heuristics (Euclidean, Chebyshev)
2. Variable obstacle spawn rates
3. Multiple cars/agents
4. Different goal positions
5. Terrain costs
6. Diagonal movement

**Moderate complexity:**
1. Dijkstra alternative
2. Traffic simulation
3. Different animation speeds
4. Recording and replay
5. Different grid sizes

**Advanced features:**
1. 3D visualization
2. Real-time performance profiling
3. Machine learning integration
4. Multi-goal planning
5. Behavior tree AI

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Path not found | Algorithm bug or no valid path | Check isWalkable function |
| Car moves too fast/slow | Speed parameter | Adjust carAgent.speed |
| Path computed every frame | Recompute interval too short | Increase pathComputeInterval |
| Memory leak on reset | Event listeners not cleaned | Verify cleanup in useEffect |
| Obstacles on car | Spawn validation failed | Check spawn validation logic |

---

This architecture provides a clean separation between simulation logic (engine layer) and presentation (React layer), making it maintainable, extensible, and easy to debug.
