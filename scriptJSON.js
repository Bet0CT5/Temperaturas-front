// URL del endpoint del microservicio
const apiURL = 'https://35.238.46.198.nip.io/hour'
const pdfApiURL = 'https://35.238.46.198.nip.io/normal_distribution'
const mainDataURL = 'https://35.238.46.198.nip.io/dashboard_main_data'

// Obtener los datos del backend
async function fetchData() {
    try {
        const response = await fetch(apiURL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()

        // Transformar los datos recibidos en un formato adecuado para las gráficas
        const labels = data.map(item => `${item.fecha} ${item.hora}`) // Combina fecha y hora
        const temperatures = data.map(item => item.temperatura)

        // Calcular la media
        const mean = temperatures.reduce((acc, temp) => acc + temp, 0) / temperatures.length
        const average = mean.toFixed(2)
        document.getElementById("temperature").textContent = `${average}°C`

        // Calcular la mediana
        temperatures.sort(((a, b) => a - b)) // Ordenar temperaturas
        let median
        const middle = Math.floor(temperatures.length / 2)
        if (temperatures.length % 2 == 0) {
            // Si el número de datos es par, la mediana es el promedio de los dos valores centrales
            median = (temperatures[middle - 1] + temperatures[middle]) / 2
        } else {
            // Si el número de datos es impar, la mediana es el valor central
            median = temperatures[middle]
        }
        console.log(median)
        document.getElementById("median").textContent = `${median.toFixed(2)}°C`

    } catch (error) {
        console.error('Error al obtener los datos:', error)
        alert('No se pudieron cargar los datos del servidor')
    }
}

// Obtener los datos de las horas con temperaturas mínimas y máximas
async function fetchTemperatureData() {
    try {
        const response = await fetch(mainDataURL)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()

        // Extraer las tendencias de horas máximas y mínimas
        const horasMaximas = data.tendencia_horas_maximas
        const horasMinimas = data.tendencia_horas_minimas

        // Formatear las horas en formato de hora fija
        const formatHours = (hoursArray) =>
            hoursArray.map(hour => `${hour.toString().padStart(2, '0')}:00`).join(', ')

        // Actualizar los elementos del DOM
        document.getElementById("highest-temp-time").textContent = formatHours(horasMaximas)
        document.getElementById("lowest-temp-time").textContent = formatHours(horasMinimas)

    } catch (error) {
        console.error('Error al obtener los datos:', error)
        alert('No se pudieron cargar los datos de temperaturas del servidor')
    }
}

// Obtener datos de la distribución normal
async function fetchPDFData() {
    try {
        const response = await fetch(pdfApiURL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        const pdf = data.pdf; // Valores del PDF (altura de la campana)
        const xAxis = data.x; // Valores del eje X (temperaturas en el rango)

        // Crear la gráfica de distribución normal 
        const distributionCtx = document.getElementById('distributionChart').getContext('2d');
        new Chart(distributionCtx, {
            type: 'line',
            data: {
                labels: xAxis.map(val => val.toFixed(2)), // Eje X con formato
                datasets: [{
                    label: 'Distribución Normal (PDF)',
                    data: pdf,
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
                    x: {
                        title: {
                            display: true,
                            text: 'Temperatura'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Probabilidad'
                        },
                        min: 0,
                        max: Math.max(...pdf) + 0.1 // Ajustar el rango para la altura máxima
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error al obtener los datos de la distribución normal:', error);
        alert('No se pudieron cargar los datos de la distribución normal.');
    }
}

// Crear gráficas dinámicamente para cada día
async function createChartsFromAPI() {
    try {
        const response = await fetch(apiURL)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()

        // Agrupar datos por fecha
        const groupedData = groupBy(data, 'fecha')

        // Contenedor para las diapositivas
        const carouselInner = document.getElementById('carouselInner')

        // Crear una gráfica por cada fecha
        let isFirst = true
        Object.keys(groupedData).forEach(fecha => {
            const dayData = groupedData[fecha]

            // Crear el contenedor de la diapositiva
            const carouselItem = document.createElement('div')
            carouselItem.classList.add('carousel-item')
            if (isFirst) {
                carouselItem.classList.add('active') // Marca la primera gráfica como activa
                isFirst = false
            }

            // Crear un canvas para la gráfica
            const canvas = document.createElement('canvas')
            canvas.id = `chart-${fecha}`
            canvas.style.width = '100%'
            canvas.style.height = '400px'

            carouselItem.appendChild(canvas)
            carouselInner.appendChild(carouselItem)

            // Extraer etiquetas (horas) y datos (temperaturas)
            const labels = dayData.map(entry => entry.hora)
            const temperatures = dayData.map(entry => entry.temperatura)

            // Calcular la línea de tendencia como el promedio
            const trendLine = calculateTrendLine(temperatures)

            // Crear la gráfica
            const ctx = canvas.getContext('2d')
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: `Temperaturas - ${fecha}`,
                        data: temperatures,
                        backgroundColor: 'rgba(0, 156, 255, 0.2)',
                        borderColor: 'rgba(0, 156, 255, 1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: `Línea de Tendencia - ${fecha}`,
                        data: trendLine,
                        borderColor: 'rgba(255, 99, 132, 0.8)',
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
                            display: true
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Horas'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Temperatura'
                            },
                            min: Math.min(...temperatures) - 2,
                            max: Math.max(...temperatures) + 2
                        }
                    }
                }
            })
        })
    } catch (error) {
        console.error('Error al obtener los datos:', error)
        alert('No se pudieron cargar los datos del servidor')
    }
}

// Calcular la linea de tendencia usando regresion lineal
function calculateTrendLine(data) {
    const n = data.length
    const x = Array.from({ length: n }, (_, i) => i + 1)
    const y = data

    // Calcular las medias
    const meanX = x.reduce((sum, val) => sum + val, 0) / n
    const meanY = y.reduce((sum, val) => sum + val, 0) / n

    // Calcular pendiente (m) y el intercepto (b)
    const numerator = x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0)
    const denominator = x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0)
    const slope = numerator / denominator
    const intercept = meanY - slope * meanX

    // Generar la linea de tendencia
    return x.map(xi => slope * xi + intercept)
}

// Obtener y mostrar las tablas con los datos de temperatura
async function createTablesFromAPI() {
    try {
        const response = await fetch(apiURL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Agrupar datos por fecha
        const groupedData = groupBy(data, 'fecha');

        // Contenedor para las diapositivas del carrusel
        const tableCarouselInner = document.getElementById('tableCarouselInner');
        if (!tableCarouselInner) {
            console.error('Contenedor tableCarouselInner no encontrado');
            return;
        }

        // Crear una tabla por cada fecha
        let isFirst = true;
        Object.keys(groupedData).forEach((fecha) => {
            const dayData = groupedData[fecha];

            // Crear el contenedor de la diapositiva
            const carouselItem = document.createElement('div');
            carouselItem.classList.add('carousel-item');
            if (isFirst) {
                carouselItem.classList.add('active');
                isFirst = false;
            }

            // Crear la tabla
            const table = document.createElement('table');
            table.classList.add('table', 'table-striped', 'table-bordered');
            table.style.width = '100%';

            // Crear el encabezado de la tabla
            const thead = document.createElement('thead'); // Cambiado de `thread` a `thead`

            // Fila de la fecha 
            const dateRow = document.createElement('tr')
            const dateCell = document.createElement('th')
            dateCell.textContent = `Fecha: ${fecha}`
            dateCell.colSpan = 2 
            dateCell.style.textAlign = 'center'
            dateCell.style.fontWeight = 'bold'
            dateRow.appendChild(dateCell)
            thead.appendChild(dateRow)

            // Crear la fila del encabezado principal
            const headerRow = document.createElement('tr');
            ['Hora', 'Temperatura'].forEach((header) => {
                const th = document.createElement('th');
                th.textContent = header;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);

            // Crear el cuerpo de la tabla
            const tbody = document.createElement('tbody');
            dayData.forEach((entry) => {
                const row = document.createElement('tr');
                const horaCell = document.createElement('td');
                horaCell.textContent = entry.hora;
                const temperaturaCell = document.createElement('td');
                temperaturaCell.textContent = entry.temperatura.toFixed(2);
                row.appendChild(horaCell);
                row.appendChild(temperaturaCell);
                tbody.appendChild(row);
            });
            table.appendChild(tbody);

            // Agregar la tabla al contenedor de la diapositiva
            carouselItem.appendChild(table);
            tableCarouselInner.appendChild(carouselItem);
        });
    } catch (error) {
        console.error('Error al obtener los datos:', error);
        alert('No se pudieron cargar los datos del servidor');
    }
}

// Función para exportar tablas y gráficas a Excel
async function exportToExcel() {
    try {
        // Importar libreria xlsx
        if (typeof XLSX == 'undefined') {
            alert('Error, la biblioteca XLSX no está cargada')
            return
        }

        // Obtener datos de la API
        const response = await fetch(apiURL)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()

        // Agrupar datos por fecha 
        const groupedData = groupBy(data, 'fecha')

        // Crear un libro de Excel
        const workbook = XLSX.utils.book_new()

        // Recorrer cada tabla por fecha y agregarla al Excel
        Object.keys(groupedData).forEach((fecha) => {
            const dayData = groupedData[fecha]

            // Crear una hoja para la tabla del dia actual
            const tableData = dayData.map((entry) => ({
                Hora: entry.hora,
                temperatura: entry.temperatura.toFixed(2),
            }))
            const worksheet = XLSX.utils.json_to_sheet(tableData)
            XLSX.utils.book_append_sheet(workbook, worksheet, fecha)
        })

        // Exportar las gráficas al Excel como imágenes
        const chartCanvases = document.querySelectorAll("canvas[id^='chart-']")
        chartCanvases.forEach((canvas, index) => {
            const chartBase64 = canvas.toDataURL("image/png") // Convertir gráfica a Base64
            const worksheetName = `Gráfica-${index + 1}`
            const worksheet = workbook.Sheets[workbook.SheetNames[index]]

            // Agregar la imagen como un objeto de celda en excel
            const imgCell = XLSX.utils.aoa_to_sheet([
                [`Gráfica del día ${workbook.SheetNames[index]}`],
            ])
            worksheet[`!images`] = worksheet[`!images`] || []
            worksheet[`!images`].push({
                image: chartBase64,
                range: {s: {r: 2, c: 0}, e: {r: 10, c: 10}},
            })

            XLSX.utils.book_append_sheet(workbook, imgCell, worksheetName)
        })

        // Descargar el archivo de excel
        XLSX.writeFile(workbook, 'Temperaturas.xlsx')
        alert('El archivo de excel ha sido exportado correctamente')
    } catch (error) {
        console.error('Error al exportar a excel:', error)
        alert('No se pudo exportar a Excel')
    }
}

// Segunda opción para exportar a excel
async function exportToExcel2() {
    try {
        if (typeof ExcelJS == 'undefined') {
            alert('Error, la biblioteca ExcelJS no está cargada');
            return;
        }

        const response = await fetch(apiURL);
        const response2 = await fetch(pdfApiURL);
        const response3 = await fetch(mainDataURL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        if (!response2.ok) {
            throw new Error(`HTTP error! status: ${response2.status}`);
        }
        if (!response3.ok) {
            throw new Error(`HTTP error! status: ${response3.status}`);
        }
        const data = await response.json();
        const data2 = await response2.json();
        const data3 = await response3.json();

        const groupedData = groupBy(data, 'fecha');
        const workbook = new ExcelJS.Workbook();

        Object.keys(groupedData).forEach((fecha) => {
            const dayData = groupedData[fecha];
            const worksheet = workbook.addWorksheet(fecha);

            worksheet.columns = [
                { header: 'Hora', key: 'hora', width: 15 },
                { header: 'Temperatura', key: 'temperatura', width: 20 },
            ];

            dayData.forEach((entry) => {
                worksheet.addRow({
                    hora: entry.hora,
                    temperatura: entry.temperatura.toFixed(2),
                });
            });
        });

        // Añadir imágenes de las gráficas
        const chartCanvases = document.querySelectorAll("canvas[id^='chart-']");
        chartCanvases.forEach((canvas, index) => {
            const ctx = canvas.getContext('2d');

            // Establecer fondo blanco antes de exportar
            const originalWidth = canvas.width;
            const originalHeight = canvas.height;

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = originalWidth;
            tempCanvas.height = originalHeight;

            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.fillStyle = 'white'; // Fondo blanco
            tempCtx.fillRect(0, 0, originalWidth, originalHeight);
            tempCtx.drawImage(canvas, 0, 0);

            const chartBase64 = tempCanvas.toDataURL("image/png");
            const imageId = workbook.addImage({
                base64: chartBase64,
                extension: 'png',
            });

            const worksheet = workbook.worksheets[index];
            if (worksheet) {
                worksheet.addImage(imageId, {
                    tl: { col: 2, row: worksheet.rowCount + 2 },
                    ext: { width: 500, height: 300 },
                });
            }
        });

        // Añadir hoja de la distribución normal
        const ws = workbook.addWorksheet('Distribucion normal');
        ws.columns = [
            { header: 'X', key: 'x', with: 15 },
            { header: 'PDF', key: 'pdf', width: 20}
        ]

        data2.x.forEach((xValue, index) => {
            ws.addRow({
                x: xValue.toFixed(2),
                pdf: data2.pdf[index].toFixed(6)
            });
        });

        // Añadir gráfica de la distribución normal
        const distributionChart = document.getElementById('distributionChart');
        const distributionCtx = distributionChart.getContext('2d');

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = distributionChart.width;
        tempCanvas.height = distributionChart.height;

        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.fillStyle = 'white'; // Fondo blanco
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.drawImage(distributionChart, 0, 0);

        const distChartBase64 = tempCanvas.toDataURL("image/png");
        const distImageId = workbook.addImage({
            base64: distChartBase64,
            extension: 'png',
        });

        ws.addImage(distImageId, {
            tl: { col: 2, row: 2 },
            ext: { width: 500, height: 300 },
        });

        // Añadir hoja con los datos principales (media, mediana, desviación estándar y horas de máximas/mínimas)
        const mainDataWorksheet = workbook.addWorksheet('Datos centrales');
        mainDataWorksheet.columns = [
            { header: 'Concepto', key: 'concepto', with: 30},
            { header: 'Valor', key: 'valor', with: 50 }
        ]

        // Calcular la mediana
        const temperatures = data.map(item => item.temperatura).sort((a, b) => a - b)
        const middle = Math.floor(temperatures.length / 2)
        const mediana = temperatures.length % 2 === 0
            ? (temperatures[middle - 1] + temperatures[middle]) / 2
            : temperatures[middle]
        
        // Añadir datos al worksheet
        const mainDataRows = [
            { concepto: 'Media', valor: data3.media.toFixed(2) },
            { concepto: 'Mediana', valor: mediana.toFixed(2) },
            { concepto: 'Desviación Estándar', valor: data3.desviacion.toFixed(2) },
            { concepto: 'Horas de Máximas Temperaturas', valor: data3.tendencia_horas_maximas.join(', ') },
            { concepto: 'Horas de Mínimas Temperaturas', valor: data3.tendencia_horas_minimas.join(', ') }
        ]

        mainDataRows.forEach(row => mainDataWorksheet.addRow(row))

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'Temperaturas.xlsx';
        link.click();

        alert('El archivo Excel ha sido exportado correctamente.');
    } catch (error) {
        console.error('Error al exportar a Excel:', error);
        alert('No se pudo exportar a Excel.');
    }
}


// Función para agrupar datos por una clave 
function groupBy(array, key) {
    return array.reduce((result, currentValue) => {
        (result[currentValue[key]] = result[currentValue[key]] || []).push(currentValue)
        return result
    }, {})
}

fetchData()
fetchPDFData()
createChartsFromAPI()
createTablesFromAPI()
fetchTemperatureData()



// Evento para exportar a excel 
document.addEventListener("DOMContentLoaded", () => {
    // Agregar el evento al botón para exportar a Excel
    const exportButton = document.getElementById('exportExcel');
    if (exportButton) {
        exportButton.addEventListener('click', exportToExcel2);
    } else {
        console.error("El botón con ID 'exportExcel' no existe en el DOM.");
    }
});


// Alternar entre gráficos
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("temperature-tab").addEventListener('click', () => {
        document.getElementById("temperature-tab").classList.add('active');
        document.getElementById("distribution-tab").classList.remove('active');
        document.getElementById("temperature-tables").classList.remove('active');
        document.getElementById("chartContainer").style.display = 'block';
        document.getElementById("distributionChart").style.display = 'none';
        document.getElementById("tableContainer").style.display = 'none';
    });
});

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("distribution-tab").addEventListener('click', () => {
        document.getElementById("temperature-tab").classList.remove('active');
        document.getElementById("temperature-tables").classList.remove('active');
        document.getElementById("distribution-tab").classList.add('active');
        document.getElementById("chartContainer").style.display = 'none';
        document.getElementById("tableContainer").style.display = 'none';
        document.getElementById("distributionChart").style.display = 'block';
    });
});

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("temperature-tables").addEventListener('click', () => {
        document.getElementById("temperature-tab").classList.remove('active');
        document.getElementById("temperature-tables").classList.add('active');
        document.getElementById("distribution-tab").classList.remove('active');
        document.getElementById("chartContainer").style.display = 'none';
        document.getElementById("tableContainer").style.display = 'block';
        document.getElementById("distributionChart").style.display = 'none';
    });
});