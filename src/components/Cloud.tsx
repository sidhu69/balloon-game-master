import React from "react";

interface CloudProps {
  x: number;
  y: number;
  scale: number;
  opacity: number;
}

const Cloud: React.FC<CloudProps> = ({ x, y, scale, opacity }) => (
  <g
    style={{
      transform: `translate(${x}px, ${y}px) scale(${scale})`,
      opacity,
    }}
  >
    <ellipse cx={0} cy={0} rx={50} ry={25} fill="white" />
    <ellipse cx={-30} cy={5} rx={30} ry={20} fill="white" />
    <ellipse cx={30} cy={5} rx={35} ry={20} fill="white" />
    <ellipse cx={10} cy={-12} rx={28} ry={20} fill="white" />
  </g>
);

export default Cloud;
