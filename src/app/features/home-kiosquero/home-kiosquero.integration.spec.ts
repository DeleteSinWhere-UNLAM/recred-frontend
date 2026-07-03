import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { PerfilMother } from '../../data-access/services/alumno.mother';
import { PerfilService } from '../../data-access/services/perfil.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { InventarioRealtimeService } from '../inventario/services/inventario-realtime.service';
import { BUFFET_ID_TEST, PanelKiosqueroMother } from './home-kiosquero.mother';
import { KiosqueroReportesPage } from './kiosquero-reportes.page';
import { HomeKiosqueroService } from './services/home-kiosquero.service';

@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStub {
  @Input() userName = '';
}

describe('KiosqueroReportes Integration', () => {
  let fixture: ComponentFixture<KiosqueroReportesPage>;
  let servicioHomeKiosquero: jasmine.SpyObj<HomeKiosqueroService>;
  let servicioRealtime: jasmine.SpyObj<InventarioRealtimeService>;
  let servicioPerfil: jasmine.SpyObj<PerfilService>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;
  let router: Router;

  beforeEach(async () => {
    servicioHomeKiosquero = jasmine.createSpyObj('HomeKiosqueroService', [
      'getPanel',
      'getPanelByRange',
      'getNombreKiosquero',
    ]);
    servicioHomeKiosquero.getNombreKiosquero.and.returnValue('Carlos');
    servicioHomeKiosquero.getPanel.and.returnValue(of(PanelKiosqueroMother.crear()));
    servicioHomeKiosquero.getPanelByRange.and.returnValue(of(PanelKiosqueroMother.crear()));

    servicioRealtime = jasmine.createSpyObj('InventarioRealtimeService', ['connect', 'recordRefetch']);
    servicioRealtime.connect.and.returnValue(new AbortController());

    servicioPerfil = jasmine.createSpyObj('PerfilService', ['getPerfil', 'obtenerBuffetId']);
    servicioPerfil.getPerfil.and.returnValue(
      PerfilMother.crear({
        nombre: 'Carlos',
        apellido: 'Kiosquero',
        rol: 'VENDEDOR',
        buffetId: BUFFET_ID_TEST,
      }),
    );
    servicioPerfil.obtenerBuffetId.and.returnValue(BUFFET_ID_TEST);

    servicioUsuario = jasmine.createSpyObj('UsuarioService', ['setHomeUrl', 'setNombreNavbar']);

    await TestBed.configureTestingModule({
      imports: [KiosqueroReportesPage],
      providers: [
        { provide: HomeKiosqueroService, useValue: servicioHomeKiosquero },
        { provide: InventarioRealtimeService, useValue: servicioRealtime },
        { provide: PerfilService, useValue: servicioPerfil },
        { provide: UsuarioService, useValue: servicioUsuario },
        provideRouter([]),
      ],
    })
      .overrideComponent(KiosqueroReportesPage, {
        remove: { imports: [NavbarComponent] },
        add: { imports: [NavbarStub] },
      })
      .compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');

    fixture = TestBed.createComponent(KiosqueroReportesPage);
  });

  it('dado el buffet en el perfil, cuando se monta la page de reportes, deberia setear /kiosquero como home y pedir panel por rango', () => {
    whenMonto();

    expect(servicioUsuario.setHomeUrl).toHaveBeenCalledWith('/kiosquero');
    expect(servicioHomeKiosquero.getPanelByRange).toHaveBeenCalledWith(
      BUFFET_ID_TEST,
      jasmine.any(Object),
    );
  });

  it('dado el panel cargado, deberia poblar el navbar con el nombre del kiosquero derivado del perfil', () => {
    whenMonto();

    const navbar = fixture.debugElement.query((d) => d.componentInstance instanceof NavbarStub)
      ?.componentInstance as NavbarStub;
    expect(navbar.userName).toContain('Carlos');
  });

  it('dado un click en volver, deberia navegar a /kiosquero', () => {
    whenMonto();

    (queryUno('.kr__back') as HTMLButtonElement).click();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/kiosquero');
  });

  it('dado el src ya es el fallback, cuando disparo onImagenError, no deberia reasignarlo', () => {
    whenMonto();
    const componente = fixture.componentInstance;
    const img = document.createElement('img');
    img.src = componente['IMAGEN_FALLBACK'];

    componente.onImagenError({ target: img } as unknown as Event);

    expect(img.src).toBe(componente['IMAGEN_FALLBACK']);
  });

  it('dado un src distinto, cuando disparo onImagenError, deberia reasignarlo al fallback', () => {
    whenMonto();
    const componente = fixture.componentInstance;
    const img = document.createElement('img');
    img.src = 'https://algo/roto.png';

    componente.onImagenError({ target: img } as unknown as Event);

    expect(img.src).toBe(componente['IMAGEN_FALLBACK']);
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }

  function queryUno(selector: string): Element | null {
    return (fixture.nativeElement as HTMLElement).querySelector(selector);
  }
});
