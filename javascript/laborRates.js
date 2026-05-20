/* 
 Created on : May 20, 2026
 Author     : larcejimenez
 */

const EXCHANGE_RATE_API_URL = 'https://api.hacienda.go.cr/indicadores/tc/dolar';
const EXCHANGE_RATE_CACHE_KEY = 'calculadoraLaboral.tipoCambioDolar';
const EXCHANGE_RATE_CACHE_TTL_MS = 60 * 60 * 1000;

const COSTA_RICA_LABOR_RATES = {
    actualizadoAl: '2026-05-20',
    periodoFiscal: 2026,
    ccss: {
        trabajador: {
            sem: 0.055,
            ivm: 0.0433,
            bancoPopularLpt: 0.01,
            total: 0.1083
        },
        patronoReferencial: {
            sem: 0.0925,
            ivm: 0.0558,
            bancoPopularCuotaPatronal: 0.0025,
            asignacionesFamiliaresFodesaf: 0.05,
            imas: 0.005,
            ina: 0.015,
            bancoPopularLptPatrono: 0.0025,
            fondoCapitalizacionLaboral: 0.015,
            fondoPensionesComplementarias: 0.02,
            insRiesgosTrabajoReferencial: 0.01,
            total: 0.2683
        },
        totalObreroPatronalReferencial: 0.3766
    },
    rentaSalarial: {
        tramosMensuales: [
            { desde: 0, hasta: 918000, tasa: 0 },
            { desde: 918000, hasta: 1347000, tasa: 0.10 },
            { desde: 1347000, hasta: 2364000, tasa: 0.15 },
            { desde: 2364000, hasta: 4727000, tasa: 0.20 },
            { desde: 4727000, hasta: Infinity, tasa: 0.25 }
        ],
        creditosMensuales: {
            hijo: 1710,
            conyuge: 2590
        }
    }
};

// Fuente renta: Ministerio de Hacienda, Tramos de renta periodo fiscal 2026.
// Fuente CCSS: Calculadora patronal / informacion para patronos CCSS, cuotas vigentes 2026.
// Fecha de actualizacion: 2026-05-20.

function redondearColones(monto) {
    return Math.round((Number(monto) + Number.EPSILON) * 100) / 100;
}

function limpiarNumeroFormateable(value) {
    const raw = String(value == null ? '' : value);
    let limpio = '';
    let tieneDecimal = false;

    for (let i = 0; i < raw.length; i++) {
        const caracter = raw[i];

        if (/\d/.test(caracter)) {
            limpio += caracter;
            continue;
        }

        if (caracter === '.' && !tieneDecimal) {
            limpio += caracter;
            tieneDecimal = true;
        }
    }

    return limpio;
}

function formatNumberWithSpaces(value) {
    const limpio = limpiarNumeroFormateable(value);
    const partes = limpio.split('.');
    const entero = partes[0];

    if (!entero && partes.length === 1) {
        return '';
    }

    const enteroFormateado = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

    if (partes.length > 1) {
        return enteroFormateado + '.' + partes.slice(1).join('');
    }

    return enteroFormateado;
}

function parseFormattedNumber(value) {
    const limpio = limpiarNumeroFormateable(value);

    if (limpio === '' || limpio === '.') {
        return NaN;
    }

    return Number(limpio);
}

function calcularCCSSTrabajador(salarioBruto) {
    return redondearColones(Number(salarioBruto) * COSTA_RICA_LABOR_RATES.ccss.trabajador.total);
}

function calcularRentaBrutaProgresiva(salarioBruto) {
    const salario = Number(salarioBruto);

    return COSTA_RICA_LABOR_RATES.rentaSalarial.tramosMensuales.reduce(function (total, tramo) {
        if (salario <= tramo.desde) {
            return total;
        }

        const limiteSuperior = Math.min(salario, tramo.hasta);
        const baseTramo = limiteSuperior - tramo.desde;
        return total + (baseTramo * tramo.tasa);
    }, 0);
}

function calcularRentaSalarial(salarioBruto, creditos) {
    const opcionesCreditos = creditos || {};
    const hijos = Math.max(0, Number(opcionesCreditos.hijos) || 0);
    const conyuge = opcionesCreditos.conyuge ? 1 : 0;
    const creditosAplicables = (hijos * COSTA_RICA_LABOR_RATES.rentaSalarial.creditosMensuales.hijo) +
        (conyuge * COSTA_RICA_LABOR_RATES.rentaSalarial.creditosMensuales.conyuge);
    const impuesto = calcularRentaBrutaProgresiva(salarioBruto) - creditosAplicables;

    return redondearColones(Math.max(0, impuesto));
}

function calcularSalarioNeto(salarioBruto, creditos) {
    const salario = Number(salarioBruto) || 0;
    const ccssTrabajador = calcularCCSSTrabajador(salario);
    const renta = calcularRentaSalarial(salario, creditos);

    return {
        salarioBruto: salario,
        ccssTrabajador: ccssTrabajador,
        renta: renta,
        salarioNeto: redondearColones(salario - ccssTrabajador - renta)
    };
}

function normalizarMoneda(moneda) {
    return String(moneda || 'CRC').toUpperCase();
}

function convertirSalarioAColones(salarioIngresado, moneda, tipoCambioCompra) {
    const salario = Number(salarioIngresado);
    const monedaNormalizada = normalizarMoneda(moneda);

    if (!Number.isFinite(salario) || salario <= 0) {
        throw new Error('El salario debe ser mayor a cero.');
    }

    if (monedaNormalizada === 'CRC') {
        return redondearColones(salario);
    }

    const tipoCambio = Number(tipoCambioCompra);
    if (monedaNormalizada === 'USD' && (!Number.isFinite(tipoCambio) || tipoCambio <= 0)) {
        throw new Error('El tipo de cambio debe ser mayor a cero.');
    }

    if (monedaNormalizada !== 'USD') {
        throw new Error('Moneda no soportada.');
    }

    return redondearColones(salario * tipoCambio);
}

function calcularSalarioNetoDesdeEntrada(salarioIngresado, moneda, tipoCambioCompra) {
    const salarioBrutoColones = convertirSalarioAColones(salarioIngresado, moneda, tipoCambioCompra);
    const resultado = calcularSalarioNeto(salarioBrutoColones);

    return {
        salarioIngresado: Number(salarioIngresado),
        moneda: normalizarMoneda(moneda),
        tipoCambioCompra: normalizarMoneda(moneda) === 'USD' ? Number(tipoCambioCompra) : null,
        salarioBrutoColones: resultado.salarioBruto,
        ccssTrabajador: resultado.ccssTrabajador,
        renta: resultado.renta,
        salarioNeto: resultado.salarioNeto
    };
}

function extraerCompraDolarHacienda(respuesta) {
    const valorCompra = Number(respuesta && respuesta.compra && respuesta.compra.valor);

    if (!Number.isFinite(valorCompra) || valorCompra <= 0) {
        throw new Error('La respuesta de Hacienda no incluye un tipo de cambio de compra valido.');
    }

    return valorCompra;
}

function leerTipoCambioCache(storage, now) {
    if (!storage) {
        return null;
    }

    try {
        const item = storage.getItem(EXCHANGE_RATE_CACHE_KEY);
        if (!item) {
            return null;
        }

        const cache = JSON.parse(item);
        const valor = Number(cache.valor);
        const consultadoEn = Number(cache.consultadoEn);

        if (!Number.isFinite(valor) || valor <= 0 || !Number.isFinite(consultadoEn)) {
            return null;
        }

        if (now() - consultadoEn > EXCHANGE_RATE_CACHE_TTL_MS) {
            return null;
        }

        return {
            valor: valor,
            fuente: cache.fuente || 'Ministerio de Hacienda',
            desdeCache: true
        };
    } catch (error) {
        return null;
    }
}

function guardarTipoCambioCache(storage, valor, now) {
    if (!storage) {
        return;
    }

    try {
        storage.setItem(EXCHANGE_RATE_CACHE_KEY, JSON.stringify({
            valor: valor,
            consultadoEn: now(),
            fuente: 'Ministerio de Hacienda'
        }));
    } catch (error) {
        // La app puede seguir calculando aunque el navegador bloquee storage.
    }
}

async function obtenerTipoCambioCompraDolar(opciones) {
    const opts = opciones || {};
    const fetchFn = opts.fetchFn || (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : null);
    const storage = opts.storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    const now = opts.now || Date.now;

    if (!opts.ignorarCacheVigente) {
        const cacheVigente = leerTipoCambioCache(storage, now);
        if (cacheVigente) {
            return cacheVigente;
        }
    }

    if (!fetchFn) {
        const cacheSinFetch = leerTipoCambioCache(storage, now);
        if (cacheSinFetch) {
            return cacheSinFetch;
        }

        throw new Error('No fue posible consultar el tipo de cambio actualizado. Intente nuevamente.');
    }

    try {
        const response = await fetchFn(EXCHANGE_RATE_API_URL);
        if (!response || !response.ok) {
            throw new Error('Respuesta invalida de Hacienda.');
        }

        const data = await response.json();
        const valor = extraerCompraDolarHacienda(data);
        guardarTipoCambioCache(storage, valor, now);

        return {
            valor: valor,
            fuente: 'Ministerio de Hacienda',
            desdeCache: false
        };
    } catch (error) {
        const cacheFallback = leerTipoCambioCache(storage, now);
        if (cacheFallback) {
            return cacheFallback;
        }

        throw new Error('No fue posible consultar el tipo de cambio actualizado. Intente nuevamente.');
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        EXCHANGE_RATE_API_URL,
        COSTA_RICA_LABOR_RATES,
        calcularCCSSTrabajador,
        calcularRentaSalarial,
        calcularSalarioNeto,
        calcularSalarioNetoDesdeEntrada,
        convertirSalarioAColones,
        extraerCompraDolarHacienda,
        formatNumberWithSpaces,
        parseFormattedNumber,
        obtenerTipoCambioCompraDolar
    };
}

if (typeof window !== 'undefined') {
    window.EXCHANGE_RATE_API_URL = EXCHANGE_RATE_API_URL;
    window.COSTA_RICA_LABOR_RATES = COSTA_RICA_LABOR_RATES;
    window.calcularCCSSTrabajador = calcularCCSSTrabajador;
    window.calcularRentaSalarial = calcularRentaSalarial;
    window.calcularSalarioNeto = calcularSalarioNeto;
    window.calcularSalarioNetoDesdeEntrada = calcularSalarioNetoDesdeEntrada;
    window.convertirSalarioAColones = convertirSalarioAColones;
    window.extraerCompraDolarHacienda = extraerCompraDolarHacienda;
    window.formatNumberWithSpaces = formatNumberWithSpaces;
    window.parseFormattedNumber = parseFormattedNumber;
    window.obtenerTipoCambioCompraDolar = obtenerTipoCambioCompraDolar;
}
