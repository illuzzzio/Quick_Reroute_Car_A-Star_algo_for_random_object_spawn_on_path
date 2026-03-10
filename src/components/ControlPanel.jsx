import React, { useState, useEffect } from 'react';
import styles from './ControlPanel.module.css';

/**
 * ControlPanel - UI controls and statistics display
 */
export const ControlPanel = ({ engine }) => {
  const [stats, setStats] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  // Update stats and running state periodically
  useEffect(() => {
    if (!engine) return;

    const intervalId = setInterval(() => {
      try {
        setStats(engine.getStats());
        setIsRunning(engine.getRunning());
      } catch (err) {
        console.error('Stats update error:', err);
      }
    }, 100);

    return () => clearInterval(intervalId);
  }, [engine]);

  if (!engine) {
    return <div className={styles.controlPanel}>Loading...</div>;
  }

  // instructions for obstacle spawning
  const spawnInstruction = (
    <div style={{ marginTop: '8px', fontSize: '0.9rem' }}>
      Press <strong>O</strong> to spawn an obstacle
    </div>
  );

  const handleStart = () => {
    engine.start();
    setIsRunning(true);
  };

  const handlePause = () => {
    engine.stop();
    setIsRunning(false);
  };

  const handleReset = () => {
    engine.stop();
    engine.reset();
    setIsRunning(false);
    setStats(engine.getStats());
  };

  const handleSpawnObstacle = () => {
    try {
      const { width, height } = engine.getGridDimensions();
      const carPos = engine.getCarPosition();
      const goal = engine.getGoal();

      let x, y, attempts = 0;
      const maxAttempts = 100;

      while (attempts < maxAttempts) {
        x = Math.floor(Math.random() * width);
        y = Math.floor(Math.random() * height);
        attempts++;

        // Check if position is valid
        const carGridX = Math.round(carPos.x);
        const carGridY = Math.round(carPos.y);
        
        if (
          (x === carGridX && y === carGridY) ||
          (x === goal.x && y === goal.y) ||
          engine.gridWorld.hasObstacle(x, y)
        ) {
          continue; // Try another position
        }

        // Found valid position
        engine.gridWorld.addObstacle(x, y);
        console.log(`Obstacle spawned at (${x}, ${y})`);
        return;
      }

      console.warn('Could not find valid position to spawn obstacle');
    } catch (err) {
      console.error('Spawn obstacle error:', err);
    }
  };

  return (
    <div className={styles.controlPanel}>
      <div className={styles.header}>
        <h2>Autonomous Driving Simulation</h2>
        <p className={styles.subtitle}>A* Pathfinding Algorithm Demo</p>
      </div>

      <div className={styles.controls}>
        <button
          className={`${styles.button} ${styles.primary}`}
          onClick={handleStart}
          disabled={isRunning}
        >
          ▶ Start Simulation
        </button>

        <button
          className={`${styles.button} ${styles.secondary}`}
          onClick={handlePause}
          disabled={!isRunning}
        >
          ⏸ Pause
        </button>

        <button
          className={`${styles.button} ${styles.secondary}`}
          onClick={handleReset}
        >
          🔄 Reset
        </button>

        <button
          className={`${styles.button} ${styles.secondary}`}
          onClick={() => engine.spawnUserObstacle()}
        >
          🟥 Spawn Obstacle
        </button>

        {spawnInstruction}
      </div>

      {stats && (
        <div className={styles.statistics}>
          <div className={styles.statsTitle}>Simulation Statistics</div>

          <div className={styles.statGroup}>
            <div className={styles.statGroupTitle}>Car Status</div>
            <div className={styles.statRow}>
              <span className={styles.label}>Position:</span>
              <span className={styles.value}>
                ({stats.car.position.x}, {stats.car.position.y})
              </span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.label}>Distance:</span>
              <span className={styles.value}>{stats.car.distanceTraveled} cells</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.label}>Status:</span>
              <span className={`${styles.value} ${styles.statusBadge}`}>
                {stats.car.isMoving ? '🔄 Moving' : '⏹ Idle'}
              </span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.label}>Goal (Hospital):</span>
              <span className={styles.value}>
                ({engine.goal.x}, {engine.goal.y})
              </span>
            </div>
          </div>

          <div className={styles.statGroup}>
            <div className={styles.statGroupTitle}>Pathfinding</div>
            <div className={styles.statRow}>
              <span className={styles.label}>Paths Computed:</span>
              <span className={styles.value}>{stats.car.pathsComputed}</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.label}>Current Path Length:</span>
              <span className={styles.value}>{stats.engine.pathLength} cells</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.label}>Nodes Explored:</span>
              <span className={styles.value}>{stats.engine.nodesExplored}</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.label}>Compute Time:</span>
              <span className={styles.value}>{stats.engine.computeTime}ms</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.label}>Reroutes:</span>
              <span className={styles.value}>{stats.engine.reroutes}</span>
            </div>
          </div>

          <div className={styles.statGroup}>
            <div className={styles.statGroupTitle}>Environment</div>
            <div className={styles.statRow}>
              <span className={styles.label}>Obstacles:</span>
              <span className={styles.value}>
                {stats.obstacles.obstacleCount} / {stats.obstacles.maxObstacles}
              </span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.label}>Total Spawned:</span>
              <span className={styles.value}>{stats.obstacles.totalSpawned}</span>
            </div>
          </div>

          <div className={styles.statusIndicator}>
            <div
              className={`${styles.indicator} ${
                stats.car.isMoving ? styles.active : ''
              }`}
            />
            <span>{stats.car.isMoving ? 'Running...' : 'Ready'}</span>
          </div>
        </div>
      )}

      <div className={styles.info}>
        <h3>🎯 Real A* Pathfinding</h3>
        <ul>
          <li>🤖 Continuous A* recalculation (~5 times/sec)</li>
          <li>🚗 Dynamic path optimization like Google Maps</li>
          <li>🎯 Random hospital location each scenario</li>
          <li>🧱 Obstacles spawn every 5 seconds</li>
          <li>⚡ Instant rerouting on path blockage</li>
          <li>📊 Real pathfinding metrics displayed</li>
        </ul>
      </div>
    </div>
  );
};

export default ControlPanel;
