import React from "react";

interface BalloonProps {
  x: number;
  y: number;
  size: number;
  color: string;
  swayAmount: number;
  swaySpeed: number;
  onPop: () => void;
  popped: boolean;
}

const Balloon: React.FC<BalloonProps> = ({
  x,
  y,
  size,
  color,
  swayAmount,
  swaySpeed,
  onPop,
  popped,
}) => {
  const swayOffset = Math.sin(Date.now() * 0.001 * swaySpeed) * swayAmount;

  if (popped) return null;

  const hsl = `hsl(${color})`;
  const highlightHsl = `hsl(${color.split(" ")[0]} 90% 80%)`;

  return (
    <g
      style={{
        cursor: "pointer",
        transform: `translate(${x + swayOffset}px, ${y}px)`,
        transition: "transform 0.05s linear",
      }}
      onClick={(e) => {
        e.stopPropagation();
        onPop();
      }}
    >
      {/* String */}
      <line
        x1={0}
        y1={size * 0.55}
        x2={0}
        y2={size * 0.55 + 30}
        stroke="hsl(var(--muted-foreground))"
        strokeWidth={1.5}
        strokeLinecap="round"
      />

      {/* Balloon body */}
      <ellipse
        cx={0}
        cy={0}
        rx={size * 0.42}
        ry={size * 0.52}
        fill={hsl}
        style={{ filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.15))" }}
      />

      {/* Highlight */}
      <ellipse
        cx={-size * 0.12}
        cy={-size * 0.18}
        rx={size * 0.12}
        ry={size * 0.18}
        fill={highlightHsl}
        opacity={0.5}
      />

      {/* Knot */}
      <polygon
        points={`${-size * 0.06},${size * 0.5} ${size * 0.06},${size * 0.5} 0,${size * 0.58}`}
        fill={hsl}
      />
    </g>
  );
};

export default Balloon;
