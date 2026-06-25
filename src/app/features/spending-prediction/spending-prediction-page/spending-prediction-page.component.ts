import { CommonModule } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlumnoContextoService } from '../../../core/services/alumno-contexto.service';
import { } from '../../../shared/components/navbar/navbar.component';
import { PredictionAnalysisComponent } from '../components/prediction-analysis/prediction-analysis.component';
import { PredictionSummaryComponent } from '../components/prediction-summary/prediction-summary.component';
import { SpendingPrediction } from '../models/spending-prediction.interface';
import { SpendingPredictionService } from '../services/spending-prediction.service';

@Component({
  selector: 'app-spending-prediction-page',
  standalone: true,
  imports: [
    CommonModule,
    PredictionSummaryComponent,
    PredictionAnalysisComponent,
  ],
  templateUrl: './spending-prediction-page.component.html',
  styleUrl: './spending-prediction-page.component.css',
})
export class SpendingPredictionPageComponent {
  private readonly predictionService = inject(SpendingPredictionService);
  private readonly contextoService = inject(AlumnoContextoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  predictionData: SpendingPrediction | null = null;
  isLoading = false;
  errorMessage: string | null = null;
  private alumnoIdActual = '';

  constructor() {
    effect(() => {
      const alumnoId = this.resolverAlumnoId();
      if (!alumnoId) {
        this.alumnoIdActual = '';
        this.predictionData = null;
        this.errorMessage =
          'No se encontro el alumno para obtener la prediccion de gastos.';
        return;
      }

      this.alumnoIdActual = alumnoId;
      this.loadPrediction(alumnoId);
    });
  }

  volver(): void {
    this.router.navigateByUrl('/tutor');
  }

  recargar(): void {
    const alumnoId = this.alumnoIdActual || this.resolverAlumnoId();

    if (!alumnoId) {
      this.errorMessage =
        'No se encontro el alumno para obtener la prediccion de gastos.';
      return;
    }

    this.loadPrediction(alumnoId);
  }

  private resolverAlumnoId(): string {
    const contextoAlumnoId = this.contextoService.alumnoId();
    return this.route.snapshot.paramMap.get('alumnoId') ?? contextoAlumnoId;
  }

  private loadPrediction(alumnoId: string): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.predictionData = null;

    this.predictionService.getPrediction(alumnoId).subscribe({
      next: (data) => {
        this.predictionData = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage =
          'No se pudo cargar la prediccion de gastos. Por favor, intenta de nuevo mas tarde.';
        this.isLoading = false;
      },
    });
  }
}
