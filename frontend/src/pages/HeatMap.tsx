import { useEffect, useRef, useState, useMemo } from 'react';

type Point = { lat: number; lng: number };

interface Props {
  points: Point[];
  width?: number;
  height?: number;
  gridSize?: number; // number of grid cells per row/column
}

function getMapboxImageURL(points: Point[], width: number, height: number, token: string): string {
    if (points.length === 0) return '';
  
    const avgLat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
    const avgLng = points.reduce((sum, p) => sum + p.lng, 0) / points.length;
  
    const zoom = 12;
    const style = 'light-v10';
  
    return `https://api.mapbox.com/styles/v1/mapbox/${style}/static/${avgLng},${avgLat},${zoom}/${width}x${height}@2x?access_token=${token}`;
  }

export default function Heatmap({
  points,
  width = 800,
  height = 400,
  gridSize = 20,
}: Props) {
    const axisMargin = 50;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverInfo, setHoverInfo] = useState<{
    x: number;
    y: number;
    count: number;
    lat: number;
    lng: number;
  } | null>(null);

  const mapboxToken = 'pk.eyJ1IjoidHNodWtsYTIzIiwiYSI6ImNtZTBtcGp0bTA2cjIya3BybWhhMmpnZmkifQ.AJywdiqeAdCfjIDQphn2wg';
  const plotWidth = width - axisMargin;
  const plotHeight = height - axisMargin;
  const mapImageUrl = useMemo(() => getMapboxImageURL(points, plotWidth, plotHeight, mapboxToken), [points, plotWidth, plotHeight]);

  useEffect(() => {
    if (!points || points.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    
    const plotWidth = width - axisMargin;
    const plotHeight = height - axisMargin;

    ctx.clearRect(0, 0, width, height);

    // get lat/lng bounds
    const lats = points.map(p => p.lat);
    const lngs = points.map(p => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latRange = maxLat - minLat || 1;
    const lngRange = maxLng - minLng || 1;

    const cellWidth = plotWidth / gridSize;
    const cellHeight = plotHeight / gridSize;

    const grid: Record<string, { count: number; centerLat: number; centerLng: number }> = {};

    // Fill grid
    for (const point of points) {
      const x = Math.floor(((point.lng - minLng) / lngRange) * gridSize);
      const y = Math.floor(((maxLat - point.lat) / latRange) * gridSize); // flip Y

      const key = `${x},${y}`;
      if (!grid[key]) {
        const centerLng = minLng + ((x + 0.5) / gridSize) * lngRange;
        const centerLat = maxLat - ((y + 0.5) / gridSize) * latRange;
        grid[key] = { count: 0, centerLat, centerLng };
      }
      grid[key].count++;
    }

    const maxCount = Math.max(...Object.values(grid).map(cell => cell.count));

    // Draw cells
    for (const key in grid) {
      const [x, y] = key.split(',').map(Number);
      const { count } = grid[key];
      const intensity = count / maxCount;
      ctx.fillStyle = `rgba(255, 0, 0, ${intensity * 0.7})`;
      ctx.fillRect(
        axisMargin + x * cellWidth,
        y * cellHeight,
        cellWidth,
        cellHeight
      );
    }

    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.font = '10px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'right';


    // Y-axis (latitude)
    ctx.beginPath();
    ctx.moveTo(axisMargin, 0);
    ctx.lineTo(axisMargin, plotHeight);
    ctx.stroke();

    const latTicks = 5;
    for (let i = 0; i <= latTicks; i++) {
      const lat = minLat + (latRange * i) / latTicks;
      const y = plotHeight - (i * plotHeight) / latTicks;
      ctx.textAlign = 'right';
      ctx.fillText(lat.toFixed(3), axisMargin - 4, y);
    }

    // x-axis (longitude)
    ctx.beginPath();
    ctx.moveTo(axisMargin, plotHeight);
    ctx.lineTo(width, plotHeight);
    ctx.stroke();

    const lngTicks = 5;
    for (let i = 0; i <= lngTicks; i++) {
      const lng = minLng + (lngRange * i) / lngTicks;
      const x = axisMargin + (i * plotWidth) / lngTicks;
      ctx.fillText(lng.toFixed(3), x, plotHeight + 12);
    }

    // Labels
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Longitude', width / 2, height - 25);

    ctx.save();
    ctx.translate(15, plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Latitude', 0, -5);
    ctx.restore();

    // Hover logic
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const gx = Math.floor((mouseX - axisMargin) / cellWidth);
      const gy = Math.floor(mouseY / cellHeight);
      const key = `${gx},${gy}`;

      if (grid[key]) {
        const { count, centerLat, centerLng } = grid[key];
        setHoverInfo({ x: mouseX, y: mouseY, count, lat: centerLat, lng: centerLng });
      } else {
        setHoverInfo(null);
      }
    };

    const handleMouseLeave = () => setHoverInfo(null);

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [points, width, height, gridSize]);

  return (
    <div style={{ position: 'relative',  width, height: height + 50, borderRadius: 5, padding: 6  }}>
        {mapImageUrl && (
        <img
          src={mapImageUrl}
          alt="Map background"
          style={{
            position: 'absolute',
            top: 6,
            left: 6 + axisMargin,
            width: plotWidth,
            height: plotHeight,
            zIndex: 0,
            borderRadius: 4,
            opacity: 0.6,
          }}
        />
      )}
      <canvas 
      ref={canvasRef} 
      width={width} 
      height={height} 
      style={{
        position: 'absolute',
        top: 6,
        left: 6,
        zIndex: 1,
        pointerEvents: 'auto',
      }}
      />
      <div
        style={{
            position: 'absolute',
            top: height + 16,
            left: axisMargin + 6,
            width: plotWidth,
            height: 12,
            background: 'linear-gradient(to right, rgba(255, 238, 238, 0.8), rgba(255, 0, 0, 0.7))',
            borderRadius: 6,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 8px',
            zIndex: 2,
            fontSize: 11,
            fontWeight: 500,
            color: '#333',
            border: '1px solid rgba(0,0,0,0.1)',
        }}
    >
        <span>Low</span>
        <span>High</span>
    </div>
      {hoverInfo && (
        <div
          style={{
            position: 'absolute',
            left: hoverInfo.x + 10,
            top: hoverInfo.y + 10,
            background: 'white',
            border: '1px solid #ccc',
            borderRadius: 6,
            padding: '6px 8px',
            fontSize: 12,
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            pointerEvents: 'none',
          }}
        >
          <div><strong>Count:</strong> {hoverInfo.count}</div>
          <div><strong>Lat:</strong> {hoverInfo.lat.toFixed(5)}</div>
          <div><strong>Lng:</strong> {hoverInfo.lng.toFixed(5)}</div>
        </div>
      )}
    </div>
  );
}