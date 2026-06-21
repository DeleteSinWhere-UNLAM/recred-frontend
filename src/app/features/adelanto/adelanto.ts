import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MicrocreditosService, SchoolCredit } from '../../data-access/services/microcreditos.service';
import { DialogService } from '../../shared/services/dialog.service';
import { PerfilService } from '../../data-access/services/perfil.service';
import { AlumnosService } from '../../data-access/services/alumnos.service';
import { Alumno } from '../../data-access/models/alumno.model';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-adelanto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './adelanto.html',
  styleUrl: './adelanto.css'
})
export class AdelantoPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly microcreditosService = inject(MicrocreditosService);
  private readonly dialogService = inject(DialogService);
  private readonly perfilService = inject(PerfilService);
  private readonly alumnosService = inject(AlumnosService);
  private readonly toastService = inject(ToastService);

  alumno = signal<Alumno | null>(null);
  creditoActivo = signal<SchoolCredit | null>(null);
  cargando = signal<boolean>(true);
  
  montoFijo = signal<number>(5000);
  cuotas = signal<number>(1);

  ngOnInit(): void {
    const alumnoId = this.route.snapshot.paramMap.get('alumnoId');
    if (!alumnoId) {
      this.volver();
      return;
    }

    this.alumnosService.asegurarCargados().then(() => {
      const al = this.alumnosService.getAlumnoById(alumnoId);
      if (!al) {
        this.toastService.mostrar('Error al cargar alumno', 'error');
        this.volver();
        return;
      }
      
      this.alumno.set(al);
      this.microcreditosService.getActiveCredit(al.id).subscribe({
        next: (credito) => {
          this.creditoActivo.set(credito);
          this.cargando.set(false);
        },
        error: () => {
          this.creditoActivo.set(null);
          this.cargando.set(false);
        }
      });
    }).catch(() => {
      this.toastService.mostrar('Error al cargar alumno', 'error');
      this.volver();
    });
  }

  volver(): void {
    this.location.back();
  }

  get montoCalculado(): number {
    return this.montoFijo();
  }

  setMontoRapidoFijo(monto: number): void {
    this.montoFijo.set(monto);
  }

  setCuotas(c: number): void {
    this.cuotas.set(c);
  }

  async confirmarMicrocredito(): Promise<void> {
    const parentId = this.perfilService.perfil()?.id;
    const al = this.alumno();
    if (!parentId || !al) return;
    
    const finalAmount = this.montoCalculado;
    if (finalAmount <= 0) {
      await this.dialogService.alert('El monto debe ser mayor a cero.', 'Monto Inválido');
      return;
    }

    this.microcreditosService.requestCredit(al.id, parentId, finalAmount, this.cuotas())
      .subscribe({
        next: async (res) => {
          await this.dialogService.alert('Adelanto habilitado exitosamente por: $' + res.amount, 'Adelanto Habilitado');
          this.creditoActivo.set(res);
        },
        error: async (err) => {
          console.error('Error HTTP:', err);
          if (err.status === 409) {
            await this.dialogService.alert('El alumno ya tiene un adelanto activo.', 'Adelanto Activo');
          } else {
            await this.dialogService.alert('Error al solicitar adelanto: ' + (err.error || err.message), 'Error');
          }
        }
      });
  }
}
