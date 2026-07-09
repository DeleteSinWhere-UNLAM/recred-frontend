import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlumnoContextoService } from '../../core/services/alumno-contexto.service';
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
export class AdelantoPage {
  private readonly contextoService = inject(AlumnoContextoService);
  private readonly location = inject(Location);
  private readonly microcreditosService = inject(MicrocreditosService);
  private readonly dialogService = inject(DialogService);
  private readonly perfilService = inject(PerfilService);
  private readonly alumnosService = inject(AlumnosService);
  private readonly toastService = inject(ToastService);

  alumno = signal<Alumno | null>(null);
  creditoActivo = signal<SchoolCredit | null>(null);
  cargando = signal<boolean>(true);
  procesando = signal<boolean>(false);
  
  historialSaldados = signal<SchoolCredit[]>([]);
  
  montoFijo = signal<number>(5000);
  cuotas = signal<number>(1);

  constructor() {
    effect(() => {
      const alumnoId = this.contextoService.alumnoId();
      if (!alumnoId) {
        this.volver();
        return;
      }
      this.cargarAlumno(alumnoId);
    });
  }

  cargarAlumno(alumnoId: string): void {
    this.cargando.set(true);
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
          this.cargarHistorial(al.id);
        },
        error: () => {
          this.creditoActivo.set(null);
          this.cargarHistorial(al.id);
        }
      });
    }).catch(() => {
      this.toastService.mostrar('Error al cargar alumno', 'error');
      this.volver();
    });
  }

  cargarHistorial(studentId: string): void {
    this.microcreditosService.getHistory(studentId).subscribe({
      next: (historial) => {
        const saldados = historial.filter(c => c.status === 'PAID');
        this.historialSaldados.set(saldados);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      }
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

    if (this.procesando()) return;
    this.procesando.set(true);

    this.microcreditosService.requestCredit(al.id, parentId, finalAmount, this.cuotas())
      .subscribe({
        next: async (res) => {
          this.procesando.set(false);
          await this.dialogService.alert('Adelanto habilitado exitosamente por: $' + res.amount, 'Adelanto Habilitado');
          this.creditoActivo.set(res);
        },
        error: async (err) => {
          this.procesando.set(false);
          console.error('Error HTTP:', err);
          if (err.status === 409) {
            await this.dialogService.alert('El alumno ya tiene un adelanto activo.', 'Adelanto Activo');
          } else {
            await this.dialogService.alert('Error al solicitar adelanto: ' + (err.error || err.message), 'Error');
          }
        }
      });
  }

  async pagarAdelanto(): Promise<void> {
    const al = this.alumno();
    const credito = this.creditoActivo();
    if (!al || !credito) return;
    
    if (al.saldo < credito.amount) {
      await this.dialogService.alert('Saldo insuficiente para pagar el adelanto.', 'Saldo Insuficiente');
      return;
    }

    const confirm = await this.dialogService.confirm(`¿Estás seguro de que deseas saldar el adelanto de $${credito.amount}?`, 'Pagar Adelanto');
    if (!confirm) return;

    const creditIdToPay = credito.id || credito.creditId;
    if (!creditIdToPay) {
      await this.dialogService.alert('No se pudo identificar el adelanto a pagar.', 'Error');
      return;
    }

    this.cargando.set(true);
    this.microcreditosService.payCredit(creditIdToPay).subscribe({
      next: async () => {
        await this.dialogService.alert('El adelanto ha sido saldado exitosamente.', 'Adelanto Saldado');
        this.creditoActivo.set(null);
        al.saldo -= credito.amount;
        this.cargarHistorial(al.id);
      },
      error: async (err) => {
        this.cargando.set(false);
        const errorMessage = typeof err.error === 'string' ? err.error : (err.error?.message || err.message);
        await this.dialogService.alert('Error al pagar el adelanto: ' + errorMessage, 'Error');
      }
    });
  }
}
