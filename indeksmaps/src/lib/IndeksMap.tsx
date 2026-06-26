import React, { useMemo, useState, useRef } from "react";
import type { MouseEvent, WheelEvent } from "react";
import type { GeoJSONFeatureCollection, GeoJSONFeature } from "./types";
import { getBounds, makeProjection } from "./projection";
import { geometryToPath, simpleCentroid } from "./geometry";
import { colorFor, hexToRgb } from "./color";

export interface IndeksMapProps {
  data: GeoJSONFeatureCollection;
  width?: number;
  height?: number;
  padding?: number;
  
  // Default Styles
  defaultFill?: string;
  strokeColor?: string;
  strokeWidth?: number;
  
  // Interaction Styles
  hoverFill?: string;
  hoverStroke?: string;
  hoverStrokeWidth?: number;
  selectedFill?: string;
  selectedStroke?: string;
  selectedStrokeWidth?: number;
  
  // State and Callbacks
  selectedFeature?: GeoJSONFeature | null;
  selectedFeatures?: GeoJSONFeature[] | null;
  onFeatureClick?: (feature: GeoJSONFeature) => void;
  onFeatureHover?: (feature: GeoJSONFeature | null) => void;
  
  // Choropleth Mapping
  choroplethField?: string;
  choroplethColorFrom?: string; // hex
  choroplethColorTo?: string;   // hex
  customMinMax?: { min: number; max: number };
  
  // Extra features
  enableZoomPan?: boolean;
  showLabels?: boolean;
  labelField?: string | ((feature: GeoJSONFeature) => string);
  labelColor?: string;
  labelSize?: number;
  
  // Tooltip
  renderTooltip?: (feature: GeoJSONFeature) => React.ReactNode;
}

export const IndeksMap: React.FC<IndeksMapProps> = ({
  data,
  width = 800,
  height = 500,
  padding = 24,
  defaultFill = "#f1f5f9",
  strokeColor = "#cbd5e1",
  strokeWidth = 1,
  hoverFill = "#bae6fd",
  hoverStroke = "#0284c7",
  hoverStrokeWidth = 1.5,
  selectedFill = "#7dd3fc",
  selectedStroke = "#0369a1",
  selectedStrokeWidth = 2,
  selectedFeature = null,
  selectedFeatures = null,
  onFeatureClick,
  onFeatureHover,
  choroplethField,
  choroplethColorFrom = "#dbeafe",
  choroplethColorTo = "#1e3a8b",
  customMinMax,
  enableZoomPan = true,
  showLabels = false,
  labelField = "NAME_1",
  labelColor = "#475569",
  labelSize = 10,
  renderTooltip
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  
  const project = useMemo(() => {
    const bounds = getBounds(data);
    return makeProjection(bounds, width, height, padding);
  }, [data, width, height, padding]);

  // Centroids for labels
  const centroids = useMemo(() => {
    return data.features.map(f => {
      const coord = simpleCentroid(f.geometry);
      const [x, y] = project(coord[0], coord[1]);
      return { id: getFeatureId(f), x, y, feature: f };
    });
  }, [data, project]);

  // Choropleth Min/Max calculations
  const choroplethMinMax = useMemo(() => {
    if (!choroplethField) return { min: 0, max: 0 };
    if (customMinMax) return customMinMax;

    let min = Infinity;
    let max = -Infinity;
    data.features.forEach(f => {
      const val = Number(f.properties[choroplethField]);
      if (!isNaN(val)) {
        if (val < min) min = val;
        if (val > max) max = val;
      }
    });
    if (min === Infinity) return { min: 0, max: 100 };
    return { min, max };
  }, [data, choroplethField, customMinMax]);

  // Hover & Tooltip State
  const [hoveredFeature, setHoveredFeature] = useState<GeoJSONFeature | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Zoom & Pan State
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Helper to extract identifier
  function getFeatureId(f: GeoJSONFeature): string {
    return f.properties.GID_4 || 
           f.properties.GID_3 || 
           f.properties.GID_2 || 
           f.properties.GID_1 || 
           f.properties.code ||
           (f.properties.NAME_1 && f.properties.NAME_2 && f.properties.NAME_3 && f.properties.NAME_4 
             ? `${f.properties.NAME_1}-${f.properties.NAME_2}-${f.properties.NAME_3}-${f.properties.NAME_4}` 
             : "") ||
           (f.properties.NAME_1 && f.properties.NAME_2 && f.properties.NAME_3 
             ? `${f.properties.NAME_1}-${f.properties.NAME_2}-${f.properties.NAME_3}` 
             : "") ||
           (f.properties.NAME_1 && f.properties.NAME_2 
             ? `${f.properties.NAME_1}-${f.properties.NAME_2}` 
             : "") ||
           f.properties.NAME_1 || 
           f.properties.name || 
           "";
  }

  // Handle Drag / Pan
  const handleMouseDown = (e: MouseEvent<SVGSVGElement>) => {
    if (!enableZoomPan) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
  };

  const handleMouseMove = (e: MouseEvent<SVGSVGElement>) => {
    if (isDragging && enableZoomPan) {
      setTransform(t => ({
        ...t,
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      }));
    }

    // Track mouse position in SVG coordinate system for tooltip
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - rect.left + 15,
        y: e.clientY - rect.top + 15
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom to Mouse Cursor
  const handleWheel = (e: WheelEvent<SVGSVGElement>) => {
    if (!enableZoomPan) return;
    e.preventDefault();
    
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newK = Math.min(20, Math.max(0.8, transform.k * zoomFactor));

    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Adjust transform.x and transform.y so the point under cursor remains in the same spot
      setTransform(t => {
        const x = mouseX - (mouseX - t.x) * (newK / t.k);
        const y = mouseY - (mouseY - t.y) * (newK / t.k);
        return { x, y, k: newK };
      });
    }
  };

  // Reset Zoom/Pan
  const resetViewport = () => {
    setTransform({ x: 0, y: 0, k: 1 });
  };

  const fromRgb = useMemo(() => hexToRgb(choroplethColorFrom), [choroplethColorFrom]);
  const toRgb = useMemo(() => hexToRgb(choroplethColorTo), [choroplethColorTo]);

  // Check if a feature is selected (supporting both single and multi select)
  const isFeatureSelected = (f: GeoJSONFeature): boolean => {
    if (selectedFeature && getFeatureId(selectedFeature) === getFeatureId(f)) {
      return true;
    }
    if (selectedFeatures && selectedFeatures.some(sf => getFeatureId(sf) === getFeatureId(f))) {
      return true;
    }
    return false;
  };

  // Determine fill color for feature
  const getFeatureColor = (f: GeoJSONFeature) => {
    const isSelected = isFeatureSelected(f);
    const isHovered = hoveredFeature && getFeatureId(hoveredFeature) === getFeatureId(f);

    if (isSelected) return selectedFill;
    if (isHovered) return hoverFill;

    // Support custom coloring per-province/region defined directly in GeoJSON properties
    const customColor = f.properties.fill || f.properties.color || f.properties.fillColor;
    if (customColor) return customColor;

    if (choroplethField) {
      const val = Number(f.properties[choroplethField]);
      if (!isNaN(val)) {
        return colorFor(val, choroplethMinMax.min, choroplethMinMax.max, fromRgb, toRgb);
      }
    }
    return defaultFill;
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        style={{
          backgroundColor: "#ffffff",
          cursor: isDragging ? "grabbing" : enableZoomPan ? "grab" : "default",
          userSelect: "none"
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
          {/* Paths (Polygons) */}
          {data.features.map((f, i) => {
            const pathData = geometryToPath(f.geometry, project);
            const featureId = getFeatureId(f) || `feature-${i}`;
            const isSelected = isFeatureSelected(f);
            const isHovered = hoveredFeature && getFeatureId(hoveredFeature) === featureId;

            return (
              <path
                key={featureId}
                d={pathData}
                fill={getFeatureColor(f)}
                stroke={isSelected ? selectedStroke : isHovered ? hoverStroke : strokeColor}
                strokeWidth={(isSelected ? selectedStrokeWidth : isHovered ? hoverStrokeWidth : strokeWidth) / transform.k}
                onMouseEnter={() => {
                  setHoveredFeature(f);
                  if (onFeatureHover) onFeatureHover(f);
                }}
                onMouseLeave={() => {
                  setHoveredFeature(null);
                  if (onFeatureHover) onFeatureHover(null);
                }}
                onClick={() => {
                  if (onFeatureClick) onFeatureClick(f);
                }}
                style={{ transition: "fill 0.15s ease, stroke 0.15s ease" }}
              />
            );
          })}

          {/* Labels layer (so labels sit above polygons) */}
          {showLabels &&
            centroids.map(c => {
              const labelText = typeof labelField === "function" 
                ? labelField(c.feature) 
                : (c.feature.properties[labelField] || c.feature.properties.name || "");
              
              if (!labelText) return null;

              return (
                <text
                  key={`label-${c.id}`}
                  x={c.x}
                  y={c.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={labelColor}
                  style={{
                    fontSize: `${labelSize / transform.k}px`,
                    pointerEvents: "none",
                    fontWeight: 600,
                    textShadow: "1px 1px 2px rgba(15, 23, 42, 0.95), -1px -1px 2px rgba(15, 23, 42, 0.95), 1px -1px 2px rgba(15, 23, 42, 0.95), -1px 1px 2px rgba(15, 23, 42, 0.95)"
                  }}
                >
                  {labelText}
                </text>
              );
            })}
        </g>
      </svg>

      {/* Floating Zoom Controls */}
      {enableZoomPan && (
        <div style={{ position: "absolute", bottom: 15, right: 15, display: "flex", flexDirection: "column", gap: 5 }}>
          <button
            onClick={() => setTransform(t => ({ ...t, k: Math.min(20, t.k * 1.2) }))}
            style={controlButtonStyle}
          >
            +
          </button>
          <button
            onClick={() => setTransform(t => ({ ...t, k: Math.max(0.8, t.k * 0.8) }))}
            style={controlButtonStyle}
          >
            −
          </button>
          <button
            onClick={resetViewport}
            style={{ ...controlButtonStyle, fontSize: "12px" }}
          >
            Fit
          </button>
        </div>
      )}

      {/* Tooltip Overlay */}
      {hoveredFeature && renderTooltip && (
        <div
          style={{
            position: "absolute",
            left: tooltipPos.x,
            top: tooltipPos.y,
            pointerEvents: "none",
            backgroundColor: "rgba(15, 23, 42, 0.95)",
            color: "#ffffff",
            padding: "8px 12px",
            borderRadius: "6px",
            fontSize: "12px",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
            zIndex: 50,
            border: "1px solid rgba(255, 255, 255, 0.1)"
          }}
        >
          {renderTooltip(hoveredFeature)}
        </div>
      )}
    </div>
  );
};

const controlButtonStyle: React.CSSProperties = {
  width: "32px",
  height: "32px",
  backgroundColor: "#ffffff",
  border: "1px solid #cbd5e1",
  borderRadius: "6px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "18px",
  fontWeight: "bold",
  color: "#334155",
  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
  userSelect: "none"
};
