import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, Subscription, catchError, finalize, of } from 'rxjs';
import { RecomendacionesService } from '../../services/recomendaciones.service';
import { Sugerencia } from '../../models/recomendacion.model';
import { SeasonalListComponent } from '../../components/seasonal-list/seasonal-list.component';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-seasonal-page',
  standalone: true,
  imports: [CommonModule, SeasonalListComponent, NavbarComponent],
  templateUrl: './seasonal-page.component.html',
  styleUrls: ['./seasonal-page.component.css']
})
export class SeasonalPageComponent implements OnInit, OnDestroy {
  private readonly recomendacionesService = inject(RecomendacionesService);
  private readonly router = inject(Router);
  private subscription = new Subscription();

  volver(): void {
    this.router.navigateByUrl('/kiosquero');
  }

  isLoading = false;
  error: string | null = null;
  sugerencias: Sugerencia[] = [];
  tipPromocional: string | null = null;

  ngOnInit(): void {
    this.loadRecommendations();
  }

  loadRecommendations(): void {
    this.isLoading = true;
    this.error = null;

    // By-pass geolocation and use default coordinates since the service is hardcoded
    const sub = this.recomendacionesService.getSeasonalRecommendations(0, 0).pipe(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      catchError(_err => {
        this.error = 'Ocurrió un error al conectar con el motor de recomendaciones.';
        return of(null);
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: (response) => {
        if (response) {
          this.sugerencias = response.sugerencias || [];
          this.tipPromocional = response.tip_promocional || null;
        }
      }
    });

    this.subscription.add(sub);
  }

  private getCurrentPosition(): Observable<GeolocationPosition> {
    return new Observable<GeolocationPosition>((observer) => {
      if (!navigator.geolocation) {
        observer.error(new Error('La geolocalización no está soportada en tu navegador.'));
        observer.complete();
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          observer.next(position);
          observer.complete();
        },
        (error) => {
          observer.error(error);
          observer.complete();
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
