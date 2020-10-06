import {Chart} from 'chart.js';

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

    constructor() {
        this.chartCanvas = document.getElementById('chart') as HTMLCanvasElement;
        this.chartContainer = document.querySelector('.chart-container') as HTMLDivElement;
        this.dataInputContainer = document.querySelector('.data-input-container') as HTMLDivElement;
        this.visualizeButton = document.querySelector('.visualize-button') as HTMLButtonElement;
        this.dataInputField = document.querySelector('#data-input-field') as HTMLTextAreaElement;

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
                        x: entry.startTime,
                        y: i + 1
                    }, {
                        x: entry.startTime + entry.duration,
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
                        x: entry.startTime,
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
        console.log('draw graph');
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

                        // Just naively convert to string for now
                        let dataString = dataset.label;
                        if (dataString && dataString.length > 50) {
                            dataString = dataString.substr(0, 50) + '...';
                        }

                        // Make sure alignment settings are correct
                        ctx.textAlign = 'right';
                        ctx.textBaseline = 'middle';

                        const padding = 10;
                        // const position = meta.data[meta.data.length - 1].tooltipPosition();
                        // ctx.fillText(dataString, position.x, position.y - (fontSize / 2) - padding);
                    }
                });
            }
        });

        const scatterChart = new Chart(this.ctx, {
            type: 'line',
            data: data,
            options: {
                responsive: true,
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
                        label: function (tooltipItem, data) {
                            return '';
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
            this.drawError('Failed to draw graph');
        }
    }
}


window.onload = () => {
    console.log('on load')
    const visualizer = new PerformanceDataVisualizer();
    visualizer.start();
};
