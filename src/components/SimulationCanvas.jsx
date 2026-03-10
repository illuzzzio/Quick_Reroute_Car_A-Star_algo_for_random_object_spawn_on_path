import React, { useEffect, useRef, useState } from 'react';
import styles from './SimulationCanvas.module.css';

/**
 * SimulationCanvas - Renders the entire 2D simulation using HTML5 Canvas
 */
export const SimulationCanvas = ({ engine }) => {
  const canvasRef = useRef(null);
  const [isVisualizingPath, setIsVisualizingPath] = useState(true);
  const [isVisualizingExplored, setIsVisualizingExplored] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const animationRef = useRef(null);

  // Update running state when engine changes
  useEffect(() => {
    if (engine) {
      setIsRunning(engine.getRunning());
      
      // Poll for running state changes
      const intervalId = setInterval(() => {
        setIsRunning(engine.getRunning());
      }, 100);
      
      return () => clearInterval(intervalId);
    }
  }, [engine]);

  const GRID_SIZE = 20;
  const CELL_SIZE = 25;
  const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;

  const COLORS = {
    background: '#2a2a2a',
    grid: '#404040',
    path: '#2196F3',
    pathDot: '#1976D2',
    explored: 'rgba(255, 152, 0, 0.3)',
    car: '#FFF200',
    carBorder: '#FFB300',
    hospital: '#F44336',
    obstacle: '#FF6B6B',
    obstacleOuter: '#D32F2F'
  };

  /**
   * Draw grid background
   */
  const drawGrid = (ctx) => {
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 0.5;

    // Vertical lines
    for (let x = 0; x <= GRID_SIZE; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, CANVAS_SIZE);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= GRID_SIZE; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(CANVAS_SIZE, y * CELL_SIZE);
      ctx.stroke();
    }
  };

  /**
   * Draw explored nodes (for pathfinding visualization)
   */
  const drawExploredNodes = (ctx, explored) => {
    if (!explored || explored.length === 0) return;

    ctx.fillStyle = COLORS.explored;

    for (const node of explored) {
      const x = node.x * CELL_SIZE + 1;
      const y = node.y * CELL_SIZE + 1;
      ctx.fillRect(x, y, CELL_SIZE - 2, CELL_SIZE - 2);
    }
  };

  /**
   * Draw path
   */
  const drawPath = (ctx, path) => {
    if (!path || path.length < 2) return;

    // Draw path line
    ctx.strokeStyle = COLORS.path;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(path[0].x * CELL_SIZE + CELL_SIZE / 2, path[0].y * CELL_SIZE + CELL_SIZE / 2);

    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x * CELL_SIZE + CELL_SIZE / 2, path[i].y * CELL_SIZE + CELL_SIZE / 2);
    }

    ctx.stroke();

    // Draw path nodes
    ctx.fillStyle = COLORS.pathDot;
    for (const node of path) {
      ctx.beginPath();
      ctx.arc(node.x * CELL_SIZE + CELL_SIZE / 2, node.y * CELL_SIZE + CELL_SIZE / 2, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  /**
   * Draw obstacles
   */
  const drawObstacles = (ctx, obstacles) => {
    // Separate buildings from dynamic obstacles
    const buildings = [];
    const dynamicObstacles = [];

    for (const obstacle of obstacles) {
      if (engine.gridWorld.buildings && engine.gridWorld.buildings.has(`${obstacle.x},${obstacle.y}`)) {
        buildings.push(obstacle);
      } else {
        dynamicObstacles.push(obstacle);
      }
    }

    // Draw buildings (darker, permanent structures)
    ctx.fillStyle = '#1a1a1a';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (const building of buildings) {
      const x = building.x * CELL_SIZE;
      const y = building.y * CELL_SIZE;
      ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
      ctx.strokeRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
    }

    // Draw dynamic obstacles (bright red warning color)
    for (const obstacle of dynamicObstacles) {
      const x = obstacle.x * CELL_SIZE;
      const y = obstacle.y * CELL_SIZE;

      // Outer border
      ctx.fillStyle = COLORS.obstacleOuter;
      ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

      // Inner fill (bright red for spawned obstacles)
      ctx.fillStyle = '#FF3333';
      ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);

      // Pattern (X marks the spot)
      ctx.strokeStyle = COLORS.obstacleOuter;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + CELL_SIZE, y + CELL_SIZE);
      ctx.moveTo(x + CELL_SIZE, y);
      ctx.lineTo(x, y + CELL_SIZE);
      ctx.stroke();
    }
  };

  /**
   * Draw hospital
   */
  const drawHospital = (ctx, goal) => {
    const x = goal.x * CELL_SIZE;
    const y = goal.y * CELL_SIZE;

    // Main building
    ctx.fillStyle = COLORS.hospital;
    ctx.fillRect(x + 3, y + 3, CELL_SIZE - 6, CELL_SIZE - 6);

    // Medical cross
    ctx.fillStyle = '#FFFFFF';
    const crossSize = 8;
    const centerX = x + CELL_SIZE / 2;
    const centerY = y + CELL_SIZE / 2;

    // Horizontal bar
    ctx.fillRect(centerX - crossSize / 2, centerY - 2, crossSize, 4);
    // Vertical bar
    ctx.fillRect(centerX - 2, centerY - crossSize / 2, 4, crossSize);

    // Border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 3, y + 3, CELL_SIZE - 6, CELL_SIZE - 6);
  };

  /**
   * Draw car
   */
  const drawCar = (ctx, carPos) => {
    const x = carPos.x * CELL_SIZE;
    const y = carPos.y * CELL_SIZE;

    // Car body
    ctx.fillStyle = COLORS.car;
    ctx.fillRect(x + 5, y + 4, CELL_SIZE - 10, CELL_SIZE - 8);

    // Windshield
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(x + 7, y + 5, CELL_SIZE - 14, 4);

    // Wheels
    ctx.fillStyle = COLORS.carBorder;
    // Left wheel
    ctx.beginPath();
    ctx.arc(x + 8, y + 18, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Right wheel
    ctx.beginPath();
    ctx.arc(x + CELL_SIZE - 8, y + 18, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Front light
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(x + CELL_SIZE / 2, y + 4, 1, 0, Math.PI * 2);
    ctx.fill();
  };

  /**
   * Main render function
   */
  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw grid
    drawGrid(ctx);

    // Draw explored nodes if enabled
    if (isVisualizingExplored) {
      const explored = engine.getExploredNodes();
      drawExploredNodes(ctx, explored);
    }

    // Draw path if enabled
    if (isVisualizingPath) {
      const path = engine.getPath();
      drawPath(ctx, path);
    }

    // Draw obstacles
    const obstacles = engine.getObstacles();
    drawObstacles(ctx, obstacles);

    // Draw hospital
    const goal = engine.getGoal();
    drawHospital(ctx, goal);

    // Draw car
    const carPos = engine.getCarPosition();
    drawCar(ctx, carPos);

    // Overlay status messages
    const status = engine.getStatus && engine.getStatus();
    if (status) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      if (status.status === 'rerouting') {
        ctx.fillText('REROUTING...', CANVAS_SIZE / 2, CANVAS_SIZE / 2);
      }
    }
  };

  /**
   * Animation loop
   */
  const animate = () => {
    const currentTime = Date.now();

    // Update engine
    engine.update(currentTime);

    // Render
    render();

    if (isRunning) {
      animationRef.current = requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = CANVAS_SIZE;
      canvasRef.current.height = CANVAS_SIZE;
    }

    render(); // Initial render
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [engine]);

  useEffect(() => {
    if (isRunning) {
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, isVisualizingPath, isVisualizingExplored]);

  return (
    <div className={styles.canvasContainer}>
      <div className={styles.canvasWrapper}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          style={{
            border: '2px solid #555',
            backgroundColor: COLORS.background,
            cursor: 'crosshair'
          }}
        />
      </div>

      <div className={styles.legend}>
        <div className={styles.legendTitle}>Legend</div>
        <div className={styles.legendItem}>
          <div className={styles.swatch} style={{ backgroundColor: COLORS.car }}></div>
          <span>Self-Driving Car</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.swatch} style={{ backgroundColor: COLORS.hospital }}></div>
          <span>Hospital (Destination)</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.swatch} style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}></div>
          <span>Buildings</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.swatch} style={{ backgroundColor: '#FF3333' }}></div>
          <span>Spawned Obstacles</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.swatch} style={{ backgroundColor: COLORS.path }}></div>
          <span>Computed Path</span>
        </div>

        <div className={styles.toggles}>
          <label>
            <input
              type="checkbox"
              checked={isVisualizingPath}
              onChange={() => setIsVisualizingPath(!isVisualizingPath)}
            />
            Show Path
          </label>
          <label>
            <input
              type="checkbox"
              checked={isVisualizingExplored}
              onChange={() => setIsVisualizingExplored(!isVisualizingExplored)}
            />
            Show A* Explored
          </label>
        </div>
      </div>
    </div>
  );
};

export default SimulationCanvas;
