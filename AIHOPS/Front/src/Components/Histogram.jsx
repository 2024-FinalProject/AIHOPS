import React from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip } from "chart.js";

// Register required components
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

// Set the global font family for all elements
ChartJS.defaults.font.family = 'Verdana, sans-serif';

const errorBarPlugin = {
    id: "errorBars",
    beforeDatasetsDraw(chart) {
        const ctx = chart.ctx;
        const chartArea = chart.chartArea;
        ctx.save();
        ctx.strokeStyle = "#d32f2f";
        ctx.lineWidth = 2;

        chart.data.datasets[0].data.forEach((value, index) => {
            const meta = chart.getDatasetMeta(0);
            const bar = meta.data[index];

            if (!bar) return;

            const stdDev = chart.data.datasets[0].errorBars[index] || 0;

            if (stdDev === 0) return;

            const x = bar.x;
            const yTop = bar.y - stdDev * (chartArea.bottom - chartArea.top) / chart.scales.y.max;
            const yBottom = bar.y + stdDev * (chartArea.bottom - chartArea.top) / chart.scales.y.max;

            ctx.beginPath();
            ctx.moveTo(x, yTop);
            ctx.lineTo(x, yBottom);
            ctx.stroke();

            const capWidth = 6;
            ctx.beginPath();
            ctx.moveTo(x - capWidth, yTop);
            ctx.lineTo(x + capWidth, yTop);
            ctx.moveTo(x - capWidth, yBottom);
            ctx.lineTo(x + capWidth, yBottom);
            ctx.stroke();
        });

        ctx.restore();
    }
};

const Histogram = ({ factors, factorslist, factorVotes = {} }) => {
    const factorsArray = Array.isArray(factors)
        ? factors
        : Object.entries(factors).map(([key, value]) => ({
            ...value,
            fid: parseInt(key)
        }));

    // For x-axis labels, split factor names by space (so they will appear like this: "Factor One")
    const factorNamesForXAxis = Array.isArray(factorslist)
        ? factorslist.map(factor => factor.name.split(" ")) // Splitting for x-axis labels
        : factorsArray.map(factor => factor.name.split(" "));

    // For tooltip, use the factor name directly (without splitting)
    const factorNamesForTooltip = Array.isArray(factorslist)
        ? factorslist.map(factor => factor.name) // Direct factor names for tooltip
        : factorsArray.map(factor => factor.name);

    const calculateStdDev = (fid, votes) => {
        if (!votes || votes.length === 0) return 0;
        const avg = votes.reduce((sum, v) => sum + v, 0) / votes.length;
        const squaredDiffs = votes.map(vote => Math.pow(vote - avg, 2));
        const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / votes.length;
        return Math.sqrt(variance);
    };

    const data = factorsArray.map(factor => factor.avg);
    const standardDeviations = factorsArray.map(factor => {
        const votes = factorVotes[factor.fid] || [];
        return calculateStdDev(factor.fid, votes);
    });

    const maxValueWithError = Math.max(
        ...data.map((value, index) => value + standardDeviations[index])
    );

    const yAxisMax = Math.ceil(maxValueWithError * 1.1 * 2) / 2;  // Round to the nearest 0.5 or 1

    const chartData = {
        labels: factorNamesForXAxis, // Use split factor names for x-axis
        datasets: [
            {
                label: "Average Score",
                data: data,
                backgroundColor: "rgba(75, 192, 192, 0.8)",
                errorBars: standardDeviations,
                zIndex: 2, // Set bars with higher zIndex than error bars
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
                    title: (context) => factorNamesForTooltip[context[0].dataIndex],
                    label: (context) => {
                        const index = context.dataIndex; 
                        return [
                            `Average Score: ${data[index].toFixed(2)}`,
                            `Std Dev: ${standardDeviations[index].toFixed(2)}`,
                        ];
                    },
                },
                titleFont: {
                    family: 'Verdana, sans-serif',
                },
                bodyFont: {
                    family: 'Verdana, sans-serif',
                },
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Content Factors',
                    font: {
                        size: 14,
                        weight: 'bold',  // Apply bold styling here
                    },
                },
                ticks: {
                    font: { size: 12 },
                    autoSkip: false,
                    maxRotation: 90,
                    minRotation: 0,
                    align: 'left',
                },
                barPercentage: 0.6,
                categoryPercentage: 0.8,
            },            
            y: {
                title: {
                    display: true,
                    text: 'Average Score',
                    font: {
                        size: 14,
                        weight: 'bold',
                    },
                    position: 'left',  // Align to the left, might need fine-tuning
                    rotation: -90,     // Ensure proper rotation to match your desired angle
                },
                ticks: {
                    font: { size: 12 },
                },
                beginAtZero: true,
                max: yAxisMax,
            },                                                 
        },
        elements: {
            bar: {
                zIndex: 1,
            },
        },
    };

    return (
        <div style={{ display: "flex", justifyContent: "center"}}>
            <div style={{ width: "80%", height: "345px", marginTop: '20px', marginBottom: '20px', backgroundColor: '#fffafa'}}>
                <Bar data={chartData} options={options} plugins={[errorBarPlugin]} />
            </div>
        </div>
    );
};

export default Histogram;
