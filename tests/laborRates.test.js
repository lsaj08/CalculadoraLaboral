const test = require('node:test');
const assert = require('node:assert/strict');

const {
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
} = require('../javascript/laborRates');

test('calcula CCSS trabajador al 10.83%', () => {
    assert.equal(calcularCCSSTrabajador(1000000), 108300);
    assert.equal(COSTA_RICA_LABOR_RATES.ccss.trabajador.total, 0.1083);
});

test('no cobra renta bajo el minimo exento', () => {
    assert.equal(calcularRentaSalarial(900000), 0);
});

test('no cobra renta exactamente en 918000', () => {
    assert.equal(calcularRentaSalarial(918000), 0);
});

test('calcula renta progresiva entre 918000 y 1347000', () => {
    assert.equal(calcularRentaSalarial(1000000), 8200);
});

test('calcula renta progresiva entre 1347000 y 2364000', () => {
    assert.equal(calcularRentaSalarial(1500000), 65850);
});

test('calcula renta progresiva entre 2364000 y 4727000', () => {
    assert.equal(calcularRentaSalarial(3000000), 322650);
});

test('calcula renta progresiva sobre 4727000', () => {
    assert.equal(calcularRentaSalarial(5000000), 736300);
});

test('aplica creditos fiscales por hijo y conyuge sin bajar de cero', () => {
    assert.equal(calcularRentaSalarial(1000000, { hijos: 2, conyuge: true }), 2190);
    assert.equal(calcularRentaSalarial(920000, { hijos: 2, conyuge: true }), 0);
});

test('calcula salario neto con bruto menos CCSS trabajador menos renta', () => {
    const resultado = calcularSalarioNeto(1000000);

    assert.deepEqual(resultado, {
        salarioBruto: 1000000,
        ccssTrabajador: 108300,
        renta: 8200,
        salarioNeto: 883500
    });
});

test('convierte salario en dolares a colones usando tipo de cambio simulado', () => {
    assert.equal(convertirSalarioAColones(4000, 'USD', 450), 1800000);
});

test('no convierte salario cuando la moneda es colones', () => {
    assert.equal(convertirSalarioAColones(1000000, 'CRC', 450), 1000000);
});

test('calcula CCSS sobre salario convertido desde dolares', () => {
    const resultado = calcularSalarioNetoDesdeEntrada(4000, 'USD', 450);

    assert.equal(resultado.salarioBrutoColones, 1800000);
    assert.equal(resultado.ccssTrabajador, 194940);
});

test('calcula renta sobre salario convertido desde dolares', () => {
    const resultado = calcularSalarioNetoDesdeEntrada(4000, 'USD', 450);

    assert.equal(resultado.renta, 110850);
});

test('calcula salario neto con moneda dolares', () => {
    const resultado = calcularSalarioNetoDesdeEntrada(4000, 'USD', 450);

    assert.equal(resultado.salarioNeto, 1494210);
});

test('calcula salario neto con moneda colones sin tipo de cambio', () => {
    const resultado = calcularSalarioNetoDesdeEntrada(1000000, 'CRC');

    assert.equal(resultado.salarioBrutoColones, 1000000);
    assert.equal(resultado.salarioNeto, 883500);
});

test('calcula renta sin creditos fiscales visibles por defecto', () => {
    assert.equal(calcularRentaSalarial(1000000), 8200);
});

test('extrae compra del dolar desde el JSON real de Hacienda', () => {
    const respuestaHacienda = {
        venta: { fecha: '2026-05-20', valor: 454.22 },
        compra: { fecha: '2026-05-20', valor: 449.66 }
    };

    assert.equal(extraerCompraDolarHacienda(respuestaHacienda), 449.66);
});

test('rechaza respuesta de API sin compra valida', () => {
    assert.throws(
        () => extraerCompraDolarHacienda({ compra: { fecha: '2026-05-20', valor: 0 } }),
        /tipo de cambio de compra/
    );
});

test('consulta tipo de cambio y guarda cache', async () => {
    const cache = new Map();
    const fetchMock = async () => ({
        ok: true,
        json: async () => ({ compra: { fecha: '2026-05-20', valor: 449.66 } })
    });

    const resultado = await obtenerTipoCambioCompraDolar({
        fetchFn: fetchMock,
        storage: crearStorageMock(cache),
        now: () => 1779285600000
    });

    assert.deepEqual(resultado, {
        valor: 449.66,
        fuente: 'Ministerio de Hacienda',
        desdeCache: false
    });
    assert.match(cache.get('calculadoraLaboral.tipoCambioDolar'), /449.66/);
});

test('reutiliza cache vigente y no llama API', async () => {
    const cache = new Map();
    cache.set('calculadoraLaboral.tipoCambioDolar', JSON.stringify({
        valor: 449.66,
        consultadoEn: 1779285600000,
        fuente: 'Ministerio de Hacienda'
    }));

    const resultado = await obtenerTipoCambioCompraDolar({
        fetchFn: async () => { throw new Error('no debe llamar API'); },
        storage: crearStorageMock(cache),
        now: () => 1779287400000
    });

    assert.equal(resultado.valor, 449.66);
    assert.equal(resultado.desdeCache, true);
});

test('usa cache reciente si la API falla', async () => {
    const cache = new Map();
    cache.set('calculadoraLaboral.tipoCambioDolar', JSON.stringify({
        valor: 449.66,
        consultadoEn: 1779285600000,
        fuente: 'Ministerio de Hacienda'
    }));

    const resultado = await obtenerTipoCambioCompraDolar({
        fetchFn: async () => { throw new Error('API fuera de servicio'); },
        storage: crearStorageMock(cache),
        now: () => 1779287400000,
        ignorarCacheVigente: true
    });

    assert.equal(resultado.valor, 449.66);
    assert.equal(resultado.desdeCache, true);
});

test('lanza error cuando API falla y no hay cache valido', async () => {
    await assert.rejects(
        obtenerTipoCambioCompraDolar({
            fetchFn: async () => { throw new Error('API fuera de servicio'); },
            storage: crearStorageMock(new Map()),
            now: () => 1779287400000
        }),
        /No fue posible consultar/
    );
});

test('formatea enteros con espacios cada 3 digitos', () => {
    assert.equal(formatNumberWithSpaces('1000'), '1 000');
    assert.equal(formatNumberWithSpaces('10000'), '10 000');
    assert.equal(formatNumberWithSpaces('100000'), '100 000');
    assert.equal(formatNumberWithSpaces('1000000'), '1 000 000');
    assert.equal(formatNumberWithSpaces('2342423'), '2 342 423');
});

test('parsea numeros formateados con espacios', () => {
    assert.equal(parseFormattedNumber('2 342 423'), 2342423);
});

test('input vacio no falla al formatear ni parsear', () => {
    assert.equal(formatNumberWithSpaces(''), '');
    assert.equal(parseFormattedNumber(''), NaN);
});

test('limpia letras y simbolos al formatear', () => {
    assert.equal(formatNumberWithSpaces('abc1x2#34'), '1 234');
});

test('formatea solo la parte entera cuando hay decimales', () => {
    assert.equal(formatNumberWithSpaces('4000.50'), '4 000.50');
    assert.equal(formatNumberWithSpaces('1000000.75'), '1 000 000.75');
});

test('calcula salario con un valor visualmente formateado', () => {
    const salario = parseFormattedNumber('1 000 000');
    const resultado = calcularSalarioNetoDesdeEntrada(salario, 'CRC');

    assert.equal(resultado.salarioNeto, 883500);
});

function crearStorageMock(cache) {
    return {
        getItem: (key) => cache.get(key) || null,
        setItem: (key, value) => cache.set(key, value),
        removeItem: (key) => cache.delete(key)
    };
}
