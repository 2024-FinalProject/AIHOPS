import React from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip } from "chart.js";

// Register required components
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

const Histogram = ({ factors, factorslist }) => {
    // Convert factors to an array if it's not already one
    const factorsArray = Array.isArray(factors) ? factors : Object.values(factors);

    // Extract average values
    const data = factorsArray.map(factor => factor.avg);
    const voteCounts = factorsArray.map(factor => factor.vote_count);

    // Create bins dynamically based on min and max values
    const minValue = 1;
    const maxValue = data.length;
    const bins = Array.from({ length: maxValue - minValue + 1 }, (_, i) => minValue + i);

    // Ensure factorslist is an array and extract names
    const factorNames = Array.isArray(factorslist) 
        ? factorslist.map(factor => factor.name)
        : factorsArray.map(factor => factor.name);

    // Chart data
    const chartData = {
        labels: factorNames, // Use factor names as labels
        datasets: [
            {
                label: "Score",
                data: data,
                backgroundColor: "rgba(75, 192, 192, 0.5)",
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 1,
            },
        ],
    };

    // Chart options with tooltips displaying factor names when hovering over bars
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 1,
        plugins: {
            tooltip: {
                enabled: true,
                callbacks: {
                    // Customize the tooltip content
                    title: (context) => {
                        return context[0].label; // Show factor name as title
                    },
                    label: (context) => {
                        return [
                            `Score: ${context.parsed.y}`,
                            `Votes: ${voteCounts[context.dataIndex]}`
                        ];
                    },
                },
            },
        },
        scales: {
            x: {
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