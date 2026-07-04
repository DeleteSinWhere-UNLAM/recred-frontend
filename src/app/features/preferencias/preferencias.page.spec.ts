import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PreferenciasPage } from './preferencias.page';
import { PreferenciasService } from './services/preferencias.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { AlumnoContextoService } from '../../core/services/alumno-contexto.service';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';

describe('PreferenciasPage', () => {
  let component: PreferenciasPage;
  let fixture: ComponentFixture<PreferenciasPage>;
  let preferenciasServiceSpy: jasmine.SpyObj<PreferenciasService>;
  let usuarioServiceSpy: jasmine.SpyObj<UsuarioService>;
  let contextoServiceSpy: jasmine.SpyObj<AlumnoContextoService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let alumnoIdSignal: any;

  beforeEach(async () => {
    preferenciasServiceSpy = jasmine.createSpyObj('PreferenciasService', ['getPreferencias']);
    usuarioServiceSpy = jasmine.createSpyObj('UsuarioService', ['getUsuarioActual', 'setHomeUrl']);
    alumnoIdSignal = signal('alumno-1');
    contextoServiceSpy = jasmine.createSpyObj('AlumnoContextoService', [], { alumnoId: alumnoIdSignal });
    routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);

    usuarioServiceSpy.getUsuarioActual.and.returnValue({ nombre: 'Tutor Test', rol: 'TUTOR', email: '' } as any);
    preferenciasServiceSpy.getPreferencias.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [PreferenciasPage],
      providers: [
        { provide: PreferenciasService, useValue: preferenciasServiceSpy },
        { provide: UsuarioService, useValue: usuarioServiceSpy },
        { provide: AlumnoContextoService, useValue: contextoServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();
  });

  it('debería cargar preferencias al iniciar y mostrar el nombre', () => {
    const mockPrefs = [{ titulo: 'P1', mensaje: 'M1', productoId: '1', razonIA: 'R1' }];
    
    givenPreferencias(mockPrefs);
    whenCreoComponente();
    thenSeCarganPreferenciasYSeteaNombre(mockPrefs, 'Tutor Test');
  });

  it('debería navegar a tutor al llamar volver', () => {
    const mockPrefs: any[] = [];
    
    givenPreferencias(mockPrefs);
    whenCreoComponente();
    whenLlamoVolver();
    thenNavegaATutor();
  });

  function givenPreferencias(prefs: any[]): void {
    preferenciasServiceSpy.getPreferencias.and.returnValue(of(prefs));
  }

  function whenCreoComponente(): void {
    fixture = TestBed.createComponent(PreferenciasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function whenLlamoVolver(): void {
    component.volver();
  }

  function thenSeCarganPreferenciasYSeteaNombre(prefs: any[], nombre: string): void {
    expect(preferenciasServiceSpy.getPreferencias).toHaveBeenCalledWith('alumno-1');
    expect(component.preferencias).toEqual(prefs);
    expect(component.nombreUsuario).toBe(nombre);
    expect(usuarioServiceSpy.setHomeUrl).toHaveBeenCalledWith('/tutor');
  }

  function thenNavegaATutor(): void {
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/tutor');
  }
});
