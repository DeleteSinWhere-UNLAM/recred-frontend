import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SpendingPredictionService } from '../services/spending-prediction.service';
import { SpendingPrediction } from '../models/spending-prediction.interface';
import { PredictionSummaryComponent } from '../components/prediction-summary/prediction-summary.component';
import { PredictionAnalysisComponent } from '../components/prediction-analysis/prediction-analysis.component';

@Component({
  selector: 'app-spending-prediction-page',
  standalone: true,
  imports: [CommonModule, PredictionSummaryComponent, PredictionAnalysisComponent],
  templateUrl: './spending-prediction-page.component.html',
  styleUrl: './spending-prediction-page.component.css'
})
export class SpendingPredictionPageComponent implements OnInit {
  private readonly predictionService = inject(SpendingPredictionService);
  private readonly route = inject(ActivatedRoute);

  predictionData: SpendingPrediction | null = null;
  isLoading = false;
  errorMessage: string | null = null;

  ngOnInit(): void {
    const routeId = this.route.snapshot.paramMap.get('alumnoId');
    const defaultId = '11111111-1111-1111-1111-111111111112';
    const alumnoId = routeId || defaultId;

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
        this.errorMessage = 'No se pudo cargar la predicción de gastos. Por favor, intenta de nuevo más tarde.';
        this.isLoading = false;
      }
    });
  }
}
