import { Component, Input, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AlumnoContextoService } from '../../core/services/alumno-contexto.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { PreferenciaCardComponent } from './components/preferencia-card/preferencia-card.component';
import { Preferencia } from './models/preferencia.model';
import { ALUMNO_ID_TEST, PreferenciaMother } from './preferencias.mother';
import { PreferenciasPage } from './preferencias.page';
import { PreferenciasService } from './services/preferencias.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

@Component({ selector: 'app-preferencia-card', template: '', standalone: true })
class PreferenciaCardStub {
  @Input() preferencia!: Preferencia;
  @Input() alumnoId!: string;
}

describe('PreferenciasPage', () => {
  let component: PreferenciasPage;
  let fixture: ComponentFixture<PreferenciasPage>;
  let servicioPreferencias: jasmine.SpyObj<PreferenciasService>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;
  let alumnoIdSignal: WritableSignal<string>;
  let router: Router;

  beforeEach(async () => {
    servicioPreferencias = jasmine.createSpyObj('PreferenciasService', ['getPreferencias']);
    servicioPreferencias.getPreferencias.and.returnValue(of([PreferenciaMother.crear()]));

    servicioUsuario = jasmine.createSpyObj('UsuarioService', ['getUsuarioActual', 'setHomeUrl']);
    servicioUsuario.getUsuarioActual.and.returnValue({
      nombre: 'Tutor Test',
    } as ReturnType<UsuarioService['getUsuarioActual']>);

    alumnoIdSignal = signal<string>(ALUMNO_ID_TEST);

    await TestBed.configureTestingModule({
      imports: [PreferenciasPage],
      providers: [
        { provide: PreferenciasService, useValue: servicioPreferencias },
        { provide: UsuarioService, useValue: servicioUsuario },
        {
          provide: AlumnoContextoService,
          useValue: { alumnoId: alumnoIdSignal.asReadonly() },
        },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    })
      .overrideComponent(PreferenciasPage, {
        remove: { imports: [PreferenciaCardComponent] },
        add: { imports: [PreferenciaCardStub] },
      })
      .compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');

    fixture = TestBed.createComponent(PreferenciasPage);
    component = fixture.componentInstance;
  });

  describe('inicializacion', () => {
    it('dado el componente al construirse, deberia setear /tutor como home', () => {
      expect(servicioUsuario.setHomeUrl).toHaveBeenCalledWith('/tutor');
    });

    it('dado un alumnoId en el contexto, cuando se monta, deberia pedir preferencias con ese id', () => {
      whenMonto();

      expect(servicioPreferencias.getPreferencias).toHaveBeenCalledWith(ALUMNO_ID_TEST);
      expect(component.preferencias.length).toBe(1);
    });

    it('dado sin alumnoId en el contexto, cuando se monta, deberia pedir preferencias con undefined (delega al service)', () => {
      alumnoIdSignal.set('');
      const nuevaFixture = TestBed.createComponent(PreferenciasPage);

      nuevaFixture.detectChanges();

      expect(servicioPreferencias.getPreferencias).toHaveBeenCalledWith(undefined);
    });

    it('dado que cambia el alumnoId del contexto, deberia pedir preferencias con el nuevo id', () => {
      whenMonto();
      servicioPreferencias.getPreferencias.calls.reset();

      alumnoIdSignal.set('alumno-2');
      fixture.detectChanges();

      expect(servicioPreferencias.getPreferencias).toHaveBeenCalledWith('alumno-2');
    });
  });

  describe('render', () => {
    it('dado preferencias del service, cuando se monta, deberia renderizar el titulo y una card por preferencia', () => {
      servicioPreferencias.getPreferencias.and.returnValue(
        of([PreferenciaMother.crear(), PreferenciaMother.crearJugo()]),
      );
      const nuevaFixture = TestBed.createComponent(PreferenciasPage);
      nuevaFixture.detectChanges();

      const texto = (nuevaFixture.nativeElement as HTMLElement).textContent ?? '';
      expect(texto).toContain('Preferencias de consumo');
      const cards = (nuevaFixture.nativeElement as HTMLElement).querySelectorAll(
        'app-preferencia-card',
      );
      expect(cards.length).toBe(2);
    });

    it('dado lista vacia, cuando se monta, deberia mostrar el mensaje "Todavia no hay sugerencias"', () => {
      servicioPreferencias.getPreferencias.and.returnValue(of([]));
      const nuevaFixture = TestBed.createComponent(PreferenciasPage);
      nuevaFixture.detectChanges();

      const texto = (nuevaFixture.nativeElement as HTMLElement).textContent ?? '';
      expect(texto).toContain('Todavía no hay sugerencias');
    });
  });

  describe('volver', () => {
    it('dado el componente montado, cuando llamo volver, deberia navegar a /tutor', () => {
      whenMonto();

      component.volver();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/tutor');
    });
  });

  describe('nombreUsuario', () => {
    it('dado un usuario en UsuarioService, nombreUsuario deberia exponerse en la instancia', () => {
      expect(component.nombreUsuario).toBe('Tutor Test');
    });
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }
});
