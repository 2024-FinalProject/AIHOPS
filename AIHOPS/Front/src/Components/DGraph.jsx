import React, { useState, useEffect, useRef } from 'react';
import { ComposedChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Bar, Cell } from 'recharts';
import './DGraph.css';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { getProjectSeverityFactors, getMemberVoteOnProject } from "../api/ProjectApi";

const DGraph = ({ onVoteComplete, projectId }) => {
  const [severityLevels, setSeverityLevels] = useState( [
    { level: 1, name: "No to Negligible Damage", value: 0.5, color: "#4ade80", 
      description: "No noticeable effects on operations. Recovery is either unnecessary or instantaneous without any resource involvement." },
    { level: 2, name: "Minor Damage", value: 1, color: "#fbbf24",
      description: "Impacts are small, causing slight disruptions that can be resolved with minimal effort or resources." },
    { level: 3, name: "Manageable Damage", value: 25, color: "#fb923c",
      description: "Impacts are moderate, requiring resources and temporary adjustments to restore normal operations." },
    { level: 4, name: "Severe Damage", value: 100, color: "#f87171",
      description: "Impacts are substantial, disrupting core activities significantly." },
    { level: 5, name: "Catastrophic Damage", value: 400, color: "#ef4444",
      description: "Impacts result in extensive disruption, likely overwhelming available resources." }
  ]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);

  const [percentages, setPercentages] = useState(Array(5).fill(0));
  const [weightedValues, setWeightedValues] = useState([]);
  const [selectedDot, setSelectedDot] = useState(null);
  const chartRef = useRef(null);
  const dragStateRef = useRef({
    isDragging: false,
    activeIndex: -1,
    startY: 0,
    startPercentage: 0,
    chartHeight: 0
  });
  const theme = localStorage.getItem('theme') || 'light';
  const textColor = theme === 'light' ? '#333' : '#fff';

  useEffect(() => {
    if(projectId != null)
      loadData();
  }, [projectId]);

  const loadData = async () => {
    setLoading(true);
    try {
      await getSeverityFactors();
      await fetchPreviousVotes();
    } catch (error) {
      console.error("Error loading severity factors:", error);
      setMsg("An error occurred. Please try again later.");
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const newWeightedValues = severityLevels.map((level, index) => ({
      name: `Level ${level.level}`,
      percentage: percentages[index],
      weightedValue: (percentages[index] / 100) * level.value,
      color: level.color,
      level: level.name,
      description: level.description,
      levelIndex: index
    }));
    setWeightedValues(newWeightedValues);
  }, [percentages, severityLevels]);

  const fetchPreviousVotes = async () => {
    const authToken = localStorage.getItem('authToken');
    if(!authToken) {
      console.error("No authentication token found. Please log in again.");
      return;
    }
    try {
      console.log("Fetching previous votes for project:", projectId);
      const response = await getMemberVoteOnProject(authToken, projectId);

      if(response.data.success) {
        console.log("Previous votes found:", response.data.votes);
        const votes = response.data.votes;
        const severityVotes = votes.severity_votes || [];
        if(votes && severityVotes.length > 0 && Array.isArray(severityVotes)) {
          console.log("Setting previous votes:", severityVotes);
          setPercentages(severityVotes);
          setHasVoted(true);
        } else {
          console.log("No previous votes found.");
          setPercentages([20, 20, 20, 20, 20]);
          setHasVoted(false);
        }
      } else {
        console.error("Failed to fetch previous votes:", response.data.message);
        setMsg("An error occurred. Please try again later.");
        setIsSuccess(false);
      }
    } catch(error) {
      console.error("Error fetching previous votes:", error);
      setMsg("An error occurred. Please try again later.");
      setIsSuccess(false);
    }
  };

  const getSeverityFactors = async () => {
    const authToken = localStorage.getItem('authToken');
    if(!authToken) {
      setMsg("No authentication token found. Please log in again.");
      setIsSuccess(false);
      setLoading(false);
      return;
    }
    try{
      console.log("Calling getProjectSeverityFactors with:", authToken, projectId);
      let response = await getProjectSeverityFactors(authToken, projectId);
      console.log("Response from getProjectSeverityFactors:", response);
      if(response.data.success) {
        if(Array.isArray(response.data.severityFactors) && response.data.severityFactors.length > 0) {
          console.log("Severity factors found:", response.data.severityFactors);
          const defaultLevels = [
            {
              level: 1,
              name: "No to Negligible Damage",
              value: 0.5,
              color: "#4ade80",
              description: "No noticeable effects on operations. Recovery is either unnecessary or instantaneous without any resource involvement."
            },
            {
              level: 2,
              name: "Minor Damage",
              value: 1,
              color: "#fbbf24",
              description: "Impacts are small, causing slight disruptions that can be resolved with minimal effort or resources."
            },
            {
              level: 3,
              name: "Manageable Damage",
              value: 25,
              color: "#fb923c",
              description: "Impacts are moderate, requiring resources and temporary adjustments to restore normal operations."
            },
            {
              level: 4,
              name: "Severe Damage",
              value: 100,
              color: "#f87171",
              description: "Impacts are substantial, disrupting core activities significantly."
            },
            {
              level: 5,
              name: "Catastrophic Damage",
              value: 400,
              color: "#ef4444",
              description: "Impacts result in extensive disruption, likely overwhelming available resources."
            }
          ]
        console.log("Severity factors from response:", response.data.severityFactors);
        response.data.severityFactors.forEach((factor, index) => {
          if(index >= defaultLevels.length) return;
          defaultLevels[index].value = factor;
        });
        console.log("Updated severity factors:", defaultLevels);
        setSeverityLevels(defaultLevels);

        if(percentages.every(p => p === 0)) {
          setPercentages([20, 20, 20, 20, 20]);
        }
      } else {
        console.error("Invalid severity factors data:", response.data.severityFactors);
        setError("The API returned invalid severity factors data.");
      }
    } else {
      console.error("Failed to fetch severity factors:", response.data.message);
      setError(response.data.message || "An error occurred. Please try again later.");
      setMsg("An error occurred. Please try again later.");
      setIsSuccess(false);
    }
    }
    catch(error) {  
      console.error("Error fetching severity factors:", error);
      setMsg("An error occurred. Please try again later.");
      setIsSuccess(false);
      alert(error);
    }
    finally{
      setLoading(false);
    }
  };

  // Set up drag handlers
  useEffect(() => {
    const handleMouseDown = (e) => {
      // Check if this is a dot - look for circle elements
      if (e.target.tagName === 'circle') {
        const index = parseInt(e.target.getAttribute('data-index'));
        if (!isNaN(index)) {
          e.preventDefault();
          
          // Get chart container for scaling
          const container = chartRef.current;
          if (!container) return;
          
          const containerRect = container.getBoundingClientRect();
          const availableHeight = containerRect.height - 150; // Adjust for padding and margins
          
          // Update drag state
          dragStateRef.current = {
            isDragging: true,
            activeIndex: index,
            startY: e.clientY,
            startPercentage: percentages[index],
            chartHeight: availableHeight
          };
          
          document.body.classList.add('no-select');
        }
      }
    };


    const handleMouseMove = (e) => {
      const { isDragging, activeIndex, startY, startPercentage, chartHeight } = dragStateRef.current;
      
      if (!isDragging || activeIndex === -1 || chartHeight === 0) return;
      
      // Calculate the change as a percentage of the available drag area
      // Multiply by a sensitivity factor (e.g., 2) to make drag more responsive
      const sensitivity = 0.8;
      const deltaY = startY - e.clientY;
      const percentageDelta = (deltaY / chartHeight) * 100 * sensitivity;
      
      const newPercentage = Math.min(100, Math.max(0, 
        Math.round(startPercentage + percentageDelta)
      ));
      
      const newPercentages = [...percentages];
      newPercentages[activeIndex] = newPercentage;
      setPercentages(newPercentages);
    };

    const handleMouseUp = () => {
      if (dragStateRef.current.isDragging) {
        dragStateRef.current.isDragging = false;
        dragStateRef.current.activeIndex = -1;
        document.body.classList.remove('no-select');
      }
    };

    // Add global listeners
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.classList.remove('no-select');
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
      alert('Percentages must sum to 100%');
      return;
    }
    try {
      await onVoteComplete(percentages);
    } catch (error) {
      alert('Failed to submit votes');
    }
  };

  const handleResetPercentages = () => {
    setPercentages([20, 20, 20, 20, 20]);
  };

  const totalPercentage = percentages.reduce((sum, p) => sum + p, 0);

  // Custom tooltip handler
  const CustomTooltip = () => {
    if (!selectedDot || dragStateRef.current.isDragging) return null;
    
    const data = weightedValues[selectedDot.index];
    
    return (
      <div
        className="custom-tooltip"
        style={{
          position: 'absolute',
          left: `${selectedDot.x - 110}px`,
          top: `${selectedDot.y + 40}px`,
          width: '220px',
          fontSize: '11px',
          padding: '8px',
          backgroundColor: 'white',
          border: '1px solid #ccc',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          zIndex: 1000,
        }}
      >
        <h4 className="tooltip-title" style={{ margin: '0 0 4px 0', fontWeight: 'bold' }}>{data.level}</h4>
        <div className="tooltip-content">
          <div><u>Percentage</u>: {data.percentage.toFixed(1)}%</div>
          <div><u>Weight Factor</u>: {severityLevels[data.levelIndex].value}</div>
          <div><u>Weighted Value</u>: {data.weightedValue.toFixed(2)}</div>
        </div>
        <div className="tooltip-description" style={{ marginTop: '4px', fontSize: '10px' }}>{data.description}</div>
      </div>
    );
  };

  if(loading) {
    return (
      <Card className="severity-card">
        <CardContent style={{ textAlign: 'center', padding: '40px 0' }}>
          <div className="loading-spinner">
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>
              Loading severity factors...
            </div>
            <div className="spinner"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if(error) { 
    return (
      <Card className="severity-card">
      <CardContent style={{ textAlign: 'center', padding: '40px 0' }}>
        <div className="error-message" style={{ color: '#ef4444' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>
            Error loading severity factors
          </div>
          <div style={{ marginBottom: '20px' }}>{error}</div>
        </div>
      </CardContent>
    </Card>
    );
  }

  if(!Array.isArray(severityLevels) || severityLevels.length === 0) {
    return (
      <Card className="severity-card" style={{ margin: 0, padding: 0, fontFamily: 'Verdana, sans-serif' }}>
        <CardHeader style={{ margin: 0, padding: '0 0 0 0', textAlign: 'center' }}>
          <CardTitle style={{ color: textColor }}>No Severity Factors Found</CardTitle>
          <CardDescription style={{ color: textColor }}>Please contact the project owner to set up severity factors.</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card className="severity-card" style={{ margin: 0, padding: 0, fontFamily: 'Verdana, sans-serif' }}>
      <CardHeader style={{ margin: 0, padding: '0 0 0 0', textAlign: 'center' }}>
        <CardDescription style={{ color: textColor, marginBottom: 0, paddingBottom: 0 }}>
          Allocate probability percentages across severity levels (total must be 100%)
        </CardDescription>
      </CardHeader>
      <CardContent style={{ padding: 0, marginTop: 20, maxHeight: '130vh' }}>
        <div className='severity-levels-info' style={{ padding: '0 20px 15px 20px', textAlign:'center'}}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>Current Severity Weight Factors:</p>
          <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap' }}>
            {severityLevels.map((level, index) => (
              <div key={index} style={{ padding: '5px 10px', margin: '5px', backgroundColor: level.color, borderRadius: '4px',  fontSize: '12px', fontWeight: 'bold'}}>
                Level {level.level}: {level.value}
              </div>
            ))}
          </div>
        </div>
        <div
          className="severity-graph"
          style={{ padding: 0, margin: 0, position: 'relative' }}
          ref={chartRef}
        >
          <CustomTooltip />
          <ResponsiveContainer width="100%" height={370} style={{ padding: 0, margin: 0 }}>
            <ComposedChart
              data={weightedValues}
              margin={{ top: 0, right: 20, left: 20, bottom: 10 }}
              onMouseMove={() => {}}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                interval={0}
                tick={({ x, y, payload }) => (
                  <g transform={`translate(${x},${y})`}>
                    <text x={0} y={0} dy={16} textAnchor="middle" fill={textColor}>
                      {`Level ${payload.value.split(' ')[1]}`}
                    </text>
                    <text x={0} y={20} dy={16} textAnchor="middle" fill={textColor} fontSize="12">
                      {severityLevels[parseInt(payload.value.split(' ')[1]) - 1].name}
                    </text>
                    <foreignObject
                      x="-30"
                      y="50"
                      width="70"
                      height="30"
                    >
                      <div className="input-group-chart">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={percentages[parseInt(payload.value.split(' ')[1]) - 1]}
                          onChange={(e) => handlePercentageChange(parseInt(payload.value.split(' ')[1]) - 1, e.target.value)}
                        />
                        <span>%</span>
                      </div>
                    </foreignObject>
                  </g>
                )}
                height={100}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, Math.max(...severityLevels.map((level) => level.value)) * 1.1 || 400]}
                label={{ value: 'Weighted Value', angle: 90, position: 'insideRight', fill: textColor, dy: 40 }}
                tick={{ fill: textColor }}
              />
              <YAxis
                yAxisId="left"  
                orientation="left"
                domain={[0, 100]}
                label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', fill: textColor, dy: 40 }}
                tick={{ fill: textColor }}
                padding={{ top: 3 }}
              />
              <Legend />
              <Bar
                yAxisId="right"
                dataKey="weightedValue"
                fill="#82ca9d"
                name="Weighted Value"
                isAnimationActive={false}
              >
                {weightedValues.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={severityLevels[index].color} />
                ))}
              </Bar>
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
                  const isDragging = dragStateRef.current.isDragging && dragStateRef.current.activeIndex === index;
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isDragging ? 8 : 6}
                      fill="#2563eb"
                      stroke="#2563eb"
                      strokeWidth={isDragging ? 3 : 2}
                      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                      data-index={index}
                      onMouseEnter={() => !dragStateRef.current.isDragging && setSelectedDot({ x: cx, y: cy, index })}
                      onMouseLeave={() => !dragStateRef.current.isDragging && setSelectedDot(null)}
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
            <div className="alert-content" style={{ textAlign: 'center' }}>
              <u>Current total</u>: <b>{totalPercentage}%</b> (Need 100%)
            </div>
            <div className="alert-bar">
              <div
                className="alert-progress"
                style={{
                  width: `${Math.min(totalPercentage, 100)}%`,
                  backgroundColor: totalPercentage > 100 ? '#ef4444' : '#3b82f6'
                }}
              />  
            </div>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, padding: '10px 20px' }}>
          <button className="reset-button" onClick={handleResetPercentages} style={{backgroundColor: '#6b7280', color: 'white', padding: '8px 16px',  borderRadius: '4px', border: 'none', cursor: 'pointer'}}>   
            <b>Reset</b>
          </button>
        <button
          className="submit-button"
          disabled={Math.abs(totalPercentage - 100) > 0.1}
          onClick={handleSubmit}
        >
          <b>Submit D-Score Votes</b>
        </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DGraph;