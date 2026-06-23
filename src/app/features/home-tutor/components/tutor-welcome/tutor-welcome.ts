import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AlumnosService } from '../../../../data-access/services/alumnos.service';
import { MovimientosService } from '../../../movimientos/services/movimientos.service';
import { BuffetService } from '../../../buffet/services/buffet.service';
import { PromotionService, Promotion } from '../../../../data-access/services/promociones/promotion.service';
import { Movimiento } from '../../../movimientos/models/movimiento.model';

@Component({
  selector: 'app-tutor-welcome',
  imports: [CommonModule],
  templateUrl: './tutor-welcome.html',
  styleUrl: './tutor-welcome.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TutorWelcome implements OnInit {
  private router = inject(Router);
  private alumnosService = inject(AlumnosService);
  private movimientosService = inject(MovimientosService);
  private buffetService = inject(BuffetService);
  private promosService = inject(PromotionService);

  readonly alumnos = this.alumnosService.alumnos;
  
  // Alertas de saldo bajo
  readonly alumnosConSaldoBajo = computed(() => {
    return this.alumnos().filter(a => (a.saldo || 0) < 2000);
  });

  // Datos
  readonly ultimosMovimientos = signal<(Movimiento & { alumnoNombre?: string })[]>([]);
  readonly pedidosPendientes = signal<(Movimiento & { alumnoNombre: string })[]>([]);
  readonly promociones = signal<Promotion[]>([]);
  readonly cargando = signal(true);

  ngOnInit() {
    this.cargarDatosDashboard();
  }

  private async cargarDatosDashboard() {
    this.cargando.set(true);
    try {
      const alumnosActuales = this.alumnos();

      // 1. Movimientos globales del tutor (historial general)
      this.movimientosService.getHistorialTutor().subscribe(movs => {
        const mapeados = (movs || []).map(mov => {
          const alumno = alumnosActuales.find(a => a.id === mov.studentId);
          return {
            ...mov,
            alumnoNombre: alumno ? alumno.nombre : (mov as any).studentName || undefined
          };
        });
        this.ultimosMovimientos.set(mapeados.slice(0, 4));
      });

      // 2. Pedidos pendientes (consolidados de todos los alumnos)
      const todosPendientes: (Movimiento & { alumnoNombre: string })[] = [];
      
      for (const alumno of alumnosActuales) {
        this.movimientosService.getPendientesAlumno(alumno.id).subscribe(pendientes => {
          const mapeados = pendientes.map(p => ({ ...p, alumnoNombre: alumno.nombre }));
          todosPendientes.push(...mapeados);
          // Ordenamos por fecha
          todosPendientes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          this.pedidosPendientes.set([...todosPendientes].slice(0, 5));
        });
      }

      // 3. Promociones destacadas (consolidadas de los distintos buffets)
      const todasPromos: Promotion[] = [];
      const procesados = new Set<string>();
      
      for (const alumno of alumnosActuales) {
        this.buffetService.obtenerBuffetDelAlumno(alumno.id).subscribe({
          next: (buffet) => {
            if (buffet && buffet.id && !procesados.has(buffet.id)) {
              procesados.add(buffet.id);
              this.promosService.getPromotions(buffet.id).subscribe(promos => {
                const vigentes = promos.filter(p => p.status === 'ACTIVE' || !p.status);
                todasPromos.push(...vigentes);
                const uniquePromos = Array.from(new Map(todasPromos.map(p => [p.id, p])).values());
                this.promociones.set(uniquePromos.slice(0, 4));
              });
            }
          },
          error: (e) => console.error('Error al obtener buffet:', e)
        });
      }
    } catch (e) {
      console.error('Error cargando dashboard', e);
    } finally {
      this.cargando.set(false);
    }
  }

  irAcreditar(alumnoId: string) {
    this.router.navigate(['/tutor/acreditar', alumnoId]);
  }

  irAMovimientos() {
    this.router.navigate(['/movimientos']);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  formatARS(amount: number): string {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount);
  }

  getStatusLabel(status: string, defaultLabel?: string): string {
    const s = status.toUpperCase();
    if (s === 'PENDING' || s === 'PENDIENTE') return 'A Preparar';
    if (s === 'EN_PREPARACION') return 'En Preparación';
    if (s === 'LISTO') return 'Listo para retirar';
    if (s === 'ENTREGADO' || s === 'APPROVED') return 'Entregado';
    return defaultLabel || status;
  }
}
