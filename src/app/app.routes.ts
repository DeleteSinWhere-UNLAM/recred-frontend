import { Routes } from '@angular/router';
import { authChildGuard } from './core/auth/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/landing/landing.page').then((m) => m.LandingPage),
  },
  {
    path: '',
    canActivateChild: [authChildGuard],
    children: [
      {
        path: 'seleccion-tipo-cuenta',
        loadComponent: () =>
          import('./features/seleccion-tipo-cuenta/seleccion-tipo-cuenta.page').then(
            (m) => m.SeleccionTipoCuentaPage,
          ),
      },
      {
        path: 'tutor',
        loadComponent: () =>
          import('./features/home-tutor/home-tutor.page').then(
            (m) => m.HomeTutorPage,
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
        path: 'restricciones-nutricionales/:alumnoId',
        loadComponent: () =>
          import('./features/restricciones-nutricionales/restricciones-nutricionales.page').then(
            (m) => m.RestriccionesNutricionalesPage,
          ),
      },
      {
        path: 'buffet/:alumnoId',
        loadComponent: () =>
          import('./features/buffet/buffet.page').then((m) => m.BuffetPage),
      },
      {
        path: 'acreditar-mercado-pago/:alumnoId',
        loadComponent: () =>
          import('./features/acreditar-mercado-pago/acreditar-mercado-pago.page').then(
            (m) => m.AcreditarMercadoPagoPage,
          ),
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
        path: 'favoritos',
        loadComponent: () =>
          import('./features/favoritos/favoritos.page').then(
            (m) => m.FavoritosPage,
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
        path: 'kiosquero',
        loadComponent: () =>
          import('./features/home-kiosquero/home-kiosquero.page').then(
            (m) => m.HomeKiosqueroPage,
          ),
      },
      {
        path: 'cargar-producto-ia',
        loadChildren: () =>
          import('./features/ai-product-upload/ai-product-upload.routes').then(
            (m) => m.aiProductUploadRoutes,
          ),
      },
      {
        path: 'recomendaciones-estacionales',
        loadComponent: () =>
          import('./features/seasonal-recommendations/pages/seasonal-page/seasonal-page.component').then(
            (m) => m.SeasonalPageComponent,
          ),
      },
      {
        path: 'admin-productos',
        loadChildren: () =>
          import('./features/updated-inventory/updated-inventory.routes').then(
            (m) => m.updatedInventoryRoutes,
          ),
      },
      {
        path: 'prediccion-gasto',
        loadChildren: () =>
          import('./features/spending-prediction/spending-prediction.routes').then(
            (m) => m.SPENDING_PREDICTION_ROUTES,
          ),
      },
      {
        path: 'estadistica/:alumnoId',
        loadComponent: () =>
          import('./features/estadistica/estadistica.page').then(
            (m) => m.EstadisticaPage,
          ),
      },
      {
        path: 'movimientos',
        loadComponent: () =>
          import('./features/movimientos/movimientos.page').then(
            (m) => m.MovimientosPage,
          ),
      },
      {
        path: 'movimientos/:alumnoId',
        loadComponent: () =>
          import('./features/movimientos/movimientos.page').then(
            (m) => m.MovimientosPage,
          ),
      },
      {
        path: 'notificaciones-precio',
        loadComponent: () =>
          import('./features/notificaciones-precio/notificaciones-precio.page').then(
            (m) => m.NotificacionesPrecioPage,
          ),
      },
    ],
  },
];
