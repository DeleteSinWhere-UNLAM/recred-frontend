import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.page').then((m) => m.HomePage),
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
  path: 'habitos',
  loadComponent: () =>
    import('./features/habitos/habitos.page')
      .then((m) => m.HabitosPage),
},
];