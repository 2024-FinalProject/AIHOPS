import React from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale } from "chart.js";

// Register required components
ChartJS.register(BarElement, CategoryScale, LinearScale);

const Histogram = () => {
    // Example data
    const data = [1, 2, 2, 3, 3, 3, 4, 4, 4, 4, 5, 5];

    // Group data into bins
    const bins = [1, 2, 3, 4, 5];
    const frequencies = bins.map(
        (bin) => data.filter((value) => value === bin).length
    );

    // Chart data
    const chartData = {
        labels: bins,
        datasets: [
            {
                label: "Frequency",
                data: frequencies,
                backgroundColor: "rgba(75, 192, 192, 0.5)",
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 1,
            },
        ],
    };

    // Chart options with increased font size
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 1,
        plugins: {
            legend: {
                labels: {
                    font: {
                        size: 16, // Increase the font size of the legend
                    },
                },
            },
        },
        scales: {
            x: {
                ticks: {
                    font: {
                        size: 14, // Increase font size for x-axis labels
                    },
                },
                title: {
                    font: {
                        size: 16, // Increase font size for x-axis title
                    },
                },
            },
            y: {
                ticks: {
                    font: {
                        size: 14, // Increase font size for y-axis labels
                    },
                },
                title: {
                    font: {
                        size: 16, // Increase font size for y-axis title
                    },
                },
            },
        },
    };

    return (
        <div style={{ width: "700px", height: "300px" }}>
            <Bar data={chartData} options={options} />
        </div>
    );
};

export default Histogram;
