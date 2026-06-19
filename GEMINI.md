# Reglas de Interacción y Desarrollo (GEMINI)

## Reglas Obligatorias de Interacción
1. **Esquema de Solución Obligatorio**: Jamás agregues, elimines o edites código sin antes mostrar al usuario el esquema de solución propuesto, acompañado de argumentos y justificaciones. Siempre espera la aprobación o feedback antes de realizar cambios en los archivos.
2. **Idioma del Código**: Todo el código que se agregue, modifique o comente (nombres de variables, funciones, clases, comentarios) debe estar escrito en **Español**, manteniendo la coherencia con el dominio del proyecto.
3. **Validación antes de Push (CI/CD)**: Cuando estés a punto de generar un push, siempre procura asegurar que el código pasará el pipeline de `main.yml` (por ejemplo, validando linting, formateo y tests localmente si es posible o indicando explícitamente los comandos de validación).

## Convenciones Técnicas del Proyecto
Tras el escaneo del repositorio, se identifican las siguientes convenciones que deben respetarse al agregar código:
- **Framework**: Angular (versiones modernas).
- **Componentes**: Arquitectura basada en Standalone Components (`standalone: true`).
- **Plantillas**: Uso del nuevo Control Flow de Angular (`@if`, `@for`, `@switch`).
- **Manejo de Estado y Reactividad**: Uso de Angular Signals (`signal()`, `computed()`) y RxJS (`Observable`, `Subject`).
- **Formularios**: Empleo de *Reactive Forms* (`FormBuilder`, `FormGroup`, `FormArray`, `FormControl`).
- **Estilos**: Vanilla CSS con alcance de componente.
- **Testing**: Pruebas unitarias configuradas en archivos `.spec.ts`.


C:\Users\nicol\.gemini\antigravity-cli\brain\0f196cbf-29fc-44d5-965f-e3cd800cbb30\reporte_coverage_progreso.md
