import { useCallback, useEffect, useRef, useState } from "react";

export interface Balloon {
  id: number;
  x: number;
  y: number;
  color: string;
  speed: number;
  size: number;
  swayAmount: number;
  swaySpeed: number;
  popped: boolean;
}

const BALLOON_COLORS = [
  "var(--balloon-red)",
  "var(--balloon-yellow)",
  "var(--balloon-green)",
  "var(--balloon-pink)",
  "var(--balloon-orange)",
  "var(--balloon-purple)",
  "var(--balloon-blue)",
];

interface GameState {
  balloons: Balloon[];
  score: number;
  lives: number;
  level: number;
  isRunning: boolean;
  isGameOver: boolean;
  combo: number;
  highScore: number;
}

export function useGameEngine() {
  const [state, setState] = useState<GameState>({
    balloons: [],
    score: 0,
    lives: 5,
    level: 1,
    isRunning: false,
    isGameOver: false,
    combo: 0,
    highScore: Number(localStorage.getItem("balloon-high-score") || "0"),
  });

  const nextId = useRef(0);
  const frameRef = useRef<number>(0);
  const lastSpawn = useRef(0);
  const lastTime = useRef(0);

  const spawnBalloon = useCallback((width: number, height: number, level: number): Balloon => {
    const color = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];
    const size = 50 + Math.random() * 30;
    return {
      id: nextId.current++,
      x: size / 2 + Math.random() * (width - size),
      y: height + size,
      color,
      speed: 1 + Math.random() * 1.5 + level * 0.3,
      size,
      swayAmount: 10 + Math.random() * 25,
      swaySpeed: 0.5 + Math.random() * 1.5,
      popped: false,
    };
  }, []);

  const startGame = useCallback(() => {
    nextId.current = 0;
    lastSpawn.current = 0;
    lastTime.current = 0;
    setState((prev) => ({
      balloons: [],
      score: 0,
      lives: 5,
      level: 1,
      isRunning: true,
      isGameOver: false,
      combo: 0,
      highScore: prev.highScore,
    }));
  }, []);

  const popBalloon = useCallback((id: number) => {
    setState((prev) => {
      if (!prev.isRunning) return prev;
      const balloon = prev.balloons.find((b) => b.id === id);
      if (!balloon || balloon.popped) return prev;

      const newCombo = prev.combo + 1;
      const comboBonus = Math.floor(newCombo / 3) * 5;
      const points = 10 + comboBonus;
      const newScore = prev.score + points;
      const newHigh = Math.max(newScore, prev.highScore);

      if (newHigh > prev.highScore) {
        localStorage.setItem("balloon-high-score", String(newHigh));
      }

      return {
        ...prev,
        balloons: prev.balloons.map((b) =>
          b.id === id ? { ...b, popped: true } : b
        ),
        score: newScore,
        combo: newCombo,
        highScore: newHigh,
      };
    });
  }, []);

  const tick = useCallback(
    (width: number, height: number) => {
      setState((prev) => {
        if (!prev.isRunning) return prev;

        const now = Date.now();
        const spawnInterval = Math.max(400, 1200 - prev.level * 80);

        let newBalloons = [...prev.balloons];
        let newLives = prev.lives;

        // Spawn
        if (now - lastSpawn.current > spawnInterval) {
          newBalloons.push(spawnBalloon(width, height, prev.level));
          lastSpawn.current = now;
        }

        // Move balloons
        newBalloons = newBalloons
          .map((b) => ({
            ...b,
            y: b.popped ? b.y : b.y - b.speed,
          }))
          .filter((b) => {
            if (b.popped) return false; // Remove popped
            if (b.y < -b.size) {
              newLives--;
              return false; // Escaped
            }
            return true;
          });

        const isGameOver = newLives <= 0;
        const newLevel = Math.floor(prev.score / 100) + 1;

        return {
          ...prev,
          balloons: newBalloons,
          lives: Math.max(0, newLives),
          level: newLevel,
          isRunning: !isGameOver,
          isGameOver,
          combo: prev.combo,
        };
      });
    },
    [spawnBalloon]
  );

  return { state, startGame, popBalloon, tick };
}
