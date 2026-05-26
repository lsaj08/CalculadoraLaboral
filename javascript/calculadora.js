/* 
 Created on : May 17, 2023, 11:14:25 AM
 Author     : larcejimenez
 */

window.addEventListener("DOMContentLoaded", function () {
    var selectorMoneda = document.getElementById("monedaSalario");
    var sueldoInput = document.getElementById("sueldoBruto");

    selectorMoneda.addEventListener("change", actualizarTextoBoton);
    sueldoInput.addEventListener("input", formatearSueldoEnVivo);
    actualizarTextoBoton();
});

async function calcular() {
    limpiarMensajeError();
    limpiarResultados();
    document.getElementById("Resumen").hidden = true;
    document.getElementById("detalleTipoCambio").hidden = true;

    var sueldoIngresado = parseFormattedNumber(document.getElementById("sueldoBruto").value);
    var moneda = document.getElementById("monedaSalario").value;

    if (!Number.isFinite(sueldoIngresado)) {
        mostrarError("Ingrese el salario bruto mensual.");
        return;
    }

    if (sueldoIngresado <= 0) {
        mostrarError("El salario debe ser mayor a cero.");
        return;
    }

    var tipoCambio = null;
    var infoTipoCambio = null;

    if (moneda === "USD") {
        try {
            activarEstadoCarga(true);
            infoTipoCambio = await obtenerTipoCambioCompraDolar();
            tipoCambio = infoTipoCambio.valor;
        } catch (error) {
            mostrarError(error.message || "No fue posible consultar el tipo de cambio actualizado. Intente nuevamente.");
            return;
        } finally {
            activarEstadoCarga(false);
        }
    }

    var salarioBrutoColones;

    try {
        salarioBrutoColones = convertirSalarioAColones(sueldoIngresado, moneda, tipoCambio);
    } catch (error) {
        mostrarError(error.message || "No fue posible calcular el salario.");
        return;
    }

    if (!salarioCumpleMinimoMensual(salarioBrutoColones)) {
        mostrarError(obtenerMensajeSalarioMinimoMensual());
        return;
    }

    var resultado;

    try {
        resultado = calcularSalarioNetoDesdeEntrada(sueldoIngresado, moneda, tipoCambio);
    } catch (error) {
        mostrarError(error.message || "No fue posible calcular el salario.");
        return;
    }

    document.getElementById("Resumen").hidden = false;
    document.getElementById("Data").hidden = true;

    mostrarDetalleTipoCambio(resultado, infoTipoCambio);

    document.getElementById("bruto").textContent = formatearMonto(resultado.salarioBrutoColones);
    rebajoCCSS(resultado.salarioBrutoColones);
    rebajoMH(resultado.salarioBrutoColones);

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

function rebajoMH(sueldoBruto) {
    var tramos = calcularDesgloseRenta(sueldoBruto);
    
    document.getElementById("fila-tracto1").hidden = tramos[0] === 0;
    document.getElementById("fila-tracto2").hidden = tramos[1] === 0;
    document.getElementById("fila-tracto3").hidden = tramos[2] === 0;
    document.getElementById("fila-tracto4").hidden = tramos[3] === 0;

    var ministerioHacienda = calcularRentaSalarial(sueldoBruto);
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

function formatearDolares(monto) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Number(monto) || 0);
}

function mostrarDetalleTipoCambio(resultado, infoTipoCambio) {
    var detalle = document.getElementById("detalleTipoCambio");

    if (resultado.moneda !== "USD") {
        detalle.hidden = true;
        detalle.textContent = "";
        return;
    }

    var mensajeCache = infoTipoCambio && infoTipoCambio.desdeCache
        ? "Usando último tipo de cambio consultado: ₡" + formatearMonto(resultado.tipoCambioCompra)
        : "Tipo de cambio compra: $1 -> ₡" + formatearMonto(resultado.tipoCambioCompra);

    detalle.innerHTML = ""
        + "<p>Salario en dólares: $" + formatearDolares(resultado.salarioIngresado) + "</p>"
        + "<p>" + mensajeCache + "</p>"
        + "<p>Fuente: Ministerio de Hacienda</p>";
    detalle.hidden = false;
}

function mostrarError(mensaje) {
    var mensajeError = document.getElementById("mensajeError");
    mensajeError.textContent = mensaje;
    mensajeError.hidden = false;
}

function limpiarMensajeError() {
    var mensajeError = document.getElementById("mensajeError");
    mensajeError.textContent = "";
    mensajeError.hidden = true;
}

function limpiarResultados() {
    var idsMontos = [
        "bruto",
        "ccss",
        "hacienda",
        "salarioNeto",
        "montoQuincenal",
        "rebajoSEM",
        "rebajoIVM",
        "rebajoLPT",
        "rebajoCCSS",
        "tracto1",
        "tracto2",
        "tracto3",
        "tracto4",
        "rebajoMH"
    ];

    idsMontos.forEach(function (id) {
        document.getElementById(id).textContent = formatearMonto(0);
    });

    document.getElementById("detalleTipoCambio").textContent = "";
    document.getElementById("Otro").hidden = true;
}

function activarEstadoCarga(estaCargando) {
    var boton = document.getElementById("botonCalcular");
    boton.disabled = estaCargando;
    boton.textContent = estaCargando ? "Consultando tipo de cambio..." : textoBotonPorMoneda();
}

function actualizarTextoBoton() {
    document.getElementById("botonCalcular").textContent = textoBotonPorMoneda();
}

function textoBotonPorMoneda() {
    return document.getElementById("monedaSalario").value === "USD" ? "Consultar" : "Calcular";
}

function formatearSueldoEnVivo(event) {
    var input = event.target;
    var cursorOriginal = input.selectionStart || 0;
    var digitosAntesCursor = contarCaracteresNumericos(input.value.slice(0, cursorOriginal));
    var valorFormateado = formatNumberWithSpaces(input.value);

    input.value = valorFormateado;
    var nuevoCursor = obtenerPosicionPorDigitos(valorFormateado, digitosAntesCursor);
    input.setSelectionRange(nuevoCursor, nuevoCursor);
}

function contarCaracteresNumericos(valor) {
    return (valor.match(/\d/g) || []).length;
}

function obtenerPosicionPorDigitos(valor, cantidadDigitos) {
    if (cantidadDigitos <= 0) {
        return 0;
    }

    var digitosVistos = 0;

    for (var i = 0; i < valor.length; i++) {
        if (/\d/.test(valor[i])) {
            digitosVistos++;
        }

        if (digitosVistos >= cantidadDigitos) {
            return i + 1;
        }
    }

    return valor.length;
}

function otro(){
    location.reload();
}
