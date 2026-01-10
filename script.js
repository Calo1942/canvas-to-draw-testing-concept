// ==============================================
// CONFIGURACIÓN Y VARIABLES GLOBALES
// ==============================================

const imageLoader = document.getElementById('imageLoader');
const resetButton = document.getElementById('resetButton');
const widthInput = document.getElementById('canvasWidth');
const heightInput = document.getElementById('canvasHeight');
const ratioInput = document.getElementById('canvasRatio');
const grayscaleButton = document.getElementById('grayscaleButton');
const resetZoomButton = document.getElementById('resetZoomButton');

const columnsInput = document.getElementById('imgColumns');
const rowsInput = document.getElementById('imgRows');
const linesColorInput = document.getElementById('linesColor');
const linesWidthInput = document.getElementById('linesWidth');
const linesOpacityInput = document.getElementById('linesOpacity');

const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');

let originalImage = new Image();
let currentImage = new Image();
let scale = 1;

const config = {
    columnas: 3,
    filas: 3,
    colorLineas: '#0f0',
    grosorLineas: 2,
    opacidadLineas: 1,
};

// ==============================================
// FUNCIONES DE UTILIDAD
// ==============================================

/**
 * Calcula el MCD usando el algoritmo de Euclides
 */
function calcularMCD(a, b) {
    while (b !== 0) {
        let temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}

/**
 * Calcula la proporción simplificada de ancho:alto
 */
function calcularProporcion(ancho, alto) {
    if (ancho <= 0 || alto <= 0) {
        return "Error: Los valores deben ser positivos.";
    }

    const mcd = calcularMCD(ancho, alto);
    const ratioAncho = ancho / mcd;
    const ratioAlto = alto / mcd;

    return `${ratioAncho}:${ratioAlto}`;
}

/**
 * Actualiza el texto de proporción en el input
 */
function updateAspectRatioText() {
    const w = parseFloat(widthInput.value);
    const h = parseFloat(heightInput.value);
    if (!isNaN(w) && !isNaN(h)) {
        ratioInput.value = calcularProporcion(w, h);
    }
}

/**
 * Actualiza el zoom visual del canvas
 */
function updateZoom() {
    canvas.style.width = (canvas.width * scale) + 'px';
    canvas.style.height = (canvas.height * scale) + 'px';
}

// ==============================================
// FUNCIONES DE DIBUJO
// ==============================================

/**
 * Dibuja una cuadrícula sobre el canvas con configuración personalizada
 */
function dibujarCuadricula() {
    const { columnas, filas, colorLineas, grosorLineas, opacidadLineas } = config;
    const ancho = canvas.width;
    const alto = canvas.height;

    // Configurar color con opacidad
    const rgbaColor = hexToRgba(colorLineas, opacidadLineas);
    ctx.strokeStyle = rgbaColor;
    ctx.lineWidth = grosorLineas;

    // Calcular tamaño de celdas
    const tamañoCeldaAncho = ancho / columnas;
    const tamañoCeldaAlto = alto / filas;

    // Líneas verticales (columnas)
    for (let col = 1; col < columnas; col++) {
        const x = Math.floor(col * tamañoCeldaAncho) + 0.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, alto);
        ctx.stroke();
    }

    // Líneas horizontales (filas)
    for (let fila = 1; fila < filas; fila++) {
        const y = Math.floor(fila * tamañoCeldaAlto) + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(ancho, y);
        ctx.stroke();
    }
}

/**
 * Convierte color hexadecimal a RGBA con opacidad
 */
function hexToRgba(hex, opacity) {
    // Eliminar el # si existe
    hex = hex.replace('#', '');
    
    // Convertir valores hex a decimal
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Actualiza la configuración de las líneas desde los controles
 */
function actualizarConfiguracionLineas() {
    config.columnas = parseInt(columnsInput.value) || 3;
    config.filas = parseInt(rowsInput.value) || 3;
    config.colorLineas = linesColorInput.value;
    config.grosorLineas = parseInt(linesWidthInput.value) || 2;
    config.opacidadLineas = parseFloat(linesOpacityInput.value) || 1;
    
    // Validar valores mínimos
    if (config.columnas < 1) config.columnas = 1;
    if (config.filas < 1) config.filas = 1;
    if (config.grosorLineas < 1) config.grosorLineas = 1;
    if (config.opacidadLineas < 0) config.opacidadLineas = 0;
    if (config.opacidadLineas > 1) config.opacidadLineas = 1;
    
    // Actualizar controles con valores validados
    columnsInput.value = config.columnas;
    rowsInput.value = config.filas;
    linesWidthInput.value = config.grosorLineas;
    linesOpacityInput.value = config.opacidadLineas;
}

/**
 * Redibuja la imagen actual con la nueva cuadrícula
 */
function redibujarConCuadricula() {
    if (!currentImage.src) return;
    
    // Guardar estado actual de la imagen
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempCtx.drawImage(canvas, 0, 0);
    
    // Limpiar y redibujar
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tempCanvas, 0, 0);
    dibujarCuadricula();
}



/**
 * Carga y dibuja una imagen en el canvas con el aspecto especificado
 */
function loadImageToCanvas(img) {
    const desiredWidthCm = parseFloat(widthInput.value) || 30;
    const desiredHeightCm = parseFloat(heightInput.value) || 40;
    const targetAspectRatio = desiredWidthCm / desiredHeightCm;

    const imgWidth = img.width;
    const imgHeight = img.height;
    const imgAspectRatio = imgWidth / imgHeight;

    let canvasWidth, canvasHeight;

    if (imgAspectRatio > targetAspectRatio) {
        canvasWidth = imgWidth;
        canvasHeight = imgWidth / targetAspectRatio;
    } else {
        canvasHeight = imgHeight;
        canvasWidth = imgHeight * targetAspectRatio;
    }

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const x = (canvasWidth - imgWidth) / 2;
    const y = (canvasHeight - imgHeight) / 2;

    ctx.drawImage(img, x, y, imgWidth, imgHeight);
    dibujarCuadricula();
    updateAspectRatioText();
}

/**
 * Filtro de escala de grises
 */
function grayscaleFilter(r, g, b, a) {
    const avg = (r + g + b) / 3;
    return { r: avg, g: avg, b: avg, a: a };
}

/**
 * Procesa la imagen actual con un filtro
 */
function processImage(filterFunction) {
    if (!originalImage.src) {
        alert('Por favor, carga una imagen primero.');
        return;
    }

    loadImageToCanvas(currentImage);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];

        const newColors = filterFunction(r, g, b, a);
        pixels[i] = newColors.r;
        pixels[i + 1] = newColors.g;
        pixels[i + 2] = newColors.b;
        pixels[i + 3] = newColors.a;
    }

    ctx.putImageData(imageData, 0, 0);
    currentImage.src = canvas.toDataURL();
}

/**
 * Recarga el layout del canvas cuando cambian las medidas
 */
function refreshCanvasLayout() {
    if (currentImage.src && originalImage.complete) {
        loadImageToCanvas(originalImage);
    }
    updateAspectRatioText();
}

// ==============================================
// MANEJO DE EVENTOS
// ==============================================

// Cargar imagen
imageLoader.addEventListener('change', function (e) {
    const reader = new FileReader();
    reader.onload = function (event) {
        originalImage.onload = function () {
            currentImage.src = originalImage.src;
            loadImageToCanvas(originalImage);
        };
        originalImage.src = event.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);
});

// Zoom con teclado
document.addEventListener('keydown', (e) => {
    if (!originalImage.src) return;

    if (e.key === '+' || e.key === 'Equal' || e.key === 'Add') {
        scale += 0.1;
        updateZoom();
    } else if (e.key === '-' || e.key === 'Minus' || e.key === 'Subtract') {
        scale = Math.max(0.1, scale - 0.1);
        updateZoom();
    }
});

// Botón escala de grises
grayscaleButton.addEventListener('click', () => {
    processImage(grayscaleFilter);
});

// Botón restablecer imagen
resetButton.addEventListener('click', () => {
    if (originalImage.src) {
        currentImage.src = originalImage.src;
        loadImageToCanvas(originalImage);
    } else {
        alert('No hay imagen para restablecer.');
    }
});

// Botón restablecer zoom
resetZoomButton.addEventListener('click', () => {
    scale = 1;
    updateZoom();
});

// Cambios en dimensiones del canvas
widthInput.addEventListener('change', refreshCanvasLayout);
heightInput.addEventListener('change', refreshCanvasLayout);

// Eventos para controles de líneas
columnsInput.addEventListener('change', function() {
    actualizarConfiguracionLineas();
    redibujarConCuadricula();
});

rowsInput.addEventListener('change', function() {
    actualizarConfiguracionLineas();
    redibujarConCuadricula();
});

linesColorInput.addEventListener('change', function() {
    actualizarConfiguracionLineas();
    redibujarConCuadricula();
});

linesWidthInput.addEventListener('change', function() {
    actualizarConfiguracionLineas();
    redibujarConCuadricula();
});

linesOpacityInput.addEventListener('change', function() {
    actualizarConfiguracionLineas();
    redibujarConCuadricula();
});

// ==============================================
// INICIALIZACIÓN
// ==============================================

// Inicializar controles con valores por defecto
columnsInput.value = config.columnas;
rowsInput.value = config.filas;
linesColorInput.value = config.colorLineas;
linesWidthInput.value = config.grosorLineas;
linesOpacityInput.value = config.opacidadLineas;

dibujarCuadricula();
updateAspectRatioText();