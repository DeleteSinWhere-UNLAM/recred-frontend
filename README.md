# 🔔​ RECRED CI/CD​🔔​​

Este proyecto utiliza **GitHub Actions** como sistema de Integración Continua (CI) y **Netlify** para el Despliegue Continuo (CD). 

Cada vez que se haga un *push* o un *Pull Request* a la rama Main o Develop, el código pasará por el pipeline automaticamente, si este falla, el código no se desplegará. 

Para asegurar que el código pase el pipeline, podemos ejecutar las siguientes comandos en local antes de subir los cambios.

## ✅ Comandos antes de hacer Push
1. Control de Calidad (Lint)
Verifica que el código esté limpio y cumpla con las reglas de estilo y buenas prácticas establecidas.

```bash
npm run lint
```

2. Pruebas Unitarias (Tests)
Comprueba que la lógica de la aplicación siga funcionando. El comando a continuación ejecuta los tests exactamente de la misma manera que lo hace el entorno de CI.

```bash
npm test -- --watch=false --browsers=ChromeHeadless
```

3. Prueba de Compilación (Build)
Asegura que la aplicación compila correctamente sin errores de TypeScript ni problemas de dependencias.

```bash
npm run build -- --configuration=production
```

## 💡 Comando rápido "Todo en Uno"
Evita ejecutar los comandos uno por uno. Ejecuta el linter, los tests y el build en secuencia. Si alguno falla, el proceso se detendrá.

```bash
npm run lint && npm test -- --watch=false --browsers=ChromeHeadless && npm run build -- --configuration=production
