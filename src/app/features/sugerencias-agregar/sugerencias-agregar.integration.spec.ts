import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { Component, Input } from '@angular/core';
import { of, throwError } from 'rxjs';
import { SugerenciasAgregarPage } from './sugerencias-agregar.page';
import { SugerenciasAgregarService } from './services/sugerencias-agregar.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { SugerenciasAgregarMother } from './sugerencias-agregar.mother';


@Component({
  selector: 'app-navbar',
  template: '',
  standalone: true
})
class NavbarStub {
  @Input() userName = '';
}

describe('SugerenciasAgregar Integration', () => {
  let fixture: ComponentFixture<SugerenciasAgregarPage>;
  let router: jasmine.SpyObj<Router>;
  let servicioSugerencias: jasmine.SpyObj<SugerenciasAgregarService>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;

  beforeEach(async () => {
    router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    servicioSugerencias = jasmine.createSpyObj('SugerenciasAgregarService', ['getSugerenciasAgregarProducto']);
    servicioUsuario = jasmine.createSpyObj('UsuarioService', ['getUsuarioActual', 'setHomeUrl']);

    servicioUsuario.getUsuarioActual.and.returnValue(SugerenciasAgregarMother.crearUsuario({ rol: 'KIOSQUERO' } as unknown as Parameters<typeof SugerenciasAgregarMother.crearUsuario>[0]));
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(SugerenciasAgregarMother.crearUsuario({ rol: 'KIOSQUERO' } as unknown as Parameters<typeof SugerenciasAgregarMother.crearUsuario>[0])));

    await TestBed.configureTestingModule({
      imports: [SugerenciasAgregarPage],
      providers: [
        { provide: Router, useValue: router },
        { provide: UsuarioService, useValue: servicioUsuario },
        { provide: SugerenciasAgregarService, useValue: servicioSugerencias }
      ]
    })
      .overrideComponent(SugerenciasAgregarPage, {
        remove: {
          imports: [NavbarComponent]
        },
        add: {
          imports: [NavbarStub]
        }
      })
      .compileComponents();
  });

  it('debería renderizar la lista de oportunidades de stock calculadas por el presenter', () => {
    const sugerencias = SugerenciasAgregarMother.crearListaSugerencias();
    servicioSugerencias.getSugerenciasAgregarProducto.and.returnValue(of(sugerencias));
    fixture = TestBed.createComponent(SugerenciasAgregarPage);
    
    fixture.detectChanges();

    const titulo = fixture.nativeElement.querySelector('h1').textContent;
    const tarjetas = fixture.debugElement.queryAll(By.css('.sa__product-card'));
    const tituloPrimeraTarjeta = tarjetas[0].query(By.css('.sa__card-title strong')).nativeElement.textContent;
    const totalIngresos = fixture.nativeElement.querySelector('.sa__metric--warning strong').textContent;
    expect(titulo).toContain('Oportunidades de Stock');
    expect(tarjetas.length).toBe(3);
    expect(tituloPrimeraTarjeta).toContain('Prod C');
    expect(totalIngresos).toContain('$4.000');
  });

  it('debería visualizar el componente de error cuando el presenter falla al cargar', () => {
    servicioSugerencias.getSugerenciasAgregarProducto.and.returnValue(throwError(() => new Error('API Error')));
    fixture = TestBed.createComponent(SugerenciasAgregarPage);
    
    fixture.detectChanges();

    const panelError = fixture.nativeElement.querySelector('.sa__notice--error');
    expect(panelError).toBeTruthy();
    expect(panelError.textContent).toContain('No se pudieron cargar las oportunidades de stock.');
  });
  
  it('debería mostrar el empty state cuando el presenter no detecta sugerencias', () => {
    servicioSugerencias.getSugerenciasAgregarProducto.and.returnValue(of([]));
    fixture = TestBed.createComponent(SugerenciasAgregarPage);
    
    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector('.sa__empty-state');
    expect(emptyState).toBeTruthy();
    expect(emptyState.textContent).toContain('Sin oportunidades por ahora');
  });
});
