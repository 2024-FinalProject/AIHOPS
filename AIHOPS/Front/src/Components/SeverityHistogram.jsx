import React, { useState } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import "./SeverityHistogram.css";

const SeverityHistogram = ({ severityfactors, severityfactorsValues }) => {
  const theme = localStorage.getItem("theme") || "light";
  const textColor = theme === "light" ? "#333" : "#fff";
  const backgroundColor = "transparent";

  // Prepare data
  const severityLevels = [
    {
      level: 1,
      name: "No to Negligible Damage",
      value: severityfactorsValues[0],
      color: "#4ade80",
      description: "No noticeable effects on operations.",
    },
    {
      level: 2,
      name: "Minor Damage",
      value: severityfactorsValues[1],
      color: "#fbbf24",
      description: "Slight disruptions resolved with minimal effort.",
    },
    {
      level: 3,
      name: "Manageable Damage",
      value: severityfactorsValues[2],
      color: "#fb923c",
      description: "Moderate effects requiring temporary adjustments.",
    },
    {
      level: 4,
      name: "Severe Damage",
      value: severityfactorsValues[3],
      color: "#f87171",
      description: "Substantial impacts disrupting core activities.",
    },
    {
      level: 5,
      name: "Catastrophic Damage",
      value: severityfactorsValues[4],
      color: "#ef4444",
      description: "Extensive disruption overwhelming resources.",
    },
  ];

  const data = (severityfactors?.avg || []).map((value, index) => ({
    name: `Level ${index + 1}`,
    average: value,
    level: severityLevels[index].name,
    weightFactor: severityLevels[index].value,
    description: severityLevels[index].description,
    color: severityLevels[index].color,
    weightedScore: (value * severityLevels[index].value).toFixed(2),
  }));

  // Tooltip state
  const [tooltipState, setTooltipState] = useState({
    active: false,
    payload: [],
    coordinate: { x: 0, y: 0 },
  });

  const handleDotEnter = (dotProps) => {
    const { cx, cy, payload } = dotProps;
    setTooltipState({
      active: true,
      payload: [{ payload }],
      coordinate: { x: cx, y: cy },
    });
  };

  const handleDotLeave = () =>
    setTooltipState((state) => ({ ...state, active: false }));

  // Custom dot renderer with larger radius and tooltip handlers
  const renderCustomDot = (props) => {
    const { cx, cy } = props;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={7}
        fill="#2563eb"
        onMouseEnter={() => handleDotEnter(props)}
        onMouseLeave={handleDotLeave}
        style={{ cursor: "pointer" }}
      />
    );
  };

  // Compact Tooltip component with readable fonts
  const CustomTooltip = ({ active, payload, coordinate }) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    const avg = data.average.toFixed(2);
    return (
      <div
        className="custom-tooltip"
        style={{
          position: "absolute",
          left: `${coordinate.x + 85}px`,
          top: `${coordinate.y}px`,
          backgroundColor: theme === "light" ? "#fff" : "#222",
          color: textColor,
          padding: "8px",
          borderRadius: "4px",
          fontSize: "12px",
          width: "200px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          zIndex: 1000,
        }}
      >
        <h4 style={{ margin: "0 0 6px", fontSize: "12.5px" }}>{data.level}</h4>
        <p style={{ margin: "2px 0", fontSize: "12px" }}>{data.description}</p>
        <p style={{ margin: "6px 0", fontSize: "12px" }}>
          <b>Avg:</b> {avg} × <b>{data.weightFactor}</b> = {data.weightedScore}
        </p>
      </div>
    );
  };

  const maxValue = Math.max(...data.map((item) => item.average)) * 1.2;
  const yAxisTicks = [
    0,
    maxValue * 0.25,
    maxValue * 0.5,
    maxValue * 0.75,
    maxValue,
  ];

  return (
    <div
      style={{
        width: "80%",
        height: "345px",
        margin: "0 auto",
        backgroundColor,
        fontFamily: "Verdana, sans-serif",
      }}
    >
      <ResponsiveContainer>
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 30, left: 40, bottom: 30 }}
          barSize={30}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={theme === "light" ? "#e5e7eb" : "#444"}
          />
          <XAxis
            dataKey="name"
            height={100}
            interval={0}
            tick={{ fill: textColor }}
            label={{
              value: "Severity Levels",
              position: "insideBottom",
              offset: 0,
              fontSize: 15,
              fill: textColor,
              fontWeight: "bold",
              dy: -40,
            }}
          />
          <YAxis
            domain={[0, maxValue]}
            ticks={yAxisTicks}
            tickFormatter={(v) => v.toFixed(2)}
            tick={{ fill: textColor, fontSize: 11 }}
            label={{
              value: "Average Score",
              angle: -90,
              position: "outsideLeft",
              fontSize: 15,
              fill: textColor,
              fontWeight: "bold",
              dx: -30,
            }}
          />

          {/* Bars with quicker animation */}
          <Bar
            dataKey="average"
            radius={[2, 2, 0, 0]}
            isAnimationActive={true}
            animationDuration={500}
          >
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.color}
                style={{ pointerEvents: "none" }}
              />
            ))}
          </Bar>

          {/* Line with faster animation and larger dots */}
          <Line
            type="monotone"
            dataKey="average"
            stroke="#2563eb"
            strokeWidth={2}
            dot={renderCustomDot}
            activeDot={false}
            isAnimationActive={true}
            animationDuration={500}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Render tooltip only on dot hover */}
      {tooltipState.active && (
        <CustomTooltip
          active={tooltipState.active}
          payload={tooltipState.payload}
          coordinate={tooltipState.coordinate}
        />
      )}
    </div>
  );
};

export default SeverityHistogram;
