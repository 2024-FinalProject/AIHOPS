import React from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip } from "chart.js";

// Register required components
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

// Set the global font family for all elements
ChartJS.defaults.font.family = "Verdana, sans-serif";

const errorBarPlugin = {
    id: "errorBars",
    afterDatasetsDraw(chart) {
        const ctx = chart.ctx;
        const chartArea = chart.chartArea;
        ctx.save();
        ctx.strokeStyle = "#d32f2f"; // Red color for error bars
        ctx.lineWidth = 2;

        chart.data.datasets[0].data.forEach((value, index) => {
            const meta = chart.getDatasetMeta(0);
            const bar = meta.data[index];

            if (!bar) return;

            const stdDev = chart.data.datasets[0].errorBars[index] || 0;

            if (stdDev === 0) return;

            const x = bar.x;
            const yTop =
                bar.y - (stdDev * (chartArea.bottom - chartArea.top)) / chart.scales.y.max;
            const yBottom =
                bar.y + (stdDev * (chartArea.bottom - chartArea.top)) / chart.scales.y.max;

            // Draw vertical error line
            ctx.beginPath();
            ctx.moveTo(x, yTop);
            ctx.lineTo(x, yBottom);
            ctx.stroke();

            // Draw caps
            const capWidth = 6;
            ctx.beginPath();
            ctx.moveTo(x - capWidth, yTop);
            ctx.lineTo(x + capWidth, yTop);
            ctx.moveTo(x - capWidth, yBottom);
            ctx.lineTo(x + capWidth, yBottom);
            ctx.stroke();
        });

        ctx.restore();
    },
};

const Histogram = ({ factors, factorslist, factorVotes = {} }) => {
    const theme = localStorage.getItem("theme") || "light";
    const textColor = theme === "light" ? "#333" : "#fff";
    const backgroundColor = "transparent";

    // Convert factors to an array if it's an object.
    const factorsArray = Array.isArray(factors)
        ? factors
        : Object.entries(factors).map(([key, value]) => ({
              ...value,
              fid: parseInt(key),
          }));

    // Create a mapping for quick lookup by id/fid.
    const factorsMap = {};
    factorsArray.forEach((factor) => {
        // Assume factor.id and factor.fid are equivalent;
        // if not, adjust as needed.
        factorsMap[factor.fid] = factor;
        // Also check if factor.id exists in case the keys in factorslist match that.
        if (factor.id !== undefined) {
            factorsMap[factor.id] = factor;
        }
    });

    // If factorslist exists, we use its order. Otherwise, fallback to factorsArray order.
    const orderedFactors = Array.isArray(factorslist)
        ? factorslist.map((factor) => {
              const matchingFactor = factorsMap[factor.id];
              return {
                  id: factor.id,
                  name: factor.name,
                  avg: matchingFactor ? matchingFactor.avg : 0,
                  vote_count: matchingFactor ? matchingFactor.vote_count : 0,
              };
          })
        : factorsArray;

    // Separate labels and data from ordered factors.
    const labels = orderedFactors.map((factor) => factor.name.split(" "));
    const tooltipNames = orderedFactors.map((factor) => factor.name);
    const data = orderedFactors.map((factor) => factor.avg);

    // Calculate standard deviation per factor.
    const calculateStdDev = (fid, votes) => {
        if (!votes || votes.length === 0) return 0;
        const avg = votes.reduce((sum, v) => sum + v, 0) / votes.length;
        const squaredDiffs = votes.map((vote) => Math.pow(vote - avg, 2));
        const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / votes.length;
        return Math.sqrt(variance);
    };

    const standardDeviations = orderedFactors.map((factor) => {
        const votes = factorVotes[factor.id] || [];
        return calculateStdDev(factor.id, votes);
    });

    const maxValueWithError = Math.max(
        ...data.map((value, index) => value + standardDeviations[index])
    );

    const yAxisMax = Math.ceil(maxValueWithError * 1.1 * 2) / 2;

    const chartData = {
        labels: labels,
        datasets: [
            {
                label: "Average Score",
                data: data,
                backgroundColor: "rgba(75, 192, 192, 0.8)",
                errorBars: standardDeviations,
                zIndex: 2,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            tooltip: {
                enabled: true,
                callbacks: {
                    title: (context) => tooltipNames[context[0].dataIndex],
                    label: (context) => {
                        const index = context.dataIndex;
                        return [
                            `Average Score: ${data[index].toFixed(2)}`,
                            `Std Dev: ${standardDeviations[index].toFixed(2)}`,
                        ];
                    },
                },
                titleFont: {
                    family: "Verdana, sans-serif",
                },
                bodyFont: {
                    family: "Verdana, sans-serif",
                },
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: "Content Factors",
                    font: {
                        size: 14,
                        weight: "bold",
                    },
                    color: textColor,
                },
                ticks: {
                    font: { size: 12 },
                    color: textColor,
                },
            },
            y: {
                title: {
                    display: true,
                    text: "Average Score",
                    font: {
                        size: 14,
                        weight: "bold",
                    },
                    color: textColor,
                },
                ticks: {
                    font: { size: 12 },
                    color: textColor,
                },
                beginAtZero: true,
                max: yAxisMax,
            },
        },
    };

    return (
        <div style={{ display: "flex", justifyContent: "center" }}>
            <div
                style={{
                    width: "80%",
                    height: "345px",
                    marginTop: "20px",
                    marginBottom: "20px",
                    backgroundColor: backgroundColor,
                }}
            >
                <Bar data={chartData} options={options} plugins={[errorBarPlugin]} />
            </div>
        </div>
    );
};

export default Histogram;
