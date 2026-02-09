import React from "react";

interface GameHUDProps {
  score: number;
  lives: number;
  level: number;
  highScore: number;
  combo: number;
}

const GameHUD: React.FC<GameHUDProps> = ({ score, lives, level, highScore, combo }) => {
  return (
    <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 pointer-events-none">
      {/* Score */}
      <div className="game-panel rounded-lg px-4 py-2 pointer-events-auto">
        <div className="text-display text-sm font-medium opacity-70">SCORE</div>
        <div className="text-display text-2xl font-bold">{score}</div>
        {combo >= 3 && (
          <div className="text-xs font-bold" style={{ color: "hsl(var(--secondary))" }}>
            🔥 x{combo} combo!
          </div>
        )}
      </div>

      {/* Level */}
      <div className="game-panel rounded-lg px-4 py-2 pointer-events-auto">
        <div className="text-display text-sm font-medium opacity-70">LEVEL</div>
        <div className="text-display text-2xl font-bold">{level}</div>
      </div>

      {/* Lives */}
      <div className="game-panel rounded-lg px-4 py-2 pointer-events-auto">
        <div className="text-display text-sm font-medium opacity-70">LIVES</div>
        <div className="text-display text-xl flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={i < lives ? "opacity-100" : "opacity-20"}>
              ❤️
            </span>
          ))}
        </div>
      </div>

      {/* High Score */}
      <div className="game-panel rounded-lg px-4 py-2 pointer-events-auto">
        <div className="text-display text-sm font-medium opacity-70">BEST</div>
        <div className="text-display text-2xl font-bold" style={{ color: "hsl(var(--secondary))" }}>
          {highScore}
        </div>
      </div>
    </div>
  );
};

export default GameHUD;
