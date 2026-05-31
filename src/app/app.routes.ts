import { Routes } from '@angular/router';


export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.page').then((m) => m.LandingPage),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./core/auth/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'registro',
    loadComponent: () =>
      import('./core/auth/registro/registro.page').then((m) => m.RegistroPage),
  },
  {
    path: 'recuperar-password',
    loadChildren: () =>
      import('./core/auth/recuperar-password/recuperar-password.routes').then(
        (m) => m.recuperarPasswordRoutes,
      ),
  },
  {
    path: 'padre',
    loadComponent: () =>
      import('./features/home-padre/home-padre.page').then(
        (m) => m.HomePadrePage,
      ),
  },
  {
    path: 'alumno',
    loadComponent: () =>
      import('./features/home-alumno/home-alumno.page').then(
        (m) => m.HomeAlumnoPage,
      ),
  },
  {
    path: 'restricciones/:alumnoId',
    loadComponent: () =>
      import('./features/restricciones/restricciones.page').then(
        (m) => m.RestriccionesPage,
      ),
  },
  {
    path: 'buffet/:alumnoId',
    loadComponent: () =>
      import('./features/buffet/buffet.page').then((m) => m.BuffetPage),
  },
  {
    path: 'presupuesto/:alumnoId',
    loadComponent: () =>
      import('./features/presupuesto/presupuesto.page').then(
        (m) => m.PresupuestoPage,
      ),
  },
  {
    path: 'preferencias',
    loadComponent: () =>
      import('./features/preferencias/preferencias.page').then(
        (m) => m.PreferenciasPage,
      ),
  },

  {
    path: 'sugerencias',
    loadComponent: () =>
      import('./features/sugerencias/sugerencias.page').then(
        (m) => m.SugerenciasPage,
      ),
  },

  {
    path: 'consumo',
    loadComponent: () =>
      import('./features/consumo/consumo.page').then((m) => m.ConsumoPage),
  },

  {
    path: 'habitos',
    loadComponent: () =>
      import('./features/habitos/habitos.page').then((m) => m.HabitosPage),
  },

  {
    path: 'compra',
    loadChildren: () =>
      import('./features/compra/compra.routes').then((m) => m.compraRoutes),
  },

  {
    path: 'vendedor',
    loadComponent: () =>
      import('./features/home-vendedor/home-vendedor.page').then(
        (m) => m.HomeVendedorPage,
      ),
  },
  {
    path: 'cargar-producto-ia',
    loadChildren: () => import('./features/ai-product-upload/ai-product-upload.routes').then(m => m.aiProductUploadRoutes)
  },
  {
    path: 'recomendaciones-estacionales',
    loadComponent: () => import('./features/seasonal-recommendations/pages/seasonal-page/seasonal-page.component').then(m => m.SeasonalPageComponent)
  }
];
