import { Routes } from '@angular/router';
import { authChildGuard } from './core/auth/guards/auth.guard';
import { alumnoContextoGuard } from './core/guards/alumno-contexto.guard';
import { rolChildGuard, wildcardRedirectGuard } from './core/auth/guards/rol.guard';

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
        path: 'perfil',
        loadComponent: () =>
          import('./features/perfil-usuario/perfil-usuario.page').then(
            (m) => m.PerfilUsuarioPage,
          ),
      },
      // Grupo Padre/Tutor (PADRE)
      {
        path: '',
        canActivateChild: [rolChildGuard],
        data: { roles: ['PADRE'] },
        children: [
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
                path: 'transferir-saldo',
                canActivate: [alumnoContextoGuard],
                loadComponent: () =>
                  import('./features/transferir-saldo/transferir-saldo.page').then(
                    (m) => m.TransferirSaldoPage,
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
            path: 'carritos-favoritos',
            loadComponent: () =>
              import('./features/carritos-favoritos/carritos-favoritos.page').then(
                (m) => m.CarritosFavoritosPage,
              ),
          },
          {
            path: 'suscripcion',
            loadComponent: () =>
              import('./features/premium-plans/premium-plans.page').then(
                (m) => m.PremiumPlansPage,
              ),
          },
          {
            path: 'notificaciones-precio',
            loadComponent: () =>
              import('./features/notificaciones-precio/notificaciones-precio.page').then(
                (m) => m.NotificacionesPrecioPage,
              ),
          },
        ]
      },
      // Grupo Alumno (ALUMNO)
      {
        path: '',
        canActivateChild: [rolChildGuard],
        data: { roles: ['ALUMNO'] },
        children: [
          {
            path: 'alumno',
            loadComponent: () =>
              import('./features/home-alumno/home-alumno.page').then(
                (m) => m.HomeAlumnoPage,
              ),
          },
          {
            path: 'buffet',
            canActivate: [alumnoContextoGuard],
            loadComponent: () =>
              import('./features/buffet/buffet.page').then((m) => m.BuffetPage),
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
        ]
      },
      // Grupo Kiosquero/Vendedor (VENDEDOR)
      {
        path: '',
        canActivateChild: [rolChildGuard],
        data: { roles: ['VENDEDOR'] },
        children: [
          {
            path: 'kiosquero',
            loadComponent: () =>
              import('./features/home-kiosquero/home-kiosquero.page').then(
                (m) => m.HomeKiosqueroPage,
              ),
          },
          {
            path: 'kiosquero/reportes',
            loadComponent: () =>
              import('./features/home-kiosquero/kiosquero-reportes.page').then(
                (m) => m.KiosqueroReportesPage,
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
            path: 'promociones',
            loadComponent: () =>
              import('./features/promociones/promociones.page').then(
                (m) => m.PromocionesPageComponent,
              ),
          },
          {
            path: 'sugerencias-agregar',
            loadComponent: () =>
              import('./features/sugerencias-agregar/sugerencias-agregar.page').then(
                (m) => m.SugerenciasAgregarPage,
              ),
          },
        ]
      },
      // Grupo Compartido (PADRE & ALUMNO)
      {
        path: '',
        canActivateChild: [rolChildGuard],
        data: { roles: ['PADRE', 'ALUMNO'] },
        children: [
          {
            path: 'billetera',
            loadComponent: () =>
              import('./features/billetera/billetera.page').then(
                (m) => m.BilleteraPage,
              ),
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
        ]
      },
    ],
  },
  {
    path: '**',
    canActivate: [wildcardRedirectGuard],
    loadComponent: () =>
      import('./features/landing/landing.page').then((m) => m.LandingPage),
  },
];
