import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BuffetService } from '../buffet/services/buffet.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { DialogService } from '../../shared/services/dialog.service';
import { FeriadosService } from '../../shared/services/feriados.service';
import {
  AlumnoResumenMother,
  BuffetMother,
  ProductoVentaMother,
} from './venta-espontanea.mother';
import { VentaEspontaneaPageComponent } from './venta-espontanea-page.component';

@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStub {
  @Input() userName = '';
}

describe('VentaEspontanea Integration', () => {
  const URL_ALUMNOS = `${environment.apiUrl}/alumnos`;

  let fixture: ComponentFixture<VentaEspontaneaPageComponent>;
  let httpMock: HttpTestingController;
  let buffetService: jasmine.SpyObj<BuffetService>;

  beforeEach(async () => {
    buffetService = jasmine.createSpyObj<BuffetService>('BuffetService', [
      'obtenerBuffetDelAlumno',
      'getProductosDelBuffet',
    ]);
    buffetService.obtenerBuffetDelAlumno.and.returnValue(of(BuffetMother.crear()));
    buffetService.getProductosDelBuffet.and.returnValue(of(ProductoVentaMother.crearVarios()));

    const feriadosService = jasmine.createSpyObj<FeriadosService>('FeriadosService', ['esFeriadoHoy']);
    feriadosService.esFeriadoHoy.and.returnValue(of({ esFeriado: false }));

    await TestBed.configureTestingModule({
      imports: [VentaEspontaneaPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: BuffetService, useValue: buffetService },
        { provide: FeriadosService, useValue: feriadosService },
        {
          provide: DialogService,
          useValue: jasmine.createSpyObj<DialogService>('DialogService', ['alert']),
        },
        { provide: Router, useValue: jasmine.createSpyObj<Router>('Router', ['navigate']) },
      ],
    })
      .overrideComponent(VentaEspontaneaPageComponent, {
        remove: { imports: [NavbarComponent, ZXingScannerModule] },
        add: { imports: [NavbarStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(VentaEspontaneaPageComponent);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('dado que el back devuelve alumnos, cuando se monta la page, deberia pegar a /alumnos y renderizar el titulo', () => {
    givenEsDiaLaborable('2026-07-01');

    whenMonto();
    whenElBackDevuelveAlumnos(AlumnoResumenMother.crearVarios());

    const titulo = (fixture.nativeElement as HTMLElement).querySelector('.venta__titulo');
    expect(titulo?.textContent).toContain('Venta Espontánea');
    jasmine.clock().uninstall();
  });

  function givenEsDiaLaborable(fechaISO: string): void {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(fechaISO));
  }

  function whenMonto(): void {
    fixture.detectChanges();
  }

  function whenElBackDevuelveAlumnos(alumnos: ReturnType<typeof AlumnoResumenMother.crearVarios>): void {
    const req = httpMock.expectOne(URL_ALUMNOS);
    expect(req.request.method).toBe('GET');
    req.flush(alumnos);
    fixture.detectChanges();
  }
});
