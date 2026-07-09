# 🔔 RECRED CI/CD 🔔

Este proyecto utiliza **GitHub Actions** como sistema de Integración Continua (CI) y **Netlify** para el Despliegue Continuo (CD).

Cada vez que se haga un *push* o un *Pull Request* a la rama Main o Develop, el código pasará por el pipeline automáticamente. Si este falla, el código no se desplegará.


### Pruebas locales (Start)
Asegura que la aplicación corre localmente y puede utilizar los endpoints del backend productivo

```bash
npm start
```

---

## 🔐 Configuración de Seguridad Local (Obligatorio)

Para proteger nuestras credenciales e infraestructura (AWS Cognito, API), **este proyecto no sube llaves secretas al repositorio.**

Antes de ejecutar la aplicación, debes configurar tu entorno local:

1. Crea un archivo llamado `.env` en la raíz del proyecto (este archivo está ignorado por Git).
2. Revisa el archivo `src/environments/environment.development.template.ts` para ver qué variables necesitas.
3. Copia tus credenciales en el archivo `.env` siguiendo este formato:

```bash
COGNITO_USER_POOL_ID=tu_pool_id_aqui
COGNITO_CLIENT_ID=tu_client_id_aqui
COGNITO_REGION=tu_region_aqui
COGNITO_DOMAIN=tu_dominio_aqui
REDIRECT_SIGN_IN=http://localhost:4200
REDIRECT_SIGN_OUT=http://localhost:4200
API_URL=tu_api_url_aqui
```

> **Magia Automática:** No necesitas modificar archivos `.ts` manualmente. Al ejecutar los comandos de npm (`start`, `test`, `build`), un script interno (`set-env.js`) inyectará estas variables automáticamente en tu código antes de compilar.

---

## ✅ Comandos antes de hacer Push

Para asegurar que el código pase el pipeline de GitHub Actions, **siempre** ejecuta estos comandos en tu máquina local antes de subir los cambios.

### Control de Calidad (Lint)
Verifica que el código esté limpio y cumpla con las reglas de estilo y buenas prácticas.

```bash
npm run lint
```


### Pruebas Unitarias (Tests)
Comprueba que la lógica de la aplicación siga funcionando. Este comando inyecta tu `.env` y ejecuta los tests igual que en la nube.


```bash
npm test -- --watch=false --browsers=ChromeHeadless
```

### Prueba de Compilación (Build)
Asegura que la aplicación compila correctamente sin errores de TypeScript ni advertencias de presupuesto de estilos.


```bash
npm run build -- --configuration=production
```


---

## 💡 Comando rápido "Todo en Uno"

Ejecuta el linter, los tests y el build. Si alguno falla, el proceso se detendrá para que puedas corregirlo antes de subirlo.


```bash
npm run lint && npm test -- --watch=false --browsers=ChromeHeadless && npm run build -- --configuration=production
