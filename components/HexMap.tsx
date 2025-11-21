
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { HexTile, Tribute, BiomeType, RelationshipType } from '../types';
import { BIOME_COLORS, BIOME_ICONS } from '../constants';

interface HexMapProps {
  map: HexTile[];
  tributes: Tribute[];
  onTributeClick: (tribute: Tribute) => void;
}

const HEX_SIZE = 22;

const hexPoints = (x: number, y: number, size: number) => {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle_deg = 60 * i;
    const angle_rad = Math.PI / 180 * angle_deg;
    points.push(`${x + size * Math.cos(angle_rad)},${y + size * Math.sin(angle_rad)}`);
  }
  return points.join(" ");
};

const hasAllies = (t: Tribute) => {
    return Object.values(t.relationships).some(r => 
        r.type === RelationshipType.ALLY || 
        r.type === RelationshipType.CLOSE_ALLY || 
        r.type === RelationshipType.LOVE
    );
};

const HexMap: React.FC<HexMapProps> = ({ map, tributes, onTributeClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateSize = () => {
        if (containerRef.current) {
            setDimensions({
                width: containerRef.current.offsetWidth,
                height: containerRef.current.offsetHeight
            });
        }
    };
    
    window.addEventListener('resize', updateSize);
    updateSize();
    
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const GRID_OFFSET_X = dimensions.width / 2;
  const GRID_OFFSET_Y = dimensions.height / 2;

  // Math to convert Axial (q, r) to Pixel (x, y)
  const hexToPixel = (q: number, r: number) => {
    const x = HEX_SIZE * (3 / 2 * q);
    const y = HEX_SIZE * (Math.sqrt(3) / 2 * q + Math.sqrt(3) * r);
    return { x: x + GRID_OFFSET_X, y: y + GRID_OFFSET_Y };
  };
  
  const tributesByLoc = useMemo(() => {
    const groups: Record<string, Tribute[]> = {};
    tributes.forEach(t => {
      if (!t.isAlive) return;
      const key = `${t.location.q},${t.location.r}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });
    return groups;
  }, [tributes]);

  // CSS Variables for theming
  const mapStyles = {
    '--tribute-color-alive': '#38bdf8', // sky-400
    '--tribute-color-ally': '#a855f7', // purple-500
    '--tribute-stroke-default': '#ffffff',
    '--tribute-stroke-danger': '#ef4444', // red-500
    '--tribute-group-color': '#a855f7',
    '--hex-stroke-default': '#0ea5e9',
    '--hex-stroke-center': '#ef4444',
    '--hex-fill-opacity': '0.2',
    '--hex-hover-opacity': '0.4'
  } as React.CSSProperties;

  return (
    <div 
      ref={containerRef}
      className="w-full h-full bg-slate-950/50 border border-holo-700 rounded-lg overflow-hidden relative shadow-[0_0_15px_rgba(14,165,233,0.2)]"
      style={mapStyles}
    >
       <div className="absolute top-4 left-4 text-holo-400 font-mono text-xs z-10 pointer-events-none">
         SECTOR VIEW: 4X-ALPHA
       </div>
      <svg className="w-full h-full" viewBox={`0 0 ${dimensions.width} ${dimensions.height}`} preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Draw Map Tiles */}
        <g>
          {map.map((tile) => {
            const { x, y } = hexToPixel(tile.q, tile.r);
            const isCenter = tile.q === 0 && tile.r === 0;
            return (
              <g key={`${tile.q}-${tile.r}`}>
                <polygon
                  points={hexPoints(x, y, HEX_SIZE - 1)}
                  fill={BIOME_COLORS[tile.biome] || '#1e293b'}
                  fillOpacity="var(--hex-fill-opacity)"
                  stroke={isCenter ? 'var(--hex-stroke-center)' : 'var(--hex-stroke-default)'}
                  strokeWidth={isCenter ? 2 : 0.5}
                  className="transition-all duration-500 hover:fill-[opacity:var(--hex-hover-opacity)]"
                  style={{ transitionProperty: 'fill-opacity' }}
                >
                    <title>({tile.q}, {tile.r}) {tile.biome} {tile.trap ? '[TRAP]' : ''}</title>
                </polygon>
                {tile.biome !== BiomeType.FOREST && ( 
                    <text x={x} y={y + 4} textAnchor="middle" fontSize="8" fill="#bae6fd" opacity={0.6} className="pointer-events-none select-none">
                     {BIOME_ICONS[tile.biome]}
                    </text>
                )}
                {/* Trap Indicator */}
                {tile.trap && (
                    <circle cx={x + 8} cy={y - 8} r={3} fill="#a855f7" className="animate-pulse" />
                )}
              </g>
            );
          })}
        </g>

        {/* Draw Tributes */}
        <g>
          {Object.keys(tributesByLoc).map(key => {
            const [q, r] = key.split(',').map(Number);
            const group = tributesByLoc[key];
            const { x, y } = hexToPixel(q, r);
            
            // Multiple Tributes in Hex
            if (group.length > 1) {
               return (
                 <g key={`group-${key}`} onClick={() => onTributeClick(group[0])} className="cursor-pointer hover:opacity-80">
                   <circle cx={x} cy={y} r={12} fill="var(--tribute-group-color)" stroke="white" strokeWidth={1} filter="url(#glow)" />
                   <text x={x} y={y + 4} textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">{group.length}</text>
                   <text x={x} y={y - 14} textAnchor="middle" fontSize="6" fill="#e9d5ff" className="font-mono">GROUP</text>
                 </g>
               );
            }

            // Single Tribute
            const t = group[0];
            const allyStatus = hasAllies(t);

            return (
              <g key={t.id} onClick={() => onTributeClick(t)} className="cursor-pointer hover:scale-110 transition-transform group">
                {/* Base Circle */}
                <circle 
                  cx={x} cy={y} 
                  r={9} 
                  fill={allyStatus ? 'var(--tribute-color-ally)' : 'var(--tribute-color-alive)'} 
                  stroke={t.health < 30 ? 'var(--tribute-stroke-danger)' : 'var(--tribute-stroke-default)'}
                  strokeWidth={1.5} 
                  fillOpacity={0.7}
                />
                
                {/* Name */}
                <text x={x} y={y - 10} textAnchor="middle" fontSize="6" fill="#bae6fd" className="font-mono pointer-events-none font-bold drop-shadow-md">
                  {t.name.split('-')[0]}
                </text>

                {/* Compact Stats Display */}
                <text x={x} y={y - 2} textAnchor="middle" fontSize="3" fill="white" className="font-mono pointer-events-none select-none" style={{textShadow: '0px 1px 1px black'}}>
                   S:{t.stats.strength} P:{t.stats.speed} C:{t.stats.constitution}
                </text>
                <text x={x} y={y + 2} textAnchor="middle" fontSize="3" fill="white" className="font-mono pointer-events-none select-none" style={{textShadow: '0px 1px 1px black'}}>
                   I:{t.stats.intellect} A:{t.stats.aggression}
                </text>

                {/* Health Bar Mini */}
                <rect x={x - 6} y={y + 4} width={12} height={1.5} fill="#334155" rx={0.5} />
                <rect x={x - 6} y={y + 4} width={Math.max(0, (t.health / 100) * 12)} height={1.5} fill={t.health < 30 ? "#ef4444" : "#22c55e"} rx={0.5} />

                <title>{t.name} &#10;HP: {Math.floor(t.health)}% &#10;STR:{t.stats.strength} SPD:{t.stats.speed} CON:{t.stats.constitution} INT:{t.stats.intellect} AGG:{t.stats.aggression}</title>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

export default HexMap;
