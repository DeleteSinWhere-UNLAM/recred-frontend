import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, finalize, forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { SugerenciaAgregarProducto } from '../../sugerencias-agregar/models/sugerencia-agregar.model';
import { SugerenciasAgregarService } from '../../sugerencias-agregar/services/sugerencias-agregar.service';
import {
  SuggestedProduct,
  SugerenciaProducto,
} from '../../sugerencias/models/sugerencia-producto.model';
import { SugerenciasService } from '../../sugerencias/services/sugerencias.service';
import { PromotionFormData } from '../../sugerencias/components/combo-promotion-modal/combo-promotion-modal.component';
import { PromotionService } from '../../../data-access/services/promociones/promotion.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ProductoService } from '../../inventario/services/producto.service';
import { Producto } from '../../inventario/models/producto.interface';
import { buildCloudinaryCollageUrl } from '../../../shared/utils/cloudinary-collage.helper';
import {
  ResumenInteligenciaComercial,
  TarjetaOportunidadComercial,
} from '../models/inteligencia-comercial.model';

@Injectable()
export class InteligenciaComercialPresenter {
  private readonly sugerenciasAgregarService = inject(SugerenciasAgregarService);
  private readonly sugerenciasService = inject(SugerenciasService);
  private readonly promotionService = inject(PromotionService);
  private readonly toastService = inject(ToastService);
  private readonly productService = inject(ProductoService);
  private readonly router = inject(Router);

  private readonly oportunidadesAgregarState = new BehaviorSubject<SugerenciaAgregarProducto[]>([]);
  readonly oportunidadesAgregar$ = this.oportunidadesAgregarState.asObservable();

  private readonly bajaRotacionState = new BehaviorSubject<SugerenciaProducto[]>([]);
  readonly bajaRotacion$ = this.bajaRotacionState.asObservable();

  private readonly loadingAgregarState = new BehaviorSubject<boolean>(false);
  readonly loadingAgregar$ = this.loadingAgregarState.asObservable();

  private readonly loadingRotacionState = new BehaviorSubject<boolean>(false);
  readonly loadingRotacion$ = this.loadingRotacionState.asObservable();

  private readonly errorAgregarState = new BehaviorSubject<string | null>(null);
  readonly errorAgregar$ = this.errorAgregarState.asObservable();

  private readonly errorRotacionState = new BehaviorSubject<string | null>(null);
  readonly errorRotacion$ = this.errorRotacionState.asObservable();

  private readonly modalComboAbiertoState = new BehaviorSubject<boolean>(false);
  readonly modalComboAbierto$ = this.modalComboAbiertoState.asObservable();

  private readonly productosSugeridosState = new BehaviorSubject<SuggestedProduct[]>([]);
  readonly productosSugeridos$ = this.productosSugeridosState.asObservable();

  private readonly bajaRotacionSeleccionadaState = new BehaviorSubject<SugerenciaProducto | null>(null);
  readonly bajaRotacionSeleccionada$ = this.bajaRotacionSeleccionadaState.asObservable();

  inicializar(): void {
    this.cargarOportunidadesAgregar();
    this.cargarBajaRotacion();
  }

  verOportunidadesStock(): void {
    this.router.navigateByUrl('/sugerencias-agregar');
  }

  verBajaRotacion(): void {
    this.router.navigateByUrl('/kiosquero/sugerencias');
  }

  cargarProducto(): void {
    this.router.navigateByUrl('/admin-productos');
  }

  crearPromocion(): void {
    const producto = this.productoCriticoBajaRotacion();

    if (!producto) {
      this.router.navigateByUrl('/kiosquero/sugerencias');
      return;
    }

    this.abrirPromocionParaProducto(producto.estadisticasVenta.productoId);
  }

  darAltaOportunidad(oportunidadId: string): void {
    const oportunidad = this.oportunidadesAgregarState
      .getValue()
      .find((item) => item.id === oportunidadId);

    if (!oportunidad) {
      this.router.navigateByUrl('/admin-productos');
      return;
    }

    this.router.navigate(['/admin-productos'], {
      queryParams: {
        origen: 'oportunidad-stock',
        nombreProducto: oportunidad.metadata.productName,
        precioProducto: oportunidad.metadata.productPrice,
      },
    });
  }

  abrirPromocionParaProducto(productoId: string): void {
    const producto = this.bajaRotacionState
      .getValue()
      .find((item) => item.estadisticasVenta.productoId === productoId);

    if (!producto) {
      this.router.navigateByUrl('/kiosquero/sugerencias');
      return;
    }

    this.bajaRotacionSeleccionadaState.next(producto);
    this.sugerenciasService.getComboSuggestions(productoId).subscribe({
      next: (sugerencias) => {
        this.productosSugeridosState.next(sugerencias.suggestedProducts);
        this.modalComboAbiertoState.next(true);
      },
      error: () => {
        this.toastService.mostrar('No se pudieron cargar sugerencias para el combo', 'error');
      },
    });
  }

  cerrarModalCombo(): void {
    this.modalComboAbiertoState.next(false);
    this.productosSugeridosState.next([]);
  }

  generarPromocion(datosFormulario: PromotionFormData): void {
    const seleccionado = this.bajaRotacionSeleccionadaState.getValue();

    if (!seleccionado) {
      return;
    }

    const idsProductos = [seleccionado.estadisticasVenta.productoId, ...datosFormulario.productIds];

    forkJoin(
      idsProductos.map((id) =>
        this.productService.getById(id).pipe(
          catchError(() =>
            of({
              id,
              nombre: '',
              descripcion: '',
              precio: 0,
              peso: 0,
              requierePreparacion: false,
              stockActual: 0,
              urlImagen: null,
            } as Producto),
          ),
        ),
      ),
    )
      .pipe(
        switchMap((productos) => {
          const datosPromocion = {
            name: `Combo ${seleccionado.productoOriginal}`,
            discountPercentage: datosFormulario.discountPercentage,
            startDate: new Date(datosFormulario.startDate).toISOString(),
            endDate: new Date(datosFormulario.endDate).toISOString(),
            productIds: idsProductos,
            imageUrl: buildCloudinaryCollageUrl(productos.map((producto) => producto.urlImagen)),
          };

          return this.promotionService.createPromotion(datosPromocion);
        }),
      )
      .subscribe({
        next: () => {
          this.cerrarModalCombo();
          this.toastService.mostrar('Combo creado exitosamente', 'success');
          this.router.navigateByUrl('/promociones');
        },
        error: () => {
          this.toastService.mostrar('Error al crear el combo', 'error');
        },
      });
  }

  get estaCargando(): boolean {
    return this.loadingAgregarState.getValue() || this.loadingRotacionState.getValue();
  }

  get tieneErrores(): boolean {
    return Boolean(this.errorAgregarState.getValue() || this.errorRotacionState.getValue());
  }

  get resumen(): ResumenInteligenciaComercial {
    const agregar = this.oportunidadesAgregarState.getValue();
    const rotacion = this.bajaRotacionState.getValue();
    const totalDias = rotacion.reduce(
      (total, sugerencia) => total + sugerencia.estadisticasVenta.diasSinVenta,
      0,
    );

    return {
      productosParaAgregar: agregar.length,
      ingresoPotencial: agregar.reduce(
        (total, sugerencia) => total + sugerencia.metadata.totalRevenue,
        0,
      ),
      clientesAlcanzables: agregar.reduce(
        (total, sugerencia) => total + sugerencia.metadata.totalCustomers,
        0,
      ),
      productosBajaRotacion: rotacion.length,
      stockInmovilizado: rotacion.reduce(
        (total, sugerencia) => total + sugerencia.estadisticasVenta.stockActual,
        0,
      ),
      promedioDiasSinVenta: rotacion.length === 0 ? 0 : Math.round(totalDias / rotacion.length),
    };
  }

  get principalesOportunidadesAgregar(): TarjetaOportunidadComercial[] {
    const oportunidades = [...this.oportunidadesAgregarState.getValue()]
      .sort((a, b) => b.metadata.totalRevenue - a.metadata.totalRevenue)
      .slice(0, 5);

    return oportunidades.map((oportunidad) => ({
      id: oportunidad.id,
      titulo: oportunidad.metadata.productName,
      descripcion: oportunidad.mensaje,
      etiquetaMetricaPrincipal: 'Ingreso potencial',
      valorMetricaPrincipal: this.formatearMoneda(oportunidad.metadata.totalRevenue),
      etiquetaMetricaSecundaria: 'Clientes',
      valorMetricaSecundaria: String(oportunidad.metadata.totalCustomers),
      tono: 'exito',
    }));
  }

  get principalesBajaRotacion(): TarjetaOportunidadComercial[] {
    const sugerencias = [...this.bajaRotacionState.getValue()]
      .sort((a, b) => b.estadisticasVenta.diasSinVenta - a.estadisticasVenta.diasSinVenta)
      .slice(0, 5);

    return sugerencias.map((sugerencia) => ({
      id: sugerencia.estadisticasVenta.productoId,
      titulo: sugerencia.productoOriginal,
      descripcion: sugerencia.resumen,
      etiquetaMetricaPrincipal: 'Dias sin venta',
      valorMetricaPrincipal: String(sugerencia.estadisticasVenta.diasSinVenta),
      etiquetaMetricaSecundaria: 'Stock',
      valorMetricaSecundaria: String(sugerencia.estadisticasVenta.stockActual),
      tono: sugerencia.estadisticasVenta.diasSinVenta >= 10 ? 'peligro' : 'advertencia',
    }));
  }

  formatearMoneda(value: number): string {
    return '$' + value.toLocaleString('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  private cargarOportunidadesAgregar(): void {
    this.loadingAgregarState.next(true);
    this.errorAgregarState.next(null);

    this.sugerenciasAgregarService
      .getSugerenciasAgregarProducto()
      .pipe(finalize(() => this.loadingAgregarState.next(false)))
      .subscribe({
        next: (data) => this.oportunidadesAgregarState.next(data),
        error: () => {
          this.oportunidadesAgregarState.next([]);
          this.errorAgregarState.next('No se pudieron cargar las oportunidades para agregar productos.');
        },
      });
  }

  private cargarBajaRotacion(): void {
    this.loadingRotacionState.next(true);
    this.errorRotacionState.next(null);

    this.sugerenciasService
      .getSugerencias()
      .pipe(finalize(() => this.loadingRotacionState.next(false)))
      .subscribe({
        next: (data) => this.bajaRotacionState.next(data),
        error: () => {
          this.bajaRotacionState.next([]);
          this.errorRotacionState.next('No se pudieron cargar los productos con baja rotacion.');
        },
      });
  }

  private productoCriticoBajaRotacion(): SugerenciaProducto | undefined {
    return [...this.bajaRotacionState.getValue()].sort(
      (a, b) => b.estadisticasVenta.diasSinVenta - a.estadisticasVenta.diasSinVenta,
    )[0];
  }
}
