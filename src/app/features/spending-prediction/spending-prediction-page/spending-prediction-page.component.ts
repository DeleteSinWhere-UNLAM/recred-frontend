import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { PredictionAnalysisComponent } from '../components/prediction-analysis/prediction-analysis.component';
import { PredictionSummaryComponent } from '../components/prediction-summary/prediction-summary.component';
import { SpendingPrediction } from '../models/spending-prediction.interface';
import { SpendingPredictionService } from '../services/spending-prediction.service';

@Component({
  selector: 'app-spending-prediction-page',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    PredictionSummaryComponent,
    PredictionAnalysisComponent,
  ],
  templateUrl: './spending-prediction-page.component.html',
  styleUrl: './spending-prediction-page.component.css',
})
export class SpendingPredictionPageComponent implements OnInit {
  private readonly predictionService = inject(SpendingPredictionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  predictionData: SpendingPrediction | null = null;
  isLoading = false;
  errorMessage: string | null = null;

  volver(): void {
    this.router.navigateByUrl('/tutor');
  }

  ngOnInit(): void {
    const alumnoId = this.route.snapshot.paramMap.get('alumnoId');

    if (!alumnoId) {
      this.errorMessage =
        'No se encontró el alumno para obtener la predicción de gastos.';
      return;
    }

    this.loadPrediction(alumnoId);
  }

  private loadPrediction(alumnoId: string): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.predictionService.getPrediction(alumnoId).subscribe({
      next: (data) => {
        this.predictionData = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage =
          'No se pudo cargar la predicción de gastos. Por favor, intenta de nuevo más tarde.';
        this.isLoading = false;
      },
    });
  }
}
