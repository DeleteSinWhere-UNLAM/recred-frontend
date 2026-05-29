import { Routes } from '@angular/router';


export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'restricciones/:alumnoId',
    loadComponent: () =>
      import('./features/restricciones/restricciones.page').then(
        (m) => m.RestriccionesPage
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
      import('./features/preferencias/preferencias.page')
        .then((m) => m.PreferenciasPage),
  },

  {
    path: 'sugerencias',
    loadComponent: () =>
      import('./features/sugerencias/sugerencias.page')
        .then((m) => m.SugerenciasPage),
  },

  {
    path: 'consumo',
    loadComponent: () =>
      import('./features/consumo/consumo.page')
        .then((m) => m.ConsumoPage),
  },
  {
    path: 'compra',
    loadChildren: () =>
      import('./features/compra/compra.routes').then((m) => m.compraRoutes),
  },
  {
    path: 'habitos',
    loadComponent: () =>
      import('./features/habitos/habitos.page')
        .then((m) => m.HabitosPage),
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