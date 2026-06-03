import { Routes } from '@angular/router';
import { SpendingPredictionPageComponent } from './spending-prediction-page/spending-prediction-page.component';

export const SPENDING_PREDICTION_ROUTES: Routes = [
  {
    path: '',
    component: SpendingPredictionPageComponent
  },
  {
    path: ':alumnoId',
    component: SpendingPredictionPageComponent
  }
];
