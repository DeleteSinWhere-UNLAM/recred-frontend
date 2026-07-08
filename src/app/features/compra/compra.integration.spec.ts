import { Component, EventEmitter, Input, Output, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { PerfilService } from '../../data-access/services/perfil.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ToastService } from '../../shared/services/toast.service';
import { SugerenciasService } from '../sugerencias/services/sugerencias.service';
import { OrdenCompraMother } from './compra.mother';
import { ResumenOrdenCardComponent } from './components/resumen-orden-card/resumen-orden-card.component';
import { ConfirmarPage } from './confirmar/confirmar.page';
import { OrdenCompra } from './models/orden-compra.model';
import { CarritoService } from './services/carrito.service';
import { CompraService } from './services/compra.service';

@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStub {
  @Input() userName = '';
}

interface ResumenLineaStub {
  alumnoId: string;
  nombre: string;
  subtotal: number;
  incluido: boolean;
}

@Component({
  selector: 'app-resumen-orden-card',
  template: '<button class="stub-cta" (click)="accion.emit()">CTA</button>',
  standalone: true,
})
class ResumenOrdenCardStub {
  @Input() lineas: ResumenLineaStub[] = [];
  @Input() total = 0;
  @Input() cargando = false;
  @Input() ctaLabel = '';
  @Input() ctaDeshabilitado = false;
  @Input() advertencia: string | null = null;
  @Output() accion = new EventEmitter<void>();
}

describe('Compra (confirmar) Integration', () => {
  let fixture: ComponentFixture<ConfirmarPage>;
  let servicioCompra: jasmine.SpyObj<CompraService>;
  let servicioCarrito: jasmine.SpyObj<CarritoService>;
  let servicioSugerencias: jasmine.SpyObj<SugerenciasService>;
  let servicioToast: jasmine.SpyObj<ToastService>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;
  let router: Router;
  let ordenEnCurso: WritableSignal<OrdenCompra | null>;

  beforeEach(async () => {
    ordenEnCurso = signal<OrdenCompra | null>(OrdenCompraMother.crear());

    servicioCompra = jasmine.createSpyObj('CompraService', ['procesarPago', 'cancelarOrden'], {
      ordenEnCurso: ordenEnCurso.asReadonly(),
    });
    servicioCompra.procesarPago.and.returnValue(of(OrdenCompraMother.crearPagada()));

    servicioCarrito = jasmine.createSpyObj('CarritoService', ['limpiarAlumno']);
    servicioSugerencias = jasmine.createSpyObj('SugerenciasService', ['comprarSugerencia']);
    servicioToast = jasmine.createSpyObj('ToastService', ['mostrar']);

    servicioUsuario = jasmine.createSpyObj('UsuarioService', ['esVistaAlumno', 'homeUrl']);
    servicioUsuario.esVistaAlumno.and.returnValue(false);
    servicioUsuario.homeUrl.and.returnValue('/tutor');
    (servicioUsuario as unknown as { nombreNavbar: WritableSignal<string> }).nombreNavbar =
      signal('Tutor Test');

    await TestBed.configureTestingModule({
      imports: [ConfirmarPage],
      providers: [
        { provide: CompraService, useValue: servicioCompra },
        { provide: CarritoService, useValue: servicioCarrito },
        { provide: SugerenciasService, useValue: servicioSugerencias },
        { provide: ToastService, useValue: servicioToast },
        { provide: UsuarioService, useValue: servicioUsuario },
        {
          provide: PerfilService,
          useValue: {
            perfil: signal(null).asReadonly(),
            rol: signal('PADRE').asReadonly(),
          },
        },
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    })
      .overrideComponent(ConfirmarPage, {
        remove: { imports: [NavbarComponent, ResumenOrdenCardComponent] },
        add: { imports: [NavbarStub, ResumenOrdenCardStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ConfirmarPage);
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
  });

  it('dado una orden en curso, cuando se monta la page, deberia renderizar el titulo y las ordenes', () => {
    whenMonto();

    expect(queryTexto('.confirmar-page__titulo')).toBe('Confirmar Compra');
    expect(fixture.nativeElement.textContent).toContain('Nombre'); // alumno de la mother
  });

  it('dado sin orden en curso, cuando se monta, deberia redirigir a /compra', () => {
    ordenEnCurso.set(null);

    whenMonto();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/compra');
  });

  it('dado el CTA del resumen, cuando se dispara, deberia procesar el pago, limpiar el carrito y navegar a /compra/exito', () => {
    whenMonto();

    (queryUno('.stub-cta') as HTMLButtonElement).click();

    expect(servicioCompra.procesarPago).toHaveBeenCalled();
    expect(servicioCarrito.limpiarAlumno).toHaveBeenCalledWith('alumno-1');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/compra/exito');
  });

  it('dado que el pago falla, cuando confirmo, deberia mostrar toast de error y no navegar', () => {
    servicioCompra.procesarPago.and.returnValue(throwError(() => new Error('boom')));

    whenMonto();
    (queryUno('.stub-cta') as HTMLButtonElement).click();

    expect(servicioToast.mostrar).toHaveBeenCalledWith(jasmine.any(String), 'error');
    expect(router.navigateByUrl).not.toHaveBeenCalledWith('/compra/exito');
  });

  it('dado el boton Editar carrito, cuando lo clickeo, deberia cancelar la orden y navegar a /compra', () => {
    whenMonto();

    (queryUno('.confirmar-page__volver') as HTMLButtonElement).click();

    expect(servicioCompra.cancelarOrden).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/compra');
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }

  function queryUno(selector: string): Element | null {
    return (fixture.nativeElement as HTMLElement).querySelector(selector);
  }

  function queryTexto(selector: string): string {
    return queryUno(selector)?.textContent?.trim() ?? '';
  }
});
