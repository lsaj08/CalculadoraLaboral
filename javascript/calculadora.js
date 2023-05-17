/* 
 Created on : May 17, 2023, 11:14:25 AM
 Author     : larcejimenez
 */

function calcular() {
    document.getElementById("Resumen").hidden = false;
    document.getElementById("Data").hidden = true;
    var sueldoBruto = parseFloat(document.getElementById("sueldoBruto").value);
    document.getElementById("bruto").textContent = new Intl.NumberFormat('es-CR').format(sueldoBruto);
    var ccss = rebajoCCSS(sueldoBruto);
    var mh = rebajoMH(sueldoBruto);

    var salarioNeto = sueldoBruto - ccss - mh;
    var montoQuincenal = salarioNeto / 2;
    
    document.getElementById("salarioNeto").textContent = new Intl.NumberFormat('es-CR').format(salarioNeto.toFixed(2));
    document.getElementById("montoQuincenal").textContent = new Intl.NumberFormat('es-CR').format(montoQuincenal.toFixed(2));
    document.getElementById("Otro").hidden = false;
} //función para calcular los rebajos

function rebajoCCSS(sueldoBruto) {
    var ccss = sueldoBruto * 0.1067;
    document.getElementById("ccss").textContent = new Intl.NumberFormat('es-CR').format(ccss.toFixed(2));
    document.getElementById("rebajoCCSS").textContent = new Intl.NumberFormat('es-CR').format(ccss.toFixed(2));
    return ccss;
}

function rebajoMH(sueldoBruto) {
    var tracto1 = 0;
    var tracto2 = 0;
    var tracto3 = 0;
    var tracto4 = 0;
    
    if (sueldoBruto < 941000) {
        document.getElementById("fila-tracto1").hidden = true;
        document.getElementById("fila-tracto2").hidden = true;
        document.getElementById("fila-tracto3").hidden = true;
        document.getElementById("fila-tracto4").hidden = true;
    }
    if (941000 < sueldoBruto && sueldoBruto <= 1381000) {
        tracto1 = (sueldoBruto - 941000) * 0.10;
        document.getElementById("fila-tracto2").hidden = true;
        document.getElementById("fila-tracto3").hidden = true;
        document.getElementById("fila-tracto4").hidden = true;
    }
    if (1381000 < sueldoBruto && sueldoBruto <= 2423000) {
        tracto1 = 44000;
        tracto2 = (sueldoBruto - 1381000) * 0.15;
        document.getElementById("fila-tracto3").hidden = true;
        document.getElementById("fila-tracto4").hidden = true;
    }
    if (2423000 < sueldoBruto && sueldoBruto <= 4845000) {
        tracto1 = 44000;
        tracto2 = 156200;
        tracto3 = (sueldoBruto - 2423000) * 0.20;
        document.getElementById("fila-tracto4").hidden = true;
    }
    if (sueldoBruto > 4845000) {
        tracto1 = 44000;
        tracto2 = 156200;
        tracto3 = 484400;
        tracto4 = (sueldoBruto - 4845000) * 0.25;
    }

    var ministerioHacienda = tracto1 + tracto2 + tracto3 + tracto4;
    document.getElementById("tracto1").textContent = new Intl.NumberFormat('es-CR').format(tracto1.toFixed(2));
    document.getElementById("tracto2").textContent = new Intl.NumberFormat('es-CR').format(tracto2.toFixed(2));
    document.getElementById("tracto3").textContent = new Intl.NumberFormat('es-CR').format(tracto3.toFixed(2));
    document.getElementById("tracto4").textContent = new Intl.NumberFormat('es-CR').format(tracto4.toFixed(2));
    document.getElementById("rebajoMH").textContent = new Intl.NumberFormat('es-CR').format(ministerioHacienda.toFixed(2));
    document.getElementById("hacienda").textContent = new Intl.NumberFormat('es-CR').format(ministerioHacienda.toFixed(2));    
    
    return ministerioHacienda;
}

function otro(){
    location.reload();
}