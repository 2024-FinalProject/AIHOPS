import React from "react";
import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

const errorBarPlugin = {
    id: "errorBars",
    afterDraw(chart) {
        const ctx = chart.ctx;
        const chartArea = chart.chartArea;
        ctx.save();
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;

        chart.data.datasets[0].data.forEach((value, index) => {
            const meta = chart.getDatasetMeta(0);
            const bar = meta.data[index];

            if (!bar) return;

            const stdDev = chart.data.datasets[0].errorBars[index] || 0;
            
            // Skip drawing error bars if standard deviation is 0
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

    const factorNames = Array.isArray(factorslist)
        ? factorslist.map(factor => factor.name)
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

    // Calculate the maximum value including standard deviation
    const maxValueWithError = Math.max(...data.map((value, index) => value + standardDeviations[index]));
    // Add some padding (10%) to the maximum value
    const yAxisMax = Math.ceil(maxValueWithError * 1.1);

    const chartData = {
        labels: factorNames,
        datasets: [
            {
                label: "Average Score",
                data: data,
                backgroundColor: "rgba(75, 192, 192, 0.8)",
                errorBars: standardDeviations
            }
        ],
    };

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
                max: yAxisMax,
                min: 0
            },
        },
    };

    return (
        <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ width: "70%", height: "300px" }}>
                <Bar data={chartData} options={options} plugins={[errorBarPlugin]} />
            </div>
        </div>
    );
};

export default Histogram;