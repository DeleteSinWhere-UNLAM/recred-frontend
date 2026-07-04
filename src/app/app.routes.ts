import { Routes } from '@angular/router';
import { authChildGuard } from './core/auth/guards/auth.guard';
import { alumnoContextoGuard } from './core/guards/alumno-contexto.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/landing/landing.page').then((m) => m.LandingPage),
  },
  {
    path: 'registro-colegio',
    loadComponent: () =>
      import('./features/registro-colegio/registro-colegio.page').then((m) => m.RegistroColegioPage),
  },
  {
    path: 'recred-admin',
    canActivate: [authChildGuard, adminGuard],
    loadComponent: () =>
      import('./features/recred-admin/recred-admin.page').then((m) => m.RecredAdminPage),
  },
  {
    path: 'directivo',
    canActivate: [authChildGuard],
    loadComponent: () =>
      import('./features/directivo/directivo.page').then((m) => m.DirectivoPage),
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
            path: 'adelanto',
            canActivate: [alumnoContextoGuard],
            loadComponent: () => import('./features/adelanto/adelanto').then((m) => m.AdelantoPage),
          },
          {
            path: 'favoritos-alumno',
            canActivate: [alumnoContextoGuard],
            loadComponent: () =>
              import('./features/favoritos-alumno/favoritos-alumno.page').then(
                (m) => m.FavoritosAlumnoPage,
              ),
          },
          {
            path: 'restricciones-horarias',
            canActivate: [alumnoContextoGuard],
            loadComponent: () =>
              import('./features/restricciones-horarias/restricciones-horarias.page').then(
                (m) => m.RestriccionesHorariasPage,
              ),
          },
          {
            path: 'restricciones-nutricionales',
            canActivate: [alumnoContextoGuard],
            loadComponent: () =>
              import('./features/restricciones-nutricionales/restricciones-nutricionales.page').then(
                (m) => m.RestriccionesNutricionalesPage,
              ),
          },

          {
            path: 'acreditar-mercado-pago',
            canActivate: [alumnoContextoGuard],
            loadComponent: () =>
              import('./features/acreditar-mercado-pago/acreditar-mercado-pago.page').then(
                (m) => m.AcreditarMercadoPagoPage,
              ),
          },
          {
            path: 'presupuesto',
            canActivate: [alumnoContextoGuard],
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
              import('./features/prediccion-gasto/prediccion-gasto.routes').then(
                (m) => m.PREDICCION_GASTO_ROUTES,
              ),
          },
          {
            path: 'estadistica',
            canActivate: [alumnoContextoGuard],
            loadComponent: () =>
              import('./features/estadistica/estadistica.page').then(
                (m) => m.EstadisticaPage,
              ),
          },
          {
            path: 'tutor-movimientos/:alumnoId',
            canActivate: [alumnoContextoGuard],
            loadComponent: () =>
              import('./features/movimientos/movimientos.page').then(
                (m) => m.MovimientosPage,
              ),
          },
          {
            path: 'tutor-movimientos',
            loadComponent: () =>
              import('./features/movimientos/movimientos.page').then(
                (m) => m.MovimientosPage,
              ),
          },
          {
            path: 'movimientos-pendientes',
            canActivate: [alumnoContextoGuard],
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
        path: 'movimientos/:alumnoId',
        canActivate: [alumnoContextoGuard],
        loadComponent: () =>
          import('./features/movimientos/movimientos.page').then(
            (m) => m.MovimientosPage,
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
        path: 'tutor-dashboard',
        loadComponent: () =>
          import('./features/tutor-dashboard/tutor-dashboard.component').then(
            (m) => m.TutorDashboardComponent,
          ),
      },
      {
        path: 'buffet',
        canActivate: [alumnoContextoGuard],
        loadComponent: () =>
          import('./features/buffet/buffet.page').then((m) => m.BuffetPage),
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
        path: 'kiosquero/proveedores',
        loadChildren: () =>
          import('./features/proveedores/proveedores.routes').then(
            (m) => m.PROVEEDORES_ROUTES,
          ),
      },
      {
        path: 'cierre-diario',
        loadComponent: () =>
          import('./features/cierre-diario/cierre-diario.page').then(
            (m) => m.CierreDiarioPage,
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
          import('./features/cargar-producto-ia/cargar-producto-ia.routes').then(
            (m) => m.cargarProductoIaRoutes,
          ),
      },
      {
        path: 'recomendaciones-estacionales',
        loadComponent: () =>
          import('./features/recomendaciones-estacionales/pages/recomendaciones-page/recomendaciones-page.component').then(
            (m) => m.RecomendacionesPageComponent,
          ),
      },
      {
        path: 'admin-productos',
        loadChildren: () =>
          import('./features/inventario/inventario.routes').then(
            (m) => m.inventarioRoutes,
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
        path: 'suscripcion',
        loadComponent: () =>
          import('./features/premium-plans/premium-plans.page').then(
            (m) => m.PremiumPlansPage,
          ),
      },
    ],
  },
];
