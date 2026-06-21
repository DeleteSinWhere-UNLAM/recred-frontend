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
        path: '',
        loadComponent: () => import('./features/home-tutor/home-tutor.page').then((m) => m.HomeTutorPage),
        children: [
          {
            path: 'tutor',
            loadComponent: () => import('./features/home-tutor/components/tutor-welcome/tutor-welcome').then((m) => m.TutorWelcome),
          },
          {
            path: 'adelanto/:alumnoId',
            loadComponent: () => import('./features/adelanto/adelanto').then((m) => m.AdelantoPage),
          },
          {
        path: 'restricciones-horarias/:alumnoId',
        loadComponent: () =>
          import('./features/restricciones-horarias/restricciones-horarias.page').then(
            (m) => m.RestriccionesHorariasPage,
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
        path: 'movimientos/:alumnoId',
        loadComponent: () =>
          import('./features/movimientos/movimientos.page').then(
            (m) => m.MovimientosPage,
          ),
      },
          {
        path: 'movimientos-pendientes/:alumnoId',
        loadComponent: () =>
          import(
            './features/movimientos-pendientes/movimientos-pendientes.page'
          ).then((m) => m.MovimientosPendientesPage),
      },
          {
        path: 'resumen-semanal',
        loadComponent: () =>
          import('./features/resumen-semanal/resumen-semanal.page').then(
            (m) => m.ResumenSemanalPage,
          ),
      },
          {
        path: 'preferencias-detectadas',
        loadComponent: () =>
          import('./features/preferencias-detectadas/preferencias-detectadas.page').then(
            (m) => m.PreferenciasDetectadasPage,
          ),
      },
        ]
      },
      {
        path: 'tutor-dashboard',
        loadComponent: () =>
          import('./features/tutor-dashboard/tutor-dashboard.component').then(
            (m) => m.TutorDashboardComponent,
          ),
      },
      {
        path: 'crear-hijo',
        loadComponent: () =>
          import('./features/crear-hijo/crear-hijo.page').then(
            (m) => m.CrearHijoPage,
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
        path: 'perfil',
        loadComponent: () =>
          import('./features/perfil-usuario/perfil-usuario.page').then(
            (m) => m.PerfilUsuarioPage,
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
        path: 'carritos-favoritos',
        loadComponent: () =>
          import('./features/carritos-favoritos/carritos-favoritos.page').then(
            (m) => m.CarritosFavoritosPage,
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
        path: 'sugerencias-agregar',
        loadComponent: () =>
          import('./features/sugerencias-agregar/sugerencias-agregar.page').then(
            (m) => m.SugerenciasAgregarPage,
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
        path: 'kiosquero/reportes',
        loadComponent: () =>
          import('./features/home-kiosquero/kiosquero-reportes.page').then(
            (m) => m.KiosqueroReportesPage,
          ),
      },
      {
        path: 'kiosquero',
        loadComponent: () =>
          import('./features/home-kiosquero/home-kiosquero.page').then(
            (m) => m.HomeKiosqueroPage,
          ),
      },
      {
        path: 'cierre-diario',
        loadComponent: () =>
          import('./features/daily-close/daily-close.page').then(
            (m) => m.DailyClosePage,
          ),
      },
      {
        path: 'kiosquero/venta-espontanea',
        loadChildren: () =>
          import('./features/venta-espontanea/venta-espontanea.routes').then(
            (m) => m.ventaEspontaneaRoutes,
          ),
      },
      {
        path: 'kiosquero/pedidos-tracking',
        loadComponent: () =>
          import('./features/tracking-pedidos/tracking-pedidos.page').then(
            (m) => m.TrackingPedidosPage,
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
        path: 'billetera',
        loadComponent: () =>
          import('./features/billetera/billetera.page').then(
            (m) => m.BilleteraPage,
          ),
      },
      {
        path: 'billetera/:alumnoId',
        loadComponent: () =>
          import('./features/billetera/billetera.page').then(
            (m) => m.BilleteraPage,
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
        path: 'notificaciones-precio',
        loadComponent: () =>
          import('./features/notificaciones-precio/notificaciones-precio.page').then(
            (m) => m.NotificacionesPrecioPage,
          ),
      },
      
      {
        path: 'promociones',
        loadComponent: () =>
          import('./features/promociones/promociones.page').then(
            (m) => m.PromocionesPageComponent,
          ),
      },
      
      {
        path: 'premium',
        loadComponent: () =>
          import('./features/premium-plans/premium-plans.page').then(
            (m) => m.PremiumPlansPage,
          ),
      },
    ],
  },
];
