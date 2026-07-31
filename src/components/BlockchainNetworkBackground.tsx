const NODES = [
  { x: 40, y: 40 },
  { x: 120, y: 110 },
  { x: 55, y: 190 },
  { x: 140, y: 260 },
  { x: 45, y: 340 },
  { x: 125, y: 420 },
  { x: 40, y: 500 },
  { x: 130, y: 580 },
  { x: 55, y: 660 },
  { x: 140, y: 740 },
  { x: 45, y: 820 },
];

const EDGES: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [8, 9],
  [9, 10],
  [1, 3],
  [4, 6],
  [7, 9],
];

function NetworkSvg() {
  return (
    <svg
      viewBox="0 0 200 900"
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full"
    >
      {EDGES.map(([from, to], i) => {
        const a = NODES[from];
        const b = NODES[to];
        return (
          <line
            key={`${from}-${to}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="currentColor"
            strokeWidth="1"
            className="network-line text-emerald-400/30"
            style={{ animationDelay: `${(i % 5) * 0.4}s` }}
          />
        );
      })}
      {NODES.map((node, i) => (
        <circle
          key={`${node.x}-${node.y}`}
          cx={node.x}
          cy={node.y}
          r="3"
          fill="currentColor"
          className="network-node text-emerald-400"
          style={{ animationDelay: `${(i % 6) * 0.5}s` }}
        />
      ))}
    </svg>
  );
}

export default function BlockchainNetworkBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-y-0 left-0 right-0 -z-10 hidden justify-between opacity-60 lg:flex"
    >
      <div className="h-full w-48">
        <NetworkSvg />
      </div>
      <div className="h-full w-48 -scale-x-100">
        <NetworkSvg />
      </div>
    </div>
  );
}
