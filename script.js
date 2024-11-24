// Datos de ejemplo para la temperatura a lo largo del día
const hourlyTemperatures = [20.5, 21, 20, 22, 23, 24, 22.5, 23.5, 25, 26, 27, 28, 27, 25, 24, 23, 22, 21, 20.5, 20, 19.5, 19, 18.5, 18];
const hours = ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];

// Calcular la media y el promedio
const mean = hourlyTemperatures.reduce((acc, temp) => acc + temp, 0) / hourlyTemperatures.length;
const average = mean.toFixed(2);
document.getElementById("mean").textContent = `Media: ${average}°C`;
document.getElementById("average").textContent = `Promedio: ${average}°C`;

// Encontrar las horas con la temperatura más alta y más baja
const maxTemp = Math.max(...hourlyTemperatures);
const minTemp = Math.min(...hourlyTemperatures);
const maxTempTime = hours[hourlyTemperatures.indexOf(maxTemp)];
const minTempTime = hours[hourlyTemperatures.indexOf(minTemp)];
document.getElementById("highest-temp-time").textContent = maxTempTime;
document.getElementById("lowest-temp-time").textContent = minTempTime;

// Gráfica de temperatura con línea de tendencia
const ctx = document.getElementById('temperatureChart').getContext('2d');
const temperatureChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: hours,
        datasets: [
            {
                label: 'Temperatura',
                data: hourlyTemperatures,
                backgroundColor: 'rgba(0, 156, 255, 0.2)',
                borderColor: 'rgba(0, 156, 255, 1)',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Tendencia',
                data: hourlyTemperatures.map((_, i) => mean), // Línea de tendencia (constante)
                borderColor: 'rgba(255, 0, 0, 0.5)',
                fill: false,
                borderDash: [5, 5],
                tension: 0
            }
        ]
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            y: {
                min: 15,
                max: 30
            }
        }
    }
});

// Gráfica de distribución normal
const distributionCtx = document.getElementById('distributionChart').getContext('2d');
const distributionData = hourlyTemperatures.sort((a, b) => a - b);
const distributionChart = new Chart(distributionCtx, {
    type: 'line',
    data: {
        labels: distributionData.map((_, i) => `Data ${i+1}`),
        datasets: [{
            label: 'Distribución Normal',
            data: distributionData,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            fill: true,
            tension: 0.4
        }]
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                display: true
            }
        },
        scales: {
            y: {
                min: 15,
                max: 30
            }
        }
    }
});

// Alternar entre gráficos
document.getElementById('temperature-tab').addEventListener('click', () => {
    document.getElementById('temperature-tab').classList.add('active');
    document.getElementById('humidity-tab').classList.remove('active');
    document.getElementById('distribution-tab').classList.remove('active');
    document.getElementById('temperatureChart').style.display = 'block';
    document.getElementById('distributionChart').style.display = 'none';
});

document.getElementById('distribution-tab').addEventListener('click', () => {
    document.getElementById('temperature-tab').classList.remove('active');
    document.getElementById('humidity-tab').classList.remove('active');
    document.getElementById('distribution-tab').classList.add('active');
    document.getElementById('temperatureChart').style.display = 'none';
    document.getElementById('distributionChart').style.display = 'block';
});

