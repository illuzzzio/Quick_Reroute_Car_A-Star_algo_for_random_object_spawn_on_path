import React, { useEffect, useRef, useState } from 'react';
import styles from './App.module.css';
import { SimulationCanvas } from './components/SimulationCanvas';
import { ControlPanel } from './components/ControlPanel';
import { GridWorld } from './engine/GridWorld';
import { CarAgent } from './engine/CarAgent';
import { ObstacleSystem } from './engine/ObstacleSystem';
import { SimulationEngine } from './engine/SimulationEngine';

/**
 * Main App Component
 * Sets up and manages the entire autonomous driving simulation
 */
function App() {
  const engineRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize simulation systems
    const gridWorld = new GridWorld(20, 20);
    
    // Find a valid start position (in a road, not in a building)
    let startX = 0, startY = 0;
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 20; x++) {
        if (gridWorld.isWalkable(x, y)) {
          startX = x;
          startY = y;
          break;
        }
      }
      if (startX !== 0 || startY !== 0) break;
    }
    
    const carAgent = new CarAgent(startX, startY, 0.05); // Speed: 0.05 cells per frame
    const obstacleSystem = new ObstacleSystem(gridWorld, 5000); // Spawn every 5 seconds
    const engine = new SimulationEngine(gridWorld, carAgent, obstacleSystem);

    engineRef.current = engine;
    setIsReady(true);

    // key listener for spawning obstacle
    const handleKey = (e) => {
      if (e.key === 'o' || e.key === 'O') {
        engine.spawnUserObstacle();
      }
    };
    window.addEventListener('keydown', handleKey);

    return () => {
      window.removeEventListener('keydown', handleKey);
      if (engineRef.current) {
        engineRef.current.stop();
      }
    };
  }, []);

  if (!isReady) {
    return (
      <div className={styles.container}>
        <div>Loading simulation...</div>
      </div>
    );
  }

  return (
    <div className={styles.app}>
      <header className={styles.appHeader}>
        <h1>🚗 Autonomous Vehicle Path Planning</h1>
        <p>Real-time A* Pathfinding Simulation with Dynamic Obstacle Avoidance</p>
      </header>

      <div className={styles.container}>
        <div className={styles.mainContent}>
          <SimulationCanvas engine={engineRef.current} />
        </div>

        <aside className={styles.sidebar}>
          <ControlPanel engine={engineRef.current} />
        </aside>
      </div>

      <footer className={styles.footer}>
        <p>
          Built with React • A* Pathfinding • HTML5 Canvas • Real-time Obstacle Detection
        </p>
      </footer>
    </div>
  );
}

export default App;
