import React, { useCallback, useEffect, useRef, useState } from "react";
import { useGameEngine } from "@/hooks/useGameEngine";
import BalloonComponent from "@/components/Balloon";
import Cloud from "@/components/Cloud";
import GameHUD from "@/components/GameHUD";
import GameOverlay from "@/components/GameOverlay";

const CLOUDS = [
  { x: 100, y: 80, scale: 0.8, opacity: 0.6, speed: 0.15 },
  { x: 400, y: 150, scale: 1.1, opacity: 0.4, speed: 0.1 },
  { x: 700, y: 60, scale: 0.6, opacity: 0.5, speed: 0.2 },
  { x: 250, y: 200, scale: 0.9, opacity: 0.35, speed: 0.12 },
];

const BalloonGame: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [cloudOffsets, setCloudOffsets] = useState(CLOUDS.map(() => 0));
  const { state, startGame, popBalloon, tick } = useGameEngine();
  const animRef = useRef<number>(0);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const gameLoop = useCallback(() => {
    tick(dimensions.width, dimensions.height);
    setCloudOffsets((prev) =>
      prev.map((offset, i) => {
        const newOffset = offset + CLOUDS[i].speed;
        return newOffset > dimensions.width + 200 ? -200 : newOffset;
      })
    );
    animRef.current = requestAnimationFrame(gameLoop);
  }, [tick, dimensions]);

  useEffect(() => {
    if (state.isRunning) {
      animRef.current = requestAnimationFrame(gameLoop);
      return () => cancelAnimationFrame(animRef.current);
    }
  }, [state.isRunning, gameLoop]);

  // Dispatch game state changes for Play page to track
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("game-state-change", {
        detail: { score: state.score, isRunning: state.isRunning },
      })
    );
  }, [state.score, state.isRunning]);

  // Force re-render for sway animation
  const [, setForceRender] = useState(0);
  useEffect(() => {
    if (!state.isRunning) return;
    const interval = setInterval(() => setForceRender((n) => n + 1), 50);
    return () => clearInterval(interval);
  }, [state.isRunning]);

  const showOverlay = !state.isRunning;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden sky-gradient select-none"
    >
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="absolute inset-0"
        style={{ cursor: state.isRunning ? "crosshair" : "default" }}
      >
        {/* Clouds */}
        {CLOUDS.map((cloud, i) => (
          <Cloud
            key={i}
            x={cloud.x + cloudOffsets[i]}
            y={cloud.y}
            scale={cloud.scale}
            opacity={cloud.opacity}
          />
        ))}

        {/* Balloons */}
        {state.balloons.map((balloon) => (
          <BalloonComponent
            key={balloon.id}
            x={balloon.x}
            y={balloon.y}
            size={balloon.size}
            color={balloon.color}
            swayAmount={balloon.swayAmount}
            swaySpeed={balloon.swaySpeed}
            popped={balloon.popped}
            onPop={() => popBalloon(balloon.id)}
          />
        ))}
      </svg>

      {/* HUD */}
      {state.isRunning && (
        <GameHUD
          score={state.score}
          lives={state.lives}
          level={state.level}
          highScore={state.highScore}
          combo={state.combo}
        />
      )}

      {/* Overlays */}
      {showOverlay && (
        <GameOverlay
          type={state.isGameOver ? "gameover" : "start"}
          score={state.score}
          highScore={state.highScore}
          onStart={startGame}
        />
      )}
    </div>
  );
};

export default BalloonGame;
