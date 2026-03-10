# Autonomous Vehicle Path Planning Simulation

A professional 2D self-driving car simulation demonstrating AI-based autonomous navigation using the **A* pathfinding algorithm** with real-time obstacle detection and dynamic rerouting.

## Features

✨ **Core Capabilities**
- 🤖 A* pathfinding algorithm with Manhattan distance heuristic
- 🚗 Smooth autonomous vehicle animation
- 🧱 Dynamic obstacle spawning (every 3 seconds)
- 🔄 Automatic path recalculation when obstructions detected
- 📊 Real-time performance metrics and statistics
- 🎨 Professional grid-based visualization with HTML5 Canvas

✅ **Technical Highlights**
- React 18 with Vite for fast development
- Modular, clean architecture with separation of concerns
- requestAnimationFrame-based animation loop
- 30×30 grid-based environment
- 4-directional pathfinding (up, down, left, right)
- Interactive UI with simulation controls

## Project Structure

```
src/
├── algorithms/
│   └── astar.js                 # A* pathfinding implementation
├── engine/
│   ├── GridWorld.js             # World state and obstacle management
│   ├── CarAgent.js              # Autonomous vehicle agent
│   ├── ObstacleSystem.js        # Dynamic obstacle spawning
│   └── SimulationEngine.js      # Main simulation controller
├── components/
│   ├── SimulationCanvas.jsx     # Canvas rendering component
│   ├── SimulationCanvas.module.css
│   ├── ControlPanel.jsx         # UI controls and statistics
│   ├── ControlPanel.module.css
│   └── App.jsx                  # Main application component
├── App.module.css
├── index.css
└── main.jsx                     # React entry point
```

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

```bash
cd next_ai_project
npm install
```

### Development

Start the development server with hot reload:

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173`

### Build

Create an optimized production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## How It Works

### 1. A* Pathfinding Algorithm

The simulation uses the A* algorithm to compute the optimal path from the car to the hospital.

**Algorithm Details:**
- **Cost Function:** `f(n) = g(n) + h(n)`
  - `g(n)` = Distance traveled from start
  - `h(n)` = Manhattan distance heuristic to goal: `|x1 - x2| + |y1 - y2|`
- **Open Set:** Priority queue of nodes to explore
- **Closed Set:** Set of already explored nodes
- **Movement:** 4-directional (up, down, left, right)

### 2. Simulation Loop

```javascript
while (simulation running) {
  1. Update car position (move along path)
  2. Check obstacle collisions
  3. If path blocked → recompute A*
  4. Receive new obstacles (every 3 seconds)
  5. Render updated world
  6. Request next animation frame
}
```

### 3. Obstacle System

- Obstacles spawn randomly every 3 seconds
- Each spawn creates 2 new obstacles (up to 15 max)
- Obstacles never appear on the car or hospital
- When an obstacle blocks the current path, the system triggers immediate rerouting

### 4. Car Agent

- Moves smoothly grid cell by grid cell
- Follows computed paths with interpolated positioning
- Reports statistics: position, distance traveled, paths computed
- Automatically stops when destination is reached

## Controls

| Control | Action |
|---------|--------|
| **▶ Start Simulation** | Begin autonomous navigation |
| **⏸ Pause** | Pause the simulation |
| **↻ Reset** | Reset to initial state |
| **✛ Spawn Obstacle** | Manually place an obstacle |
| **Show Path** | Toggle path visualization |
| **Show A* Explored** | Toggle explored nodes visualization |

## Statistics Display

**Car Status**
- Current position on grid
- Distance traveled (in cells)
- Movement status (Moving/Idle)

**Pathfinding**
- Total paths computed
- Current path length
- Number of nodes explored by A*
- Algorithm compute time (milliseconds)
- Total reroutes performed

**Environment**
- Current obstacle count
- Maximum obstacle limit
- Total obstacles spawned

## Color Reference

| Element | Color | Purpose |
|---------|-------|---------|
| Car | Yellow (#FFF200) | Autonomous vehicle |
| Hospital | Red (#F44336) | Destination/goal |
| Obstacles | Orange (#FF6B6B) | Barriers to avoid |
| Path | Blue (#2196F3) | Computed route |
| Grid | Light Gray (#404040) | World divisions |
| Explored Nodes | Orange (30%) | A* search coverage |

## Algorithm Complexity

- **Time Complexity:** O(b^d) where b is branching factor (4) and d is search depth
- **Space Complexity:** O(b^d) for storing open and closed sets
- **In Practice:** Very fast for 30×30 grids (typically <5ms per computation)

## Key Implementation Details

### Priority Queue for A*
```javascript
// Nodes sorted by f(n) value
// Dequeue always returns lowest f-cost node
```

### Path Reconstruction
```javascript
// Traverse backward from goal using cameFrom map
// Reverse to get forward path
```

### Grid Walkability
```javascript
// Only non-obstacle cells are walkable
// Dynamically checked during pathfinding
```

### Smooth Animation
```javascript
// requestAnimationFrame for 60fps animation
// Linear interpolation between grid cells
// Smooth movement speed: 0.1 cells/frame
```

## Performance Optimization

- Canvas rendering with pixelated image rendering for crisp edges
- Efficient obstacle lookup using Set data structure
- Lazy path recomputation (only when necessary)
- Configurable spawn intervals and obstacles per spawn
- Optimized grid traversal for A* algorithm

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (with touch support)

## Technology Stack

- **Frontend Framework:** React 18
- **Build Tool:** Vite 5
- **Rendering:** HTML5 Canvas API
- **Algorithm:** A* Pathfinding
- **Styling:** CSS Modules
- **Language:** JavaScript (ES6+)

## Future Enhancements

🎯 Possible improvements:
- Dijkstra's algorithm comparison
- Bidirectional pathfinding
- Multi-agent coordination
- Traffic simulation
- Terrain/cost-based pathfinding
- 3D visualization
- Mobile responsiveness improvements
- Pathfinding visualization animation
- Performance profiling dashboard

## Code Quality

The codebase follows best practices:
- ✅ Modular architecture with clear separation of concerns
- ✅ Comprehensive inline documentation and comments
- ✅ Consistent naming conventions
- ✅ Error handling for edge cases
- ✅ No external dependencies beyond React and Vite

## License

Open source - feel free to use and modify for educational and research purposes.

## Author

Built as a professional AI research simulation demonstrating autonomous vehicle navigation principles.

---

**Note:** This simulation serves as an educational tool to understand pathfinding algorithms and autonomous navigation systems. It simplifies real-world autonomous driving for clarity and performance.
