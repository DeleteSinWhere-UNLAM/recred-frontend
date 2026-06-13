import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
import { VentaEspontaneaService, AlumnoResumen, ProductoVenta } from './services/venta-espontanea';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-venta-espontanea-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ZXingScannerModule, NavbarComponent],
  styleUrl: './venta-espontanea-page.component.css',
  template: `
    <app-navbar [userName]="'Kiosquero'" />
    <main class="venta">
      <div class="venta__container">
        <!-- Header -->
        <div class="venta__cabecera">
          <button (click)="router.navigate(['/kiosquero'])" class="venta__volver">
            <i class="fa-solid fa-arrow-left"></i> <span>Volver</span>
          </button>
          <div class="venta__titulo-bloque">
            <h1 class="venta__titulo">Venta Espontánea</h1>
            <p class="venta__subtitulo">Buffet Instituto San José</p>
          </div>
          <div></div>
        </div>

        <!-- Error modal básico -->
        @if (mensajeError()) {
        <div class="venta__error">
          <p class="venta__error-titulo"><i class="fa-solid fa-triangle-exclamation"></i> No se pudo procesar</p>
          <p class="venta__error-texto">{{ mensajeError() }}</p>
          <button class="venta__error-cerrar" (click)="mensajeError.set('')">Cerrar</button>
        </div>
        }

        <!-- Paso 1: Seleccionar Alumno -->
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
            <div class="venta__resultado-item"
                 (click)="seleccionarAlumno(alumno)"
                 (keydown.enter)="seleccionarAlumno(alumno)"
                 (keydown.space)="seleccionarAlumno(alumno)"
                 tabindex="0">
              <div>
                <p class="venta__resultado-nombre">{{ alumno.nombre }} {{ alumno.apellido }}</p>
                <p class="venta__resultado-dni">DNI: {{ alumno.dni || 'N/A' }}</p>
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
            (click)="toggleEscaneo()">
            <i class="fa-solid" [ngClass]="escaneando() ? 'fa-xmark' : 'fa-qrcode'"></i>
            {{ escaneando() ? 'Cancelar Escaneo' : 'Escanear QR' }}
          </button>

          @if (escaneando()) {
          <div class="venta__escaner">
            <zxing-scanner 
              (scanSuccess)="onCodeResult($event)"
              [formats]="formats">
            </zxing-scanner>
          </div>
          }
        </div>
        }

        <!-- Paso 2: Productos -->
        @if (alumnoSeleccionado()) {
        <div>
          <!-- Info Alumno Seleccionado -->
          <div class="venta__comprador">
            <div class="venta__comprador-info">
              <div class="venta__comprador-avatar">
                {{ alumnoSeleccionado()?.nombre?.charAt(0) }}{{ alumnoSeleccionado()?.apellido?.charAt(0) }}
              </div>
              <div>
                <p class="venta__comprador-label">Comprador Identificado</p>
                <h2 class="venta__comprador-nombre">{{ alumnoSeleccionado()?.nombre }} {{ alumnoSeleccionado()?.apellido }}</h2>
              </div>
            </div>
            <button class="venta__comprador-cambiar" (click)="cambiarAlumno()" title="Cambiar alumno">
              <i class="fa-solid fa-rotate-left"></i>
            </button>
          </div>

          <h2 class="venta__paso-titulo" style="margin-bottom: 24px;">
            <span class="venta__paso-numero">2</span>
            Catálogo Disponible
          </h2>

          <!-- Grid de Productos -->
          <div class="venta__grid">
            @for (producto of service.productos(); track producto.id) {
            <div class="producto-card"
                 [class.producto-card--bloqueado]="isBloqueado(producto)"
                 [class.producto-card--sin-stock]="producto.estadoStock === 'SIN_STOCK'">
              
              <!-- Imagen -->
              <div class="producto-card__media">
                <img [src]="producto.imagen || 'assets/placeholder.png'" alt="Producto" class="producto-card__imagen">
                
                <!-- Clasificaciones -->
                @if (producto.clasificacionesSalud?.length) {
                <div class="producto-card__badge">
                  {{ producto.clasificacionesSalud[0].descripcion }}
                </div>
                }

                <!-- Candado -->
                @if (isBloqueado(producto)) {
                <div class="producto-card__lock-btn producto-card__lock-btn--bloqueado">
                  <i class="fa-solid fa-lock"></i>
                </div>
                }
              </div>

              <!-- Contenido -->
              <div class="producto-card__cuerpo">
                <div class="producto-card__meta">
                  <span class="producto-card__categoria">{{ producto.categoria.descripcion }}</span>
                  <span class="producto-card__precio">\${{ producto.precio }}</span>
                </div>
                
                <h3 class="producto-card__nombre">{{ producto.nombre }}</h3>

                <!-- Controles Agregar -->
                <div class="producto-card__acciones">
                  @if (isBloqueado(producto)) {
                    <div class="producto-card__cta producto-card__cta--bloqueado">
                      {{ getMotivoBloqueo(producto) }}
                    </div>
                  } @else {
                    @if (getCantidad(producto) === 0) {
                      <button class="producto-card__cta" (click)="sumar(producto)">
                        <i class="fa-solid fa-cart-plus"></i> Agregar
                      </button>
                    } @else {
                      <div class="producto-card__cantidad">
                        <button class="producto-card__cantidad-btn" (click)="restar(producto)"><i class="fa-solid fa-minus"></i></button>
                        <span class="producto-card__cantidad-valor">{{ getCantidad(producto) }}</span>
                        <button class="producto-card__cantidad-btn" (click)="sumar(producto)"><i class="fa-solid fa-plus"></i></button>
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
      </div>

      <!-- Footer Cart -->
      @if (alumnoSeleccionado() && getTotal() > 0) {
      <div class="venta__footer">
        <div class="venta__footer-container">
          <div class="venta__total">
            <span class="venta__total-label">Total a Cobrar</span>
            <span class="venta__total-valor">\${{ getTotal() }}</span>
          </div>
          <button class="venta__btn-cobrar" [disabled]="procesando()" (click)="confirmarVenta()">
            @if (procesando()) {
            <span><i class="fa-solid fa-circle-notch fa-spin"></i> Procesando</span>
            } @else {
            <span>Confirmar Venta <i class="fa-solid fa-arrow-right"></i></span>
            }
          </button>
        </div>
      </div>
      }
    </main>
  `
})
export class VentaEspontaneaPageComponent implements OnInit {
  service = inject(VentaEspontaneaService);
  router = inject(Router);

  formats = [BarcodeFormat.QR_CODE];

  alumnoSeleccionado = signal<AlumnoResumen | null>(null);
  busquedaAlumno = '';
  alumnosFiltrados = signal<AlumnoResumen[]>([]);
  escaneando = signal(false);
  
  carrito = signal<Map<string, number>>(new Map());
  procesando = signal(false);
  mensajeError = signal('');

  ngOnInit() {
    this.service.cargarAlumnos().subscribe();
  }

  isBloqueado(producto: ProductoVenta): boolean {
    return !!producto.bloqueado || !!producto.superaPresupuesto || producto.estadoStock === 'SIN_STOCK';
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
    const filtrados = this.service.alumnos().filter(a => 
      a.nombre.toLowerCase().includes(q) || 
      a.apellido.toLowerCase().includes(q) || 
      (a.dni && a.dni.toLowerCase().includes(q))
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
    this.escaneando.update(v => !v);
  }

  onCodeResult(resultString: string) {
    let idABuscar = resultString;
    try {
      const parsed = JSON.parse(resultString);
      if (parsed.alumnoId) {
        idABuscar = parsed.alumnoId;
      }
    } catch {
      // ignore
    }

    const alumno = this.service.alumnos().find(a => a.id === idABuscar);
    if (alumno) {
      this.seleccionarAlumno(alumno);
    } else {
      this.mensajeError.set('No se encontró el alumno del código QR escaneado.');
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
      const p = this.service.productos().find(x => x.id === id);
      if (p) sum += p.precio * cant;
    }
    return sum;
  }

  confirmarVenta() {
    const alumno = this.alumnoSeleccionado();
    if (!alumno) return;

    const items: ProductoVenta[] = [];
    for (const [id, cant] of this.carrito().entries()) {
      const p = this.service.productos().find(x => x.id === id);
      if (p && cant > 0) {
        items.push({ ...p, cantidad: cant });
      }
    }

    if (items.length === 0) return;

    this.procesando.set(true);
    this.mensajeError.set('');

    this.service.procesarVenta(alumno.id, items).subscribe({
      next: () => {
        this.procesando.set(false);
        alert('¡Venta realizada con éxito!');
        this.router.navigate(['/kiosquero']);
      },
      error: (err) => {
        this.procesando.set(false);
        this.mensajeError.set(err.error?.mensaje || err.message || 'Error desconocido');
      }
    });
  }
}
