# Calculadora Laboral

Calculadora Laboral es una aplicación web estática para Costa Rica que permite estimar el salario neto mensual a partir de un sueldo bruto mensual.

La app considera la deducción de CCSS del trabajador, el impuesto sobre la renta salarial y, cuando el salario se ingresa en dólares, la conversión automática a colones usando el tipo de cambio de compra publicado por la API pública del Ministerio de Hacienda.

## Funcionalidades principales

- Ingreso de sueldo bruto mensual.
- Selección de moneda: colones o dólares.
- Consulta del tipo de cambio de compra del dólar desde la API pública de Hacienda cuando se selecciona dólares.
- Conversión automática de USD a CRC.
- Cálculo de CCSS del trabajador.
- Cálculo progresivo del impuesto sobre la renta salarial.
- Resumen con salario bruto, CCSS, Ministerio de Hacienda, salario neto y monto quincenal.
- Formato visual del salario en grupos de tres dígitos mientras se escribe.

## Tecnologías

- HTML5
- CSS3
- JavaScript puro
- API pública de Hacienda de Costa Rica

## Estructura del proyecto

```text
CalculadoraLaboral/
├── index.html
├── css/
│   └── style.css
├── javascript/
│   ├── calculadora.js
│   └── laborRates.js
└── README.md
```

## Uso local

1. Clonar el repositorio:

```bash
git clone https://github.com/lsaj08/CalculadoraLaboral.git
```

2. Abrir `index.html` directamente en el navegador.

El proyecto no requiere instalación de dependencias, `npm install`, servidor local ni comandos `npm run`.

## Cálculo

Si el salario está en colones, se usa directamente como base de cálculo.

Si el salario está en dólares, la app consulta el tipo de cambio de compra desde:

```text
https://api.hacienda.go.cr/indicadores/tc/dolar
```

Luego convierte el salario bruto a colones:

```text
salarioBrutoColones = salarioUSD * tipoCambioCompra
```

Finalmente calcula:

```text
salarioNeto = salarioBrutoColones - CCSS - impuestoRenta
```

## Parámetros laborales vigentes

### CCSS trabajador

- SEM: 5.50%
- IVM: 4.33%
- Banco Popular / LPT: 1.00%
- Total trabajador: 10.83%

### Renta salarial 2026

- Hasta ₡918,000: exento
- Más de ₡918,000 y hasta ₡1,347,000: 10%
- Más de ₡1,347,000 y hasta ₡2,364,000: 15%
- Más de ₡2,364,000 y hasta ₡4,727,000: 20%
- Más de ₡4,727,000: 25%

El impuesto sobre la renta salarial se calcula de forma progresiva.

## Fuentes

- Ministerio de Hacienda de Costa Rica.
- API pública de Hacienda para tipo de cambio: `https://api.hacienda.go.cr/indicadores/tc/dolar`.
- CCSS para porcentajes de cargas sociales del trabajador.

## Descargo

El cálculo es estimado e informativo. Puede no sustituir asesoría legal, contable o laboral.

Los valores pueden cambiar según normativa vigente, actualizaciones oficiales o condiciones particulares de cada persona trabajadora o patrono.

## Estado del proyecto

- Proyecto funcional.
- App estática.
- Sin dependencias.
- Sin `package.json`.
