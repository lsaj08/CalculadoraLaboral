/* 
 Created on : May 17, 2023, 11:14:25 AM
 Author     : larcejimenez
 */

function calcular() {
    document.getElementById("Resumen").hidden = false;
    document.getElementById("Data").hidden = true;
    var sueldoBruto = parseFloat(document.getElementById("sueldoBruto").value);
    var hijos = parseInt(document.getElementById("hijos").value, 10) || 0;
    var conyuge = document.getElementById("conyuge").checked;
    var resultado = calcularSalarioNeto(sueldoBruto, { hijos: hijos, conyuge: conyuge });

    document.getElementById("bruto").textContent = new Intl.NumberFormat('es-CR').format(sueldoBruto);
    rebajoCCSS(sueldoBruto);
    rebajoMH(sueldoBruto, { hijos: hijos, conyuge: conyuge });

    var montoQuincenal = resultado.salarioNeto / 2;
    
    document.getElementById("salarioNeto").textContent = formatearMonto(resultado.salarioNeto);
    document.getElementById("montoQuincenal").textContent = formatearMonto(montoQuincenal);
    document.getElementById("Otro").hidden = false;
} //función para calcular los rebajos

function rebajoCCSS(sueldoBruto) {
    var ccss = calcularCCSSTrabajador(sueldoBruto);
    var salario = Number(sueldoBruto) || 0;

    document.getElementById("ccss").textContent = formatearMonto(ccss);
    document.getElementById("rebajoSEM").textContent = formatearMonto(salario * COSTA_RICA_LABOR_RATES.ccss.trabajador.sem);
    document.getElementById("rebajoIVM").textContent = formatearMonto(salario * COSTA_RICA_LABOR_RATES.ccss.trabajador.ivm);
    document.getElementById("rebajoLPT").textContent = formatearMonto(salario * COSTA_RICA_LABOR_RATES.ccss.trabajador.bancoPopularLpt);
    document.getElementById("rebajoCCSS").textContent = formatearMonto(ccss);
    return ccss;
}

function rebajoMH(sueldoBruto, creditos) {
    var tramos = calcularDesgloseRenta(sueldoBruto);
    
    document.getElementById("fila-tracto1").hidden = tramos[0] === 0;
    document.getElementById("fila-tracto2").hidden = tramos[1] === 0;
    document.getElementById("fila-tracto3").hidden = tramos[2] === 0;
    document.getElementById("fila-tracto4").hidden = tramos[3] === 0;

    var ministerioHacienda = calcularRentaSalarial(sueldoBruto, creditos);
    document.getElementById("tracto1").textContent = formatearMonto(tramos[0]);
    document.getElementById("tracto2").textContent = formatearMonto(tramos[1]);
    document.getElementById("tracto3").textContent = formatearMonto(tramos[2]);
    document.getElementById("tracto4").textContent = formatearMonto(tramos[3]);
    document.getElementById("rebajoMH").textContent = formatearMonto(ministerioHacienda);
    document.getElementById("hacienda").textContent = formatearMonto(ministerioHacienda);
    
    return ministerioHacienda;
}

function calcularDesgloseRenta(sueldoBruto) {
    var salario = Number(sueldoBruto) || 0;
    return COSTA_RICA_LABOR_RATES.rentaSalarial.tramosMensuales
        .filter(function (tramo) { return tramo.tasa > 0; })
        .map(function (tramo) {
            if (salario <= tramo.desde) {
                return 0;
            }

            var limiteSuperior = Math.min(salario, tramo.hasta);
            return (limiteSuperior - tramo.desde) * tramo.tasa;
        });
}

function formatearMonto(monto) {
    return new Intl.NumberFormat('es-CR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Number(monto) || 0);
}

function otro(){
    location.reload();
}
