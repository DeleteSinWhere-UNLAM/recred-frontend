import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { AnalisisPrediccionComponent } from './components/analisis-prediccion/analisis-prediccion.component';
import { ResumenPrediccionComponent } from './components/resumen-prediccion/resumen-prediccion.component';
import { PrediccionGasto } from './models/prediccion-gasto.model';
import { PrediccionGastoService } from './services/prediccion-gasto.service';

@Component({
  selector: 'app-prediccion-gasto-page',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    ResumenPrediccionComponent,
    AnalisisPrediccionComponent,
  ],
  templateUrl: './prediccion-gasto.page.html',
  styleUrl: './prediccion-gasto.page.css',
})
export class PrediccionGastoPage implements OnInit {
  private readonly predictionService = inject(PrediccionGastoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  predictionData: PrediccionGasto | null = null;
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
