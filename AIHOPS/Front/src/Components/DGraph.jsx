import React, { useState, useEffect, useRef } from "react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import "./DGraph.css";
import { Card, CardHeader, CardDescription, CardContent } from "./ui/card";
import { getMemberVoteOnProject } from "../api/ProjectApi";

const DGraph = ({ onVoteComplete, projectId }) => {
  const [severityLevels] = useState([
    {
      level: 1,
      name: "No to Negligible",
      value: 0.5,
      color: "#4ade80",
      description:
        "No noticeable effects on operations. Recovery is either unnecessary or instantaneous.",
    },
    {
      level: 2,
      name: "Minor",
      value: 1,
      color: "#fbbf24",
      description:
        "Small impacts causing slight disruptions that can be resolved with minimal effort.",
    },
    {
      level: 3,
      name: "Manageable",
      value: 25,
      color: "#fb923c",
      description:
        "Moderate impacts requiring resources and temporary adjustments to restore operations.",
    },
    {
      level: 4,
      name: "Severe",
      value: 100,
      color: "#f87171",
      description:
        "Substantial impacts disrupting core activities significantly.",
    },
    {
      level: 5,
      name: "Catastrophic",
      value: 400,
      color: "#ef4444",
      description:
        "Extensive disruption, likely overwhelming available resources.",
    },
  ]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [percentages, setPercentages] = useState(Array(5).fill(0));
  const [chartData, setChartData] = useState([]);
  const [selectedDot, setSelectedDot] = useState(null);
  const [hoveredLevel, setHoveredLevel] = useState(null);
  // Add debounce timer ref to fix laggy hover behavior
  const hoverTimerRef = useRef(null);

  const chartRef = useRef(null);
  const dragStateRef = useRef({
    isDragging: false,
    activeIndex: -1,
    startY: 0,
    startPercentage: 0,
    chartHeight: 0,
  });

  const theme = localStorage.getItem("theme") || "light";
  const textColor = theme === "light" ? "#333" : "#fff";

  useEffect(() => {
    if (projectId != null) loadData();
  }, [projectId]);

  const loadData = async () => {
    setLoading(true);
    try {
      await fetchPreviousVotes();
    } catch (error) {
      console.error("Error loading severity factors:", error);
      setError("Failed to load data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const newChartData = severityLevels.map((level, index) => ({
      name: `Level ${level.level}`,
      percentage: percentages[index],
      color: level.color,
      level: level.name,
      description: level.description,
      levelIndex: index,
    }));
    setChartData(newChartData);
  }, [percentages, severityLevels]);

  const fetchPreviousVotes = async () => {
    try {
      const response = await getMemberVoteOnProject(projectId);
      if (response.data.success) {
        const votes = response.data.votes;
        const severityVotes = votes.severity_votes || [];

        if (votes && severityVotes.length > 0 && Array.isArray(severityVotes)) {
          setPercentages(severityVotes);
          setHasVoted(true);
        } else {
          setPercentages([20, 20, 20, 20, 20]);
          setHasVoted(false);
        }
      } else {
        setError("Failed to fetch votes");
      }
    } catch (error) {
      console.error("Error fetching votes:", error);
      setError("Failed to connect to server");
    }
  };

  // Set up drag handlers
  useEffect(() => {
    const handleMouseDown = (e) => {
      if (e.target.tagName === "circle") {
        const index = parseInt(e.target.getAttribute("data-index"));
        if (!isNaN(index)) {
          e.preventDefault();
          const container = chartRef.current;
          if (!container) return;

          const containerRect = container.getBoundingClientRect();
          const availableHeight = containerRect.height - 150;

          dragStateRef.current = {
            isDragging: true,
            activeIndex: index,
            startY: e.clientY,
            startPercentage: percentages[index],
            chartHeight: availableHeight,
          };

          document.body.classList.add("no-select");
        }
      }
    };

    const handleMouseMove = (e) => {
      const { isDragging, activeIndex, startY, startPercentage, chartHeight } =
        dragStateRef.current;
      if (!isDragging || activeIndex === -1 || chartHeight === 0) return;

      const sensitivity = 0.8;
      const deltaY = startY - e.clientY;
      const percentageDelta = (deltaY / chartHeight) * 100 * sensitivity;
      const newPercentage = Math.min(
        100,
        Math.max(0, Math.round(startPercentage + percentageDelta))
      );

      const newPercentages = [...percentages];
      newPercentages[activeIndex] = newPercentage;
      setPercentages(newPercentages);
    };

    const handleMouseUp = () => {
      if (dragStateRef.current.isDragging) {
        dragStateRef.current.isDragging = false;
        dragStateRef.current.activeIndex = -1;
        document.body.classList.remove("no-select");
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.classList.remove("no-select");
    };
  }, [percentages]);

  const handlePercentageChange = (index, value) => {
    const newValue = Math.min(100, Math.max(0, Number(value) || 0));
    const newPercentages = [...percentages];
    newPercentages[index] = newValue;
    setPercentages(newPercentages);
  };

  const handleSubmit = async () => {
    if (Math.abs(totalPercentage - 100) > 0.1) {
      alert("Percentages must sum to 100%");
      return;
    }
    try {
      await onVoteComplete(percentages);
    } catch (error) {
      alert("Failed to submit votes");
    }
  };

  const handleResetPercentages = () => {
    setPercentages([20, 20, 20, 20, 20]);
  };

  // Add functions to handle hover with debouncing
  const handleLevelMouseEnter = (index) => {
    // Clear any existing timer
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }

    // Set a short delay to prevent flickering
    hoverTimerRef.current = setTimeout(() => {
      setHoveredLevel(index);
    }, 50);
  };

  const handleLevelMouseLeave = () => {
    // Clear any existing timer
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }

    // Add a small delay before hiding the tooltip
    hoverTimerRef.current = setTimeout(() => {
      setHoveredLevel(null);
    }, 50);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  const totalPercentage = percentages.reduce((sum, p) => sum + p, 0);

  // Improved custom tooltip with fixed positioning relative to chart container
  const CustomTooltip = () => {
    if (
      (!selectedDot && hoveredLevel === null) ||
      dragStateRef.current.isDragging
    )
      return null;

    // Display the tooltip based on either the selected dot or hovered level
    const levelIndex = selectedDot ? selectedDot.index : hoveredLevel;
    const data = chartData[levelIndex];

    if (!data) return null;

    // Calculate position based on level index
    // Each level takes up 1/5 of the chart width
    const levelPosition = ((levelIndex + 0.5) / chartData.length) * 100;

    return (
      <div
        className="custom-tooltip-container"
        style={{
          left: `${levelPosition + 2}%`,
          top: "100px",
        }}
      >
        <div className="custom-tooltip">
          <h4 className="tooltip-title">{data.level}</h4>
          <div className="tooltip-content">
            <div>
              <u>Percentage</u>: {data.percentage.toFixed(1)}%
            </div>
          </div>
          <div className="tooltip-description">{data.description}</div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="severity-card">
        <CardContent className="loading-spinner">
          <div className="loading-text">Loading severity factors...</div>
          <div className="spinner"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="severity-card">
        <CardContent>
          <div className="error-message">
            <div className="error-title">Error loading severity factors</div>
            <div className="error-details">{error}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!Array.isArray(severityLevels) || severityLevels.length === 0) {
    return (
      <Card className="severity-card">
        <CardHeader className="text-center">
          <CardDescription>No Severity Factors Found</CardDescription>
          <CardDescription>
            Please contact the project owner to set up severity factors.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="severity-card">
      <CardHeader className="text-center severity-card-header">
        <CardDescription
          style={{
            color: textColor,
            fontSize: "1rem",
            fontWeight: "500",
            marginBottom: "-1.5rem",
          }}
        >
          Allocate probability percentages across severity levels
          <br />
          <span style={{ fontSize: "0.9rem", opacity: 0.85 }}>
            <b>(Total must be 100%)</b>
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="compact-card-content">
        <div
          className="severity-graph"
          ref={chartRef}
          style={{ marginBottom: "-2.5%" }}
        >
          <CustomTooltip />
          <ResponsiveContainer width="100%" height={360}>
            <ComposedChart
              data={chartData}
              margin={{ top: 0, right: 40, left: 30, bottom: 15 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#eaeaea" />
              <XAxis
                dataKey="name"
                interval={0}
                axisLine={false}
                tickLine={false}
                height={110}
                padding={{ left: 30, right: 30 }}
                tick={(props) => {
                  const { x, y, index } = props;
                  const level = severityLevels[index];

                  return (
                    <g transform={`translate(${x},${y})`}>
                      {/* Colored level badge */}
                      <foreignObject x="-40" y="5" width="80" height="45">
                        <div
                          className="x-axis-badge"
                          style={{ backgroundColor: level.color }}
                          onMouseEnter={() => handleLevelMouseEnter(index)}
                          onMouseLeave={() => handleLevelMouseLeave()}
                        >
                          Level {level.level}
                        </div>
                      </foreignObject>

                      {/* Percentage input */}
                      <foreignObject x="-35" y="60" width="8%" height="32">
                        <div className="input-group-chart">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={percentages[index]}
                            onChange={(e) =>
                              handlePercentageChange(index, e.target.value)
                            }
                            style={{ width: "100%" }}
                          />
                          <span>%</span>
                        </div>
                      </foreignObject>
                    </g>
                  );
                }}
              />
              <YAxis
                yAxisId="left"
                orientation="left"
                domain={[0, 100]}
                label={{
                  value: "Percentage %",
                  angle: -90,
                  position: "insideLeft",
                  fill: textColor,
                  dy: 40,
                  fontSize: 12,
                }}
                style={{ fontFamily: "Verdana, sans-serif" }}
                tick={{ fill: textColor }}
                tickCount={5}
              />
              <Tooltip
                content={() => null} // Using custom tooltip outside chart
              />
              <Legend wrapperStyle={{ bottom: -15 }} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="percentage"
                stroke="#2563eb"
                strokeWidth={3}
                name="Percentage"
                isAnimationActive={false}
                dot={(props) => {
                  const { cx, cy, index } = props;
                  const isDragging =
                    dragStateRef.current.isDragging &&
                    dragStateRef.current.activeIndex === index;
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isDragging ? 8 : 6}
                      fill="#2563eb"
                      stroke="#fff"
                      strokeWidth={isDragging ? 3 : 2}
                      style={{ cursor: isDragging ? "grabbing" : "grab" }}
                      data-index={index}
                    />
                  );
                }}
                activeDot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {Math.abs(totalPercentage - 100) > 0.1 && (
          <div className="percentage-alert">
            <div className="alert-content">
              <span>
                Current total: <b>{totalPercentage}%</b> (Need 100%)
              </span>
            </div>
            <div className="alert-bar">
              <div
                className="alert-progress"
                style={{
                  width: `${Math.min(totalPercentage, 100)}%`,
                  backgroundColor:
                    totalPercentage > 100 ? "#ef4444" : "#3b82f6",
                }}
              />
            </div>
          </div>
        )}

        <div className="action-buttons">
          <button className="reset-button" onClick={handleResetPercentages}>
            Reset
          </button>
          <button
            className="submit-button"
            disabled={Math.abs(totalPercentage - 100) > 0.1}
            onClick={handleSubmit}
          >
            Submit Votes
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DGraph;
