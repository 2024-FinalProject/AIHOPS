import React from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip } from "chart.js";

// Register required components
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

const SeverityHistogram = ({ severityfactors }) => {

    // Extract average scores and vote count
    const data = severityfactors?.avg || []; // Use the avg array
    const voteCount = severityfactors?.vote_count || 0;

    // Generate factor names for levels
    const factorNames = data.map((_, index) => `Level ${index + 1}`);

    // Chart data configuration
    const chartData = {
        labels: factorNames,
        datasets: [
            {
                label: "Average Score",
                data: data,
                backgroundColor: "rgba(153, 102, 255, 0.5)",
                borderColor: "rgba(153, 102, 255, 1)",
                borderWidth: 1,
            },
        ],
    };

    // Chart options with customized tooltip
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 1,
        plugins: {
            tooltip: {
                enabled: true,
                callbacks: {
                    title: (context) => context[0].label,
                    label: (context) => [
                        `Average Score: ${context.parsed.y.toFixed(2)}`,
                        `Total Votes: ${voteCount}`,
                    ],
                },
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Severity Levels',
                    font: { size: 16 },
                },
                ticks: {
                    font: { size: 14 },
                },
            },
            y: {
                beginAtZero: true,
                max: 1,
                title: {
                    display: true,
                    text: 'Average Score',
                    font: { size: 16 },
                },
                ticks: {
                    font: { size: 14 },
                    callback: (value) => value.toFixed(2),
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

export default SeverityHistogram;
