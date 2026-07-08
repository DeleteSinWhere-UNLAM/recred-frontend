import { Routes } from '@angular/router';

export const PROVEEDORES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/suppliers-list/suppliers-list.page').then(
        (m) => m.SuppliersListPage
      )
  },
  {
    path: 'comparador',
    loadComponent: () =>
      import('./pages/purchase-recommendations/purchase-recommendations.page').then(
        (m) => m.PurchaseRecommendationsPage
      )
  },
  {
    path: 'lista-precio/:listaPrecioId',
    loadComponent: () =>
      import('./pages/price-list-mapping/price-list-mapping.page').then(
        (m) => m.PriceListMappingPage
      )
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/supplier-detail/supplier-detail.page').then(
        (m) => m.SupplierDetailPage
      )
  }
];
