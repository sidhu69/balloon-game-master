import React from "react";

interface GameOverlayProps {
  type: "start" | "gameover";
  score?: number;
  highScore?: number;
  onStart: () => void;
}

const GameOverlay: React.FC<GameOverlayProps> = ({ type, score, highScore, onStart }) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" />
      <div className="relative game-panel rounded-2xl p-8 text-center max-w-sm mx-4 shadow-2xl">
        {type === "start" ? (
          <>
            <div className="text-6xl mb-4">🎈</div>
            <h1 className="text-display text-4xl font-bold mb-2" style={{ color: "hsl(var(--primary))" }}>
              Balloon Pop!
            </h1>
            <p className="opacity-70 mb-6">
              Pop the balloons before they escape!
              <br />
              Don't let 5 get away!
            </p>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">💥</div>
            <h2 className="text-display text-3xl font-bold mb-2" style={{ color: "hsl(var(--destructive))" }}>
              Game Over!
            </h2>
            <div className="mb-2">
              <span className="text-display text-xl opacity-70">Score: </span>
              <span className="text-display text-3xl font-bold">{score}</span>
            </div>
            {score === highScore && score! > 0 && (
              <div className="text-sm font-bold mb-2" style={{ color: "hsl(var(--secondary))" }}>
                🏆 New High Score!
              </div>
            )}
            <div className="text-sm opacity-60 mb-6">Best: {highScore}</div>
          </>
        )}
        <button
          onClick={onStart}
          className="text-display font-bold text-lg px-8 py-3 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: "hsl(var(--primary))",
            color: "hsl(var(--primary-foreground))",
            boxShadow: "0 4px 20px hsl(var(--primary) / 0.4)",
          }}
        >
          {type === "start" ? "🎮 Start Game" : "🔄 Play Again"}
        </button>
      </div>
    </div>
  );
};

export default GameOverlay;
