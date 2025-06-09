import React, { useState } from "react";
import "./ScoreBar.css";

const ScoreBar = ({ score = 0.931 }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const scoreRanges = [
    {
      min: 0,
      max: 0.5,
      color: "#dc2626",
      level: "Level 4: Unfavorable Prerequisites",
      description:
        "Cease further assessment. Fundamental redesign or postponement recommended.",
    },
    {
      min: 0.5,
      max: 0.7,
      color: "#eab308",
      level: "Level 3: Conditionally Favorable Prerequisites",
      description:
        "Pause to address critical dimensions before further assessment. Substantial modifications required.",
    },
    {
      min: 0.7,
      max: 0.9,
      color: "#a3e635",
      level: "Level 2: Generally Favorable Prerequisites",
      description:
        "Continue assessment while addressing identified weaknesses. Moderate adjustments recommended.",
    },
    {
      min: 0.9,
      max: 1.0,
      color: "#16a34a",
      level: "Level 1: Highly Favorable Prerequisites",
      description:
        "Proceed with detailed assessment and implementation planning. Minimal adjustments needed.",
    },
  ];

  const getScorePosition = () => score * 100;

  return (
    <div className="score-bar-container">
      <div className="bar-container">
        <div className="score-bar">
          {scoreRanges.map((s, i) => (
            <div
              key={i}
              className="score-section"
              style={{
                backgroundColor: s.color,
                width: `${(s.max - s.min) * 100}%`,
                position: "relative", // anchor for tooltip
              }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {hoveredIdx === i && (
                <div
                  className="tooltip"
                  style={{
                    left: "50%",
                    top: 0,
                    transform: "translate(calc(-50% + 10px), -110%)", // +10px nudges right
                  }}
                >
                  <div className="tooltip-title">{s.level}</div>
                  <div className="tooltip-description">{s.description}</div>
                  <div className="tooltip-range">
                    Score Range: {s.min} ≤ score {"<"} {s.max}
                  </div>
                  <div className="tooltip-arrow"></div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div
          className="arrow-container"
          style={{ left: `${getScorePosition()}%` }}
        >
          <div className="score-display">{score.toFixed(3)}</div>
          <div className="arrow"></div>
          <div className="arrow-line"></div>
        </div>
      </div>

      <div className="score-labels">
        <span>0.0</span>
        <span>0.5</span>
        <span>0.7</span>
        <span>0.9</span>
        <span>1.0</span>
      </div>
    </div>
  );
};

export default ScoreBar;
