const test = require('node:test');
const assert = require('node:assert/strict');

const {
    COSTA_RICA_LABOR_RATES,
    calcularCCSSTrabajador,
    calcularRentaSalarial,
    calcularSalarioNeto
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
