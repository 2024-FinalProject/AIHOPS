import React from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip } from "chart.js";

// Register required components
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

const Histogram = ({ factors, factorslist, factorVotes = {} }) => {
    // Convert factors object to an array
    const factorsArray = Array.isArray(factors)
        ? factors
        : Object.entries(factors).map(([key, value]) => ({
            ...value,
            fid: parseInt(key) // Convert key to integer
        }));

    // Ensure factorslist is an array and extract names
    const factorNames = Array.isArray(factorslist)
        ? factorslist.map(factor => factor.name)
        : factorsArray.map(factor => factor.name);

    // Standard deviation calculation function
    const calculateStdDev = (fid, votes) => {
        if (!votes || votes.length === 0) return 0;

        // Compute mean
        const avg = votes.reduce((sum, v) => sum + v, 0) / votes.length;

        // Compute standard deviation
        const squaredDiffs = votes.map(vote => Math.pow(vote - avg, 2));
        const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / votes.length;
        return Math.sqrt(variance);
    };

    // Extract average scores and compute standard deviations
    const data = factorsArray.map(factor => factor.avg);
    const standardDeviations = factorsArray.map(factor => {
        const votes = factorVotes[factor.fid] || [];
        return calculateStdDev(factor.fid, votes);
    });

    // Chart data configuration
    const chartData = {
        labels: factorNames,
        datasets: [
            {
                label: "Average Score",
                data: data,
                backgroundColor: "rgba(75, 192, 192, 0.8)", // Main color for the average score
            },
            {
                label: "Deviation",
                data: standardDeviations,
                backgroundColor: "rgba(255, 99, 132, 0.8)", // Color for deviation
            },
        ],
    };

    // Chart options configuration
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            tooltip: {
                enabled: true,
                callbacks: {
                    title: (context) => context[0].label,
                    label: (context) => {
                        const index = context.dataIndex;
                        return [
                            `Avg: ${data[index].toFixed(2)}`,
                            `Std Dev: ${standardDeviations[index].toFixed(2)}`,
                        ];
                    },
                },
            },
        },
        scales: {
            x: {
                stacked: true, // Enables stacking
                title: {
                    display: true,
                    text: 'Factors',
                    font: { size: 16 }
                },
                ticks: {
                    font: { size: 14 },
                },
            },
            y: {
                stacked: true, // Enables stacking
                title: {
                    display: true,
                    text: 'Score',
                    font: { size: 16 }
                },
                ticks: {
                    font: { size: 14 },
                },
            },
        },
    };

    return (
        <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ width: "70%", height: "300px" }}>
                <Bar data={chartData} options={options} />
            </div>
        </div>
    );
};

export default Histogram;
