import {Chart} from 'chart.js';
import 'chartjs-plugin-zoom'

function dynamicColor() {
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);
    return `rgb(${r},${g},${b})`;
}

class PerformanceDataVisualizer {
    chartCanvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    private chartContainer: HTMLDivElement;
    private dataInputContainer: HTMLDivElement;
    private visualizeButton: HTMLButtonElement;
    private dataInputField: HTMLTextAreaElement;
    private entries: PerformanceEntry[] = [];
    private resetZoomButton: HTMLButtonElement;
    private chart?: Chart;

    constructor() {
        this.chartCanvas = document.getElementById('chart') as HTMLCanvasElement;
        this.chartContainer = document.querySelector('.chart-container') as HTMLDivElement;
        this.dataInputContainer = document.querySelector('.data-input-container') as HTMLDivElement;
        this.visualizeButton = document.querySelector('.visualize-button') as HTMLButtonElement;
        this.dataInputField = document.querySelector('#data-input-field') as HTMLTextAreaElement;
        this.resetZoomButton = document.querySelector('#reset-zoom-button') as HTMLButtonElement;
        this.resetZoomButton.addEventListener('click', this.onResetZoomClicked.bind(this));

        const ctx = this.chartCanvas.getContext('2d');
        if (!ctx) {
            throw new Error('unable to initialize canvas');
        }
        this.ctx = ctx;
        this.visualizeButton.addEventListener('click', this.onVisualizeClicked.bind(this))
    }

    onVisualizeClicked() {
        if (!this.dataInputField.value) {
            return;
        }

        this.entries = JSON.parse(this.dataInputField.value);
        if (this.entries.length <= 0) {
            alert('no data found');
            return;
        }
        if ((this.entries[0] as any).jsonPayload) {
            this.entries = this.entries.map(e => (e as any).jsonPayload)
        }
        this.setDataInputFieldVisibility(false);

        this.tryDrawGraph();
    }

    loadEntriesFromUrl(): PerformanceEntry[] {
        if (!window.location.hash) {
            throw new Error('no data given');
        }
        const hash = decodeURIComponent(window.location.hash.substr(1));

        console.log(hash);
        return JSON.parse(hash);
    }

    convertEntryToChartData(entry: PerformanceEntry, i: number) {
        const color = dynamicColor();
        if (entry.duration > 0) {
            return {
                label: entry.name,
                backgroundColor: color,
                borderColor: color,
                fill: false,
                borderWidth: 15,
                pointRadius: 0,
                data: [
                    {
                        x: entry.startTime / 1000,
                        y: i + 1
                    }, {
                        x: (entry.startTime + entry.duration) / 1000,
                        y: i + 1
                    }
                ]
            };
        } else {
            return {
                label: entry.name,
                backgroundColor: color,
                borderColor: color,
                fill: false,
                pointRadius: 10,
                data: [
                    {
                        x: entry.startTime / 1000,
                        y: i + 1
                    }
                ]
            };
        }
    }

    convertEntriesToChartData(entries: PerformanceEntry[]) {
        return entries.map(this.convertEntryToChartData);
    }

    drawGraph() {
        const data = {
            datasets: this.convertEntriesToChartData(this.entries)
        };

        Chart.plugins.register({
            afterDatasetsDraw: function (chart) {
                const ctx = chart.ctx;

                chart.data.datasets!.forEach((dataset, i) => {
                    if (!ctx) {
                        return;
                    }
                    const meta = chart.getDatasetMeta(i);
                    if (!meta.hidden) {
                        // Draw the text in black, with the specified font
                        ctx.fillStyle = 'rgb(0, 0, 0)';

                        const fontSize = 16;
                        const fontStyle = 'normal';
                        const fontFamily = 'Helvetica Neue';
                        ctx.font = Chart.helpers.fontString(fontSize, fontStyle, fontFamily);

                        let dataString = dataset.label || '';
                        if (dataString.length > 50) {
                            return;
                        }

                        // Make sure alignment settings are correct
                        ctx.textAlign = 'right';
                        ctx.textBaseline = 'middle';

                        const padding = 10;
                        const position = (meta.data[meta.data.length - 1] as any).tooltipPosition();
                        ctx.fillText(dataString, position.x, position.y - (fontSize / 2) - padding);
                    }
                });
            }
        });

        this.chart = new Chart(this.ctx, {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                legend: {
                    display: false
                },
                scales: {
                    xAxes: [{
                        type: 'linear',
                        position: 'bottom',
                        ticks: {
                            stepSize: 1
                        }
                    }],
                    yAxes: [{
                        scaleLabel: {
                            display: false
                        },
                        ticks: {
                            beginAtZero: true,
                            stepSize: 1,
                            max: data.datasets.length + 1
                        }
                    }]
                },
                tooltips: {
                    intersect: false,
                    callbacks: {
                        title: () => {
                            return '';
                        },
                        label: (tooltipItem) => {
                            if (!tooltipItem.datasetIndex) {
                                return '';
                            }

                            let dataPoint = data.datasets[tooltipItem.datasetIndex];
                            if (!dataPoint) {
                                return '';
                            }
                            let label = dataPoint.label;

                            if (label) {
                                label += ': ';
                            }
                            const value = parseFloat(tooltipItem.label!) || 0;
                            label += Math.round(value * 100) / 100;
                            label += 's ';
                            if (dataPoint.data.length > 1) {
                                let duration = dataPoint.data[1].x - dataPoint.data[0].x;
                                duration = Math.round(duration * 100) / 100;
                                label += ` (duration: ${duration}s)`;
                            }
                            return label;
                        }
                    }
                },
                plugins: {
                    zoom: {
                        pan: {
                            enabled: true
                        },
                        zoom: {
                            enabled: true,
                            drag: false,
                        }
                    }
                }
            }
        });
    }

    setDataInputFieldVisibility(showInput: boolean) {
        const container = document.querySelector('.chart-container') as HTMLDivElement;
        const dataInputContainer = document.querySelector('.data-input-container') as HTMLDivElement;
        if (showInput) {
            container.style.display = 'none';
            dataInputContainer.style.display = 'block';
        } else {
            container.style.display = 'block';
            dataInputContainer.style.display = 'none';
        }
    }

    drawError(error: string) {
        this.setDataInputFieldVisibility(false);
        this.chartContainer.innerHTML = '<h1 class="error">' + error + '</h1>';
    }

    start() {
        if (!window.location.hash || window.location.hash.length <= 1) {
            console.log('no data')
            this.setDataInputFieldVisibility(true);
            return;
        } else {
            this.entries = this.loadEntriesFromUrl();
        }

        this.tryDrawGraph();
    }

    private tryDrawGraph() {
        try {
            this.drawGraph();
        } catch (ex) {
            console.error(ex);
            this.drawError('Failed to draw graph');
        }
    }

    private onResetZoomClicked() {
        if (!this.chart) {
            return;
        }
        (this.chart as any).resetZoom();
    }
}


window.onload = () => {
    console.log('on load')
    const visualizer = new PerformanceDataVisualizer();
    visualizer.start();
};
