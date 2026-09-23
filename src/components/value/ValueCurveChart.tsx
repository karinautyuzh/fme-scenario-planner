import React from 'react';
import { ValueCurvePoint } from '../../engine/types';

const SCENARIO_COLORS = ['#0066B3', '#0099A8', '#7C3AED'];

interface CurveData {
  label: string;
  points: ValueCurvePoint[];
  colorIndex: number;
  separate?: boolean;
}

interface ValueCurveChartProps {
  curves: CurveData[];
  showSeparate?: boolean;
}

const PAD = { top: 30, right: 40, bottom: 50, left: 72 };
const W = 800;
const H = 300;
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;
const YEARS = Array.from({ length: 10 }, (_, i) => 2026 + i);

function xFor(year: number) {
  return PAD.left + ((year - 2026) / 9) * PLOT_W;
}

function buildPath(points: (number | null)[], maxVal: number): string {
  const coords = points
    .map((v, i) => {
      if (v === null) return null;
      const x = xFor(2026 + i);
      const y = PAD.top + (1 - v / maxVal) * PLOT_H;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .filter(Boolean);
  if (coords.length === 0) return '';
  return 'M ' + coords.join(' L ');
}

export default function ValueCurveChart({ curves, showSeparate = true }: ValueCurveChartProps) {
  // Collect all non-null values to determine y-axis range
  const allValues: number[] = [];
  for (const curve of curves) {
    for (const pt of curve.points) {
      if (pt.integratedCumulative !== null) allValues.push(pt.integratedCumulative);
      if (showSeparate && pt.separateCumulative !== null) allValues.push(pt.separateCumulative);
    }
  }

  const maxVal = allValues.length > 0 ? Math.ceil(Math.max(...allValues) * 1.15) : 100;
  const hasData = allValues.length > 0 && maxVal > 0;

  // Y-axis gridlines: 5 divisions
  const yTicks = Array.from({ length: 6 }, (_, i) => (i / 5) * maxVal);

  return (
    <div style={{ position: 'relative' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        aria-label="Cumulative value realization curve"
      >
        {/* Grid lines */}
        {yTicks.map((tick) => {
          const y = PAD.top + (1 - tick / maxVal) * PLOT_H;
          return (
            <g key={tick}>
              <line
                x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
                stroke="#E5EBF0" strokeWidth="1"
              />
              <text
                x={PAD.left - 8} y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="#8FA3B8"
                fontFamily="Inter, sans-serif"
              >
                {tick === 0 ? '€0' : `€${tick >= 1000 ? `${(tick / 1000).toFixed(0)}B` : `${tick}M`}`}
              </text>
            </g>
          );
        })}

        {/* X-axis year labels */}
        {YEARS.map((yr) => (
          <text
            key={yr}
            x={xFor(yr)}
            y={H - PAD.bottom + 18}
            textAnchor="middle"
            fontSize="10"
            fill="#8FA3B8"
            fontFamily="Inter, sans-serif"
          >
            {yr}
          </text>
        ))}

        {/* Vertical year ticks */}
        {YEARS.map((yr) => (
          <line
            key={`tick-${yr}`}
            x1={xFor(yr)} y1={PAD.top + PLOT_H}
            x2={xFor(yr)} y2={PAD.top + PLOT_H + 5}
            stroke="#C8D6E0" strokeWidth="1"
          />
        ))}

        {/* Axis border */}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + PLOT_H} stroke="#C8D6E0" strokeWidth="1" />
        <line x1={PAD.left} y1={PAD.top + PLOT_H} x2={W - PAD.right} y2={PAD.top + PLOT_H} stroke="#C8D6E0" strokeWidth="1" />

        {hasData ? (
          <>
            {curves.map((curve, ci) => {
              const color = SCENARIO_COLORS[curve.colorIndex % SCENARIO_COLORS.length];
              const intPts = curve.points.map((p) => p.integratedCumulative);
              const sepPts = curve.points.map((p) => p.separateCumulative);
              const intPath = buildPath(intPts, maxVal);
              const sepPath = buildPath(sepPts, maxVal);

              // End point for label
              const lastInt = intPts[intPts.length - 1];
              const endX = xFor(2035);
              const endY = lastInt !== null ? PAD.top + (1 - lastInt / maxVal) * PLOT_H : null;

              return (
                <g key={curve.label}>
                  {/* Separate line (dashed, same color but lighter) */}
                  {showSeparate && sepPath && (
                    <path
                      d={sepPath}
                      fill="none"
                      stroke={color}
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                      opacity="0.45"
                    />
                  )}
                  {/* Integrated line */}
                  {intPath && (
                    <path
                      d={intPath}
                      fill="none"
                      stroke={color}
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                    />
                  )}
                  {/* End dot */}
                  {endY !== null && (
                    <circle cx={endX} cy={endY} r="4" fill={color} />
                  )}
                  {/* Scenario label at end */}
                  {endY !== null && (
                    <text
                      x={endX + 6}
                      y={endY + 4}
                      fontSize="10"
                      fill={color}
                      fontFamily="Inter, sans-serif"
                      fontWeight="600"
                    >
                      {curve.label.length > 14 ? curve.label.slice(0, 12) + '…' : curve.label}
                    </text>
                  )}
                </g>
              );
            })}
          </>
        ) : (
          <text
            x={W / 2}
            y={H / 2}
            textAnchor="middle"
            fontSize="13"
            fill="#A8B8CC"
            fontFamily="Inter, sans-serif"
            fontStyle="italic"
          >
            Enter financial baseline inputs to generate value curves
          </text>
        )}
      </svg>

      {/* Legend */}
      {hasData && (
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 8, paddingLeft: PAD.left + 'px' }}>
          {curves.map((curve, ci) => {
            const color = SCENARIO_COLORS[curve.colorIndex % SCENARIO_COLORS.length];
            return (
              <div key={curve.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--grey-3)' }}>
                <svg width="20" height="10">
                  <line x1="0" y1="5" x2="20" y2="5" stroke={color} strokeWidth="2.5" />
                </svg>
                {curve.label} (integrated)
                {showSeparate && (
                  <>
                    <svg width="20" height="10" style={{ marginLeft: 4 }}>
                      <line x1="0" y1="5" x2="20" y2="5" stroke={color} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.45" />
                    </svg>
                    separate
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
