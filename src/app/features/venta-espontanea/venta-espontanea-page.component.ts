import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
import {
  VentaEspontaneaService,
  AlumnoResumen,
  ProductoVenta,
} from './services/venta-espontanea';

import { FeriadosService } from '../../shared/services/feriados.service';
import { DialogService } from '../../shared/services/dialog.service';

@Component({
  selector: 'app-venta-espontanea-page',
  standalone: true,
  imports: [NavbarComponent, CommonModule, FormsModule, ZXingScannerModule],
  styleUrl: './venta-espontanea-page.component.css',
  template: `
    <app-navbar [userName]="'Kiosquero'" />
    <main class="venta">
      <div class="venta__container">
        <div class="venta__cabecera">
          <button
            (click)="router.navigate(['/kiosquero'])"
            class="venta__volver"
          >
            <i class="fa-solid fa-arrow-left"></i> <span>Volver</span>
          </button>
          <div class="venta__titulo-bloque">
            <h1 class="venta__titulo">Venta Espontánea</h1>
            <p class="venta__subtitulo">Buffet Instituto San José</p>
          </div>
          <div class="venta__cabecera-acciones">
            <label
              class="venta__toggle-dias"
              title="Permite realizar ventas espontáneas durante fines de semana y feriados"
            >
              <input
                type="checkbox"
                [checked]="ventasDiasNoLaborablesHabilitadas()"
                (change)="toggleDiasNoLaborables($event)"
              />
              <span>Habilitar Fines de Semana / Feriados</span>
            </label>
          </div>
        </div>
        @if (mensajeError()) {
          <div class="venta__error">
            <p class="venta__error-titulo">
              <i class="fa-solid fa-triangle-exclamation"></i> No se pudo
              procesar
            </p>
            <p class="venta__error-texto">{{ mensajeError() }}</p>
            <button class="venta__error-cerrar" (click)="mensajeError.set('')">
              Cerrar
            </button>
          </div>
        }
        @if (bloqueadoPorDiaNoLaborable()) {
          <div class="venta__bloqueo-dia">
            <div class="venta__bloqueo-contenido">
              <div class="venta__bloqueo-icono">
                <i class="fa-solid fa-store-slash"></i>
              </div>
              <h2 class="venta__bloqueo-titulo">Día No Laborable</h2>
              <p class="venta__bloqueo-texto">{{ mensajeBloqueoDia() }}</p>
              <p class="venta__bloqueo-subtexto">
                La venta espontánea está inhabilitada por defecto en días no
                laborables.
              </p>
              <button
                class="venta__btn-desbloquear"
                (click)="habilitarDiasNoLaborables()"
              >
                <i class="fa-solid fa-unlock"></i> Desbloquear Ventas Hoy
              </button>
            </div>
          </div>
        } @else {
          @if (!alumnoSeleccionado()) {
            <div class="venta__paso">
              <h2 class="venta__paso-titulo">
                <span class="venta__paso-numero">1</span>
                Identificar Alumno
              </h2>

              <div class="venta__buscador">
                <label for="busqueda-alumno">Buscar por DNI o Nombre</label>
                <div class="venta__input-group">
                  <i class="fa-solid fa-magnifying-glass"></i>
                  <input
                    id="busqueda-alumno"
                    type="text"
                    placeholder="Ej: 12345678 o Juan"
                    [(ngModel)]="busquedaAlumno"
                    (input)="filtrarAlumnos()"
                  />
                </div>
              </div>

              @if (alumnosFiltrados().length > 0) {
                <div class="venta__resultados">
                  @for (alumno of alumnosFiltrados(); track alumno.id) {
                    <div
                      class="venta__resultado-item"
                      (click)="seleccionarAlumno(alumno)"
                      (keydown.enter)="seleccionarAlumno(alumno)"
                      (keydown.space)="seleccionarAlumno(alumno)"
                      tabindex="0"
                    >
                      <div>
                        <p class="venta__resultado-nombre">
                          {{ alumno.nombre }} {{ alumno.apellido }}
                        </p>
                        <p class="venta__resultado-dni">
                          DNI: {{ alumno.dni || 'N/A' }}
                        </p>
                      </div>
                      <div class="venta__resultado-icono">
                        <i class="fa-solid fa-chevron-right"></i>
                      </div>
                    </div>
                  }
                </div>
              }

              <div class="venta__separador">
                <span>O</span>
              </div>

              <button
                class="venta__btn-escanear"
                [class.venta__btn-escanear--cancelar]="escaneando()"
                (click)="toggleEscaneo()"
              >
                <i
                  class="fa-solid"
                  [ngClass]="escaneando() ? 'fa-xmark' : 'fa-qrcode'"
                ></i>
                {{ escaneando() ? 'Cancelar Escaneo' : 'Escanear QR' }}
              </button>

              @if (escaneando()) {
                <div class="venta__escaner">
                  <zxing-scanner
                    (scanSuccess)="onCodeResult($event)"
                    [formats]="formats"
                  >
                  </zxing-scanner>
                </div>
              }
            </div>
          }
          @if (alumnoSeleccionado()) {
            <div>
              <div class="venta__comprador">
                <div class="venta__comprador-info">
                  <div class="venta__comprador-avatar">
                    {{ alumnoSeleccionado()?.nombre?.charAt(0)
                    }}{{ alumnoSeleccionado()?.apellido?.charAt(0) }}
                  </div>
                  <div>
                    <p class="venta__comprador-label">Comprador Identificado</p>
                    <h2 class="venta__comprador-nombre">
                      {{ alumnoSeleccionado()?.nombre }}
                      {{ alumnoSeleccionado()?.apellido }}
                    </h2>
                  </div>
                </div>
                <button
                  class="venta__comprador-cambiar"
                  (click)="cambiarAlumno()"
                  title="Cambiar alumno"
                >
                  <i class="fa-solid fa-rotate-left"></i>
                </button>
              </div>

              <h2 class="venta__paso-titulo" style="margin-bottom: 24px;">
                <span class="venta__paso-numero">2</span>
                Catálogo Disponible
              </h2>
              <div class="venta__grid">
                @for (producto of service.productos(); track producto.id) {
                  <div
                    class="producto-card"
                    [class.producto-card--bloqueado]="isBloqueado(producto)"
                    [class.producto-card--sin-stock]="
                      producto.estadoStock === 'SIN_STOCK'
                    "
                  >
                    <div class="producto-card__media">
                      <img
                        [src]="producto.imagen || 'https://res.cloudinary.com/djzfudbze/image/upload/v1781748941/logo_sin_fondo_ikciro.png'"
                        alt="Producto"
                        class="producto-card__imagen"
                      />
                      @if (producto.clasificacionesSalud.length) {
                        <div class="producto-card__badge">
                          {{ producto.clasificacionesSalud[0].descripcion }}
                        </div>
                      }
                      @if (isBloqueado(producto)) {
                        <div
                          class="producto-card__lock-btn producto-card__lock-btn--bloqueado"
                        >
                          <i class="fa-solid fa-lock"></i>
                        </div>
                      }
                    </div>
                    <div class="producto-card__cuerpo">
                      <div class="producto-card__meta">
                        <span class="producto-card__categoria">{{
                          producto.categoria.descripcion
                        }}</span>
                        <span class="producto-card__precio"
                          >\${{ producto.precio }}</span
                        >
                      </div>

                      <h3 class="producto-card__nombre">
                        {{ producto.nombre }}
                      </h3>
                      <div class="producto-card__acciones">
                        @if (isBloqueado(producto)) {
                          <div
                            class="producto-card__cta producto-card__cta--bloqueado"
                          >
                            {{ getMotivoBloqueo(producto) }}
                          </div>
                        } @else {
                          @if (getCantidad(producto) === 0) {
                            <button
                              class="producto-card__cta"
                              (click)="sumar(producto)"
                            >
                              <i class="fa-solid fa-cart-plus"></i> Agregar
                            </button>
                          } @else {
                            <div class="producto-card__cantidad">
                              <button
                                class="producto-card__cantidad-btn"
                                (click)="restar(producto)"
                              >
                                <i class="fa-solid fa-minus"></i>
                              </button>
                              <span class="producto-card__cantidad-valor">{{
                                getCantidad(producto)
                              }}</span>
                              <button
                                class="producto-card__cantidad-btn"
                                (click)="sumar(producto)"
                              >
                                <i class="fa-solid fa-plus"></i>
                              </button>
                            </div>
                          }
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        }
      </div>
      @if (alumnoSeleccionado() && getTotal() > 0) {
        <div class="venta__footer">
          <div class="venta__footer-container">
            <div class="venta__total">
              <span class="venta__total-label">Total a Cobrar</span>
              <span class="venta__total-valor">\${{ getTotal() }}</span>
            </div>
            <button
              class="venta__btn-cobrar"
              [disabled]="procesando()"
              (click)="confirmarVenta()"
            >
              @if (procesando()) {
                <span
                  ><i class="fa-solid fa-circle-notch fa-spin"></i>
                  Procesando</span
                >
              } @else {
                <span
                  >Confirmar Venta <i class="fa-solid fa-arrow-right"></i
                ></span>
              }
            </button>
          </div>
        </div>
      }
    </main>
  `,
})
export class VentaEspontaneaPageComponent implements OnInit {
  service = inject(VentaEspontaneaService);
  router = inject(Router);
  feriadosService = inject(FeriadosService);
  dialogService = inject(DialogService);

  formats = [BarcodeFormat.QR_CODE];

  alumnoSeleccionado = signal<AlumnoResumen | null>(null);
  busquedaAlumno = '';
  alumnosFiltrados = signal<AlumnoResumen[]>([]);
  escaneando = signal(false);

  carrito = signal<Map<string, number>>(new Map());
  procesando = signal(false);
  mensajeError = signal('');

  ventasDiasNoLaborablesHabilitadas = signal(false);
  esDiaNoLaborable = signal(false);
  mensajeBloqueoDia = signal('');

  bloqueadoPorDiaNoLaborable = signal(false);

  ngOnInit() {
    this.service.cargarAlumnos().subscribe();
    this.verificarDiaLaborable();
  }

  verificarDiaLaborable() {
    const habilitadoStorage = localStorage.getItem(
      'recred_habilitar_fines_semana',
    );
    if (habilitadoStorage === 'true') {
      this.ventasDiasNoLaborablesHabilitadas.set(true);
    }

    const hoy = new Date();
    const diaSemana = hoy.getDay();
    if (diaSemana === 0 || diaSemana === 6) {
      this.esDiaNoLaborable.set(true);
      this.mensajeBloqueoDia.set('Hoy es fin de semana.');
      this.actualizarEstadoBloqueo();
      return;
    }

    this.feriadosService.esFeriadoHoy().subscribe((res) => {
      if (res.esFeriado) {
        this.esDiaNoLaborable.set(true);
        this.mensajeBloqueoDia.set(`Hoy es feriado: ${res.motivo}.`);
        this.actualizarEstadoBloqueo();
      }
    });
  }

  actualizarEstadoBloqueo() {
    this.bloqueadoPorDiaNoLaborable.set(
      this.esDiaNoLaborable() && !this.ventasDiasNoLaborablesHabilitadas(),
    );
  }

  habilitarDiasNoLaborables() {
    this.ventasDiasNoLaborablesHabilitadas.set(true);
    localStorage.setItem('recred_habilitar_fines_semana', 'true');
    this.actualizarEstadoBloqueo();
  }

  toggleDiasNoLaborables(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.ventasDiasNoLaborablesHabilitadas.set(checked);
    localStorage.setItem(
      'recred_habilitar_fines_semana',
      checked ? 'true' : 'false',
    );
    this.actualizarEstadoBloqueo();
  }

  isBloqueado(producto: ProductoVenta): boolean {
    return (
      !!producto.bloqueado ||
      !!producto.superaPresupuesto ||
      producto.estadoStock === 'SIN_STOCK'
    );
  }

  getMotivoBloqueo(producto: ProductoVenta): string {
    if (producto.bloqueado) return 'Bloqueado por el tutor';
    if (producto.superaPresupuesto) return 'Supera límite de presupuesto';
    if (producto.estadoStock === 'SIN_STOCK') return 'Sin stock disponible';
    return 'No disponible';
  }

  filtrarAlumnos() {
    const q = this.busquedaAlumno.toLowerCase().trim();
    if (!q) {
      this.alumnosFiltrados.set([]);
      return;
    }
    const filtrados = this.service
      .alumnos()
      .filter(
        (a) =>
          a.nombre.toLowerCase().includes(q) ||
          a.apellido.toLowerCase().includes(q) ||
          (a.dni && a.dni.toLowerCase().includes(q)),
      );
    this.alumnosFiltrados.set(filtrados);
  }

  seleccionarAlumno(alumno: AlumnoResumen) {
    this.alumnoSeleccionado.set(alumno);
    this.escaneando.set(false);
    this.busquedaAlumno = '';
    this.alumnosFiltrados.set([]);
    this.carrito.set(new Map());
    this.mensajeError.set('');
    this.service.cargarProductosDelAlumno(alumno.id).subscribe();
  }

  cambiarAlumno() {
    this.alumnoSeleccionado.set(null);
    this.carrito.set(new Map());
    this.mensajeError.set('');
  }

  toggleEscaneo() {
    this.escaneando.update((v) => !v);
  }

  onCodeResult(resultString: string) {
    let idABuscar = resultString;
    const parsed = JSON.parse(resultString);
    if (parsed.alumnoId) {
      idABuscar = parsed.alumnoId;
    }

    const alumno = this.service.alumnos().find((a) => a.id === idABuscar);
    if (alumno) {
      this.seleccionarAlumno(alumno);
    } else {
      this.mensajeError.set(
        'No se encontró el alumno del código QR escaneado.',
      );
      this.escaneando.set(false);
    }
  }

  getCantidad(producto: ProductoVenta): number {
    return this.carrito().get(producto.id) || 0;
  }

  sumar(producto: ProductoVenta) {
    const map = new Map(this.carrito());
    map.set(producto.id, (map.get(producto.id) || 0) + 1);
    this.carrito.set(map);
  }

  restar(producto: ProductoVenta) {
    const map = new Map(this.carrito());
    const val = map.get(producto.id) || 0;
    if (val > 0) {
      map.set(producto.id, val - 1);
    }
    if (map.get(producto.id) === 0) {
      map.delete(producto.id);
    }
    this.carrito.set(map);
  }

  getTotal(): number {
    let sum = 0;
    for (const [id, cant] of this.carrito().entries()) {
      const p = this.service.productos().find((x) => x.id === id);
      if (p) sum += p.precio * cant;
    }
    return sum;
  }

  confirmarVenta() {
    const alumno = this.alumnoSeleccionado();
    if (!alumno) return;

    const items: ProductoVenta[] = [];
    for (const [id, cant] of this.carrito().entries()) {
      const p = this.service.productos().find((x) => x.id === id);
      if (p && cant > 0) {
        items.push({ ...p, cantidad: cant });
      }
    }

    if (items.length === 0) return;

    this.procesando.set(true);
    this.mensajeError.set('');

    this.service.procesarVenta(alumno.id, items).subscribe({
      next: async () => {
        this.procesando.set(false);
        await this.dialogService.alert('¡Venta realizada con éxito!', 'Venta Exitosa');
        this.router.navigate(['/kiosquero']);
      },
      error: (err) => {
        this.procesando.set(false);
        this.mensajeError.set(
          err.error?.mensaje || err.message || 'Error desconocido',
        );
      },
    });
  }
}
