// ============================================
// BaseGauge - Wiederverwendbare Gauge-Komponente
// ============================================

import React, { useMemo, useId } from 'react';
import type { GaugeProps, GaugeStatus, GaugeSize } from '../../types/dashboard.types';
import { COLORS } from '../../types/dashboard.types';
import { useTheme } from '../../hooks/useTheme';
import './gauges.css';

interface BaseGaugeProps extends GaugeProps {
  showNeedle?: boolean;
  showTicks?: boolean;
  tickInterval?: { major: number; minor: number };
  startAngle?: number;
  endAngle?: number;
  formatValue?: (value: number) => string;
  children?: React.ReactNode;
  className?: string;
}

const getViewBoxSize = (size: GaugeSize) => {
  switch (size) {
    case 'small': return 200;
    case 'medium': return 260;
    case 'large': return 320;
  }
};

const getTrackRadius = (size: GaugeSize) => {
  switch (size) {
    case 'small': return 70;
    case 'medium': return 95;
    case 'large': return 125;
  }
};

const getTickConfig = (size: GaugeSize) => {
  switch (size) {
    case 'small': return { outerRadius: 58, majorLength: 10, minorLength: 5, labelRadius: 42 };
    case 'medium': return { outerRadius: 78, majorLength: 14, minorLength: 7, labelRadius: 55 };
    case 'large': return { outerRadius: 105, majorLength: 18, minorLength: 9, labelRadius: 75 };
  }
};

const getNeedleConfig = (size: GaugeSize) => {
  const viewBox = getViewBoxSize(size);
  const center = viewBox / 2;
  switch (size) {
    case 'small': return { length: 45, width: 3, center };
    case 'medium': return { length: 65, width: 4, center };
    case 'large': return { length: 90, width: 5, center };
  }
};

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

function describeArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, radius, startAngle);
  const end = polarToCartesian(cx, cy, radius, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

const BaseGauge: React.FC<BaseGaugeProps> = ({
  value,
  maxValue,
  minValue = 0,
  warningThreshold,
  dangerThreshold,
  unit,
  label,
  size,
  accentColor,
  warningColor = COLORS.AMBER,
  dangerColor = COLORS.RED,
  showNeedle = true,
  showTicks = true,
  tickInterval = { major: 0, minor: 0 },
  startAngle = -135,
  endAngle = 135,
  formatValue,
  children,
  className = '',
}) => {
  const uniqueId = useId();
  const { isDark } = useTheme();
  const viewBox = getViewBoxSize(size);
  const center = viewBox / 2;
  const trackRadius = getTrackRadius(size);
  const tickConfig = getTickConfig(size);
  const needleConfig = getNeedleConfig(size);
  const totalAngle = endAngle - startAngle;
  
  const needleColors = isDark 
    ? { start: '#ffffff', mid: '#e0e0e0', end: '#a0a0a0' }
    : { start: '#2d3748', mid: '#4a5568', end: '#718096' };
  
  const hubColors = isDark
    ? { start: '#3a3a4a', end: '#1a1a24' }
    : { start: '#e0e5ec', end: '#c8cfd8' };
  
  const hubInnerColor = isDark ? '#1a1a24' : '#d4dae3';

  const status: GaugeStatus = useMemo(() => {
    if (dangerThreshold && value >= dangerThreshold) return 'danger';
    if (warningThreshold && value >= warningThreshold) return 'warning';
    return 'normal';
  }, [value, warningThreshold, dangerThreshold]);

  const progress = Math.min(Math.max((value - minValue) / (maxValue - minValue), 0), 1);
  const needleAngle = startAngle + progress * totalAngle;
  const arcLength = (totalAngle / 360) * 2 * Math.PI * trackRadius;
  const progressOffset = arcLength * (1 - progress);

  const currentColor = status === 'danger' ? dangerColor : status === 'warning' ? warningColor : accentColor;
  const currentGlow = status === 'danger' 
    ? 'rgba(255, 59, 92, 0.4)' 
    : status === 'warning' 
    ? 'rgba(255, 171, 0, 0.4)' 
    : accentColor.replace(')', ', 0.4)').replace('rgb', 'rgba');

  const ticks = useMemo(() => {
    if (!showTicks || tickInterval.minor === 0) return [];

    const tickElements: React.ReactElement[] = [];
    for (let val = minValue; val <= maxValue; val += tickInterval.minor) {
      const angle = startAngle + ((val - minValue) / (maxValue - minValue)) * totalAngle;
      const isMajor = tickInterval.major > 0 && (val - minValue) % tickInterval.major === 0;
      const isWarning = warningThreshold && val >= warningThreshold && (!dangerThreshold || val < dangerThreshold);
      const isDanger = dangerThreshold && val >= dangerThreshold;

      const tickLength = isMajor ? tickConfig.majorLength : tickConfig.minorLength;
      const outer = polarToCartesian(center, center, tickConfig.outerRadius, angle);
      const inner = polarToCartesian(center, center, tickConfig.outerRadius - tickLength, angle);

      let tickClass = 'gauge-tick';
      if (isMajor) tickClass += ' major';
      if (isDanger) tickClass += ' danger';
      else if (isWarning) tickClass += ' warning';

      tickElements.push(
        <line
          key={`tick-${val}`}
          x1={outer.x}
          y1={outer.y}
          x2={inner.x}
          y2={inner.y}
          className={tickClass}
        />
      );

      if (isMajor && tickInterval.major > 0) {
        const labelPos = polarToCartesian(center, center, tickConfig.labelRadius, angle);
        let labelClass = 'gauge-tick-label';
        if (isDanger) labelClass += ' danger';
        else if (isWarning) labelClass += ' warning';

        tickElements.push(
          <text
            key={`label-${val}`}
            x={labelPos.x}
            y={labelPos.y}
            className={labelClass}
          >
            {val}
          </text>
        );
      }
    }
    return tickElements;
  }, [showTicks, tickInterval, minValue, maxValue, startAngle, totalAngle, center, tickConfig, warningThreshold, dangerThreshold]);

  const displayValue = formatValue ? formatValue(value) : value.toFixed(value >= 100 ? 0 : 1);

  return (
    <div 
      className={`gauge-container ${size} ${className}`}
      style={{ '--current-glow': currentGlow } as React.CSSProperties}
    >
      <span className="gauge-title">{label}</span>
      
      <div className="gauge-svg-wrapper">
        <svg className="gauge-svg" viewBox={`0 0 ${viewBox} ${viewBox}`}>
          <defs>
            <linearGradient id={`progress-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={currentColor} />
              <stop offset="100%" stopColor={currentColor} stopOpacity={0.7} />
            </linearGradient>
            <linearGradient id={`needle-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={needleColors.start} />
              <stop offset="40%" stopColor={needleColors.mid} />
              <stop offset="100%" stopColor={needleColors.end} />
            </linearGradient>
            <radialGradient id={`hub-${uniqueId}`} cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor={hubColors.start} />
              <stop offset="100%" stopColor={hubColors.end} />
            </radialGradient>
          </defs>

          <circle
            className="gauge-outer-ring"
            cx={center}
            cy={center}
            r={center - 5}
          />

          <path
            className="gauge-track-bg"
            d={describeArc(center, center, trackRadius, startAngle, endAngle)}
          />

          <path
            className={`gauge-track-progress ${status}`}
            d={describeArc(center, center, trackRadius, startAngle, endAngle)}
            stroke={`url(#progress-${uniqueId})`}
            style={{
              strokeDasharray: arcLength,
              strokeDashoffset: progressOffset,
            }}
          />

          <g>{ticks}</g>

          {showNeedle && (
            <g
              className="gauge-needle-group"
              style={{
                transform: `rotate(${needleAngle}deg)`,
                transformOrigin: `${center}px ${center}px`,
              }}
            >
              <polygon
                className={`gauge-needle-glow ${status}`}
                points={`
                  ${center},${center - needleConfig.length - 5}
                  ${center - needleConfig.width},${center - 10}
                  ${center},${center + 8}
                  ${center + needleConfig.width},${center - 10}
                `}
                fill={currentColor}
              />
              <polygon
                className="gauge-needle"
                points={`
                  ${center},${center - needleConfig.length}
                  ${center - needleConfig.width + 1},${center - 8}
                  ${center},${center + 5}
                  ${center + needleConfig.width - 1},${center - 8}
                `}
                fill={`url(#needle-${uniqueId})`}
              />
            </g>
          )}

          <circle
            className="gauge-center-hub-outer"
            cx={center}
            cy={center}
            r={size === 'small' ? 10 : size === 'medium' ? 14 : 18}
            fill={`url(#hub-${uniqueId})`}
          />
          <circle
            className="gauge-center-hub-inner"
            cx={center}
            cy={center}
            r={size === 'small' ? 7 : size === 'medium' ? 10 : 13}
            fill={hubInnerColor}
          />
          <circle
            className="gauge-center-hub-dot"
            cx={center}
            cy={center}
            r={size === 'small' ? 3 : size === 'medium' ? 4 : 5}
            fill={currentColor}
            style={{
              filter: `drop-shadow(0 0 ${size === 'small' ? 4 : 8}px ${currentGlow})`,
            }}
          />
        </svg>

        <div className="gauge-digital-display">
          <div className={`gauge-value ${status}`} style={{ color: currentColor }}>
            {displayValue}
          </div>
          <div className="gauge-unit">{unit}</div>
        </div>
      </div>

      <div className={`gauge-status-badge ${status}`}>
        {status === 'danger' ? 'Kritisch' : status === 'warning' ? 'Hoch' : 'Normal'}
      </div>

      {children}

      {(status === 'warning' || status === 'danger') && (
        <div className={`gauge-warning-alert ${status} visible`}>
          <div className="gauge-warning-dot" />
          <span className="gauge-warning-text">
            {status === 'danger' ? 'Kritisch!' : 'Warnung'}
          </span>
        </div>
      )}
    </div>
  );
};

export default BaseGauge;
