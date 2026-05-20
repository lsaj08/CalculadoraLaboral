/* 
 Created on : May 20, 2026
 Author     : larcejimenez
 */

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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        COSTA_RICA_LABOR_RATES,
        calcularCCSSTrabajador,
        calcularRentaSalarial,
        calcularSalarioNeto
    };
}

if (typeof window !== 'undefined') {
    window.COSTA_RICA_LABOR_RATES = COSTA_RICA_LABOR_RATES;
    window.calcularCCSSTrabajador = calcularCCSSTrabajador;
    window.calcularRentaSalarial = calcularRentaSalarial;
    window.calcularSalarioNeto = calcularSalarioNeto;
}
