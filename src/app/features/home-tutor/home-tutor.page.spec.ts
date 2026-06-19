import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HomeTutorPage } from './home-tutor.page';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { PerfilService } from '../../data-access/services/perfil.service';
import { ColegiosService } from '../../data-access/services/colegios.service';
import { AlumnosService } from '../../data-access/services/alumnos.service';
import { signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

describe('HomeTutorPage', () => {
  let component: HomeTutorPage;
  let fixture: ComponentFixture<HomeTutorPage>;
  let usuarioServiceSpy: jasmine.SpyObj<UsuarioService>;
  let perfilServiceSpy: jasmine.SpyObj<PerfilService>;
  let colegiosServiceSpy: jasmine.SpyObj<ColegiosService>;
  let alumnosServiceSpy: jasmine.SpyObj<AlumnosService>;

  beforeEach(async () => {
    usuarioServiceSpy = jasmine.createSpyObj('UsuarioService', ['setHomeUrl', 'setNombreNavbar', 'getUsuarioActual']);
    perfilServiceSpy = jasmine.createSpyObj('PerfilService', ['perfil']);
    colegiosServiceSpy = jasmine.createSpyObj('ColegiosService', ['getColegios']);
    alumnosServiceSpy = jasmine.createSpyObj('AlumnosService', ['asegurarCargados'], { alumnos: signal([]) });

    usuarioServiceSpy.getUsuarioActual.and.returnValue({ nombre: 'JuanUser' } as any);

    await TestBed.configureTestingModule({
      imports: [HomeTutorPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: UsuarioService, useValue: usuarioServiceSpy },
        { provide: PerfilService, useValue: perfilServiceSpy },
        { provide: ColegiosService, useValue: colegiosServiceSpy },
        { provide: AlumnosService, useValue: alumnosServiceSpy },
        { provide: ActivatedRoute, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeTutorPage);
  });

  it('should initialize successfully', () => {
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(usuarioServiceSpy.setHomeUrl).toHaveBeenCalledWith('/tutor');
    expect(usuarioServiceSpy.setNombreNavbar).toHaveBeenCalled();
    expect(alumnosServiceSpy.asegurarCargados).toHaveBeenCalledWith(true);
  });

  describe('computed properties with profile', () => {
    beforeEach(() => {
      perfilServiceSpy.perfil.and.returnValue({ nombre: 'Ana', apellido: 'Perez', urlFotoPerfil: 'img.jpg' } as any);
      component = fixture.componentInstance;
    });

    it('should compute full name, initials, and photo url', () => {
      expect(component.nombreUsuario()).toBe('Ana');
      expect(component.nombreCompletoTutor()).toBe('Ana Perez');
      expect(component.inicialesTutor()).toBe('AP');
      expect(component.urlFotoPerfilTutor()).toBe('img.jpg');
    });
  });

  describe('computed properties without profile', () => {
    beforeEach(() => {
      perfilServiceSpy.perfil.and.returnValue(null);
      component = fixture.componentInstance;
    });

    it('should fallback to user actual', () => {
      expect(component.nombreUsuario()).toBe('JuanUser');
      expect(component.nombreCompletoTutor()).toBe('JuanUser');
      expect(component.inicialesTutor()).toBe('J');
      expect(component.urlFotoPerfilTutor()).toBeNull();
    });
  });

  describe('grouping and balances', () => {
    beforeEach(() => {
      colegiosServiceSpy.getColegios.and.returnValue([{ id: 'c1', nombre: 'Colegio 1' } as any]);
      alumnosServiceSpy = TestBed.inject(AlumnosService) as jasmine.SpyObj<AlumnosService>;
      Object.defineProperty(alumnosServiceSpy, 'alumnos', { value: signal([
        { id: 'a1', colegioId: 'c1', saldo: 100 },
        { id: 'a2', colegioId: 'c2', saldo: -50 },
        { id: 'a3', colegioId: null, saldo: 0 }
      ])});
      component = fixture.componentInstance;
    });

    it('should group alumnos by colegio and calculate totals', () => {
      const grupos = component.grupos();
      expect(grupos.length).toBe(3);
      expect(grupos.find(g => g.colegio.id === 'c1')?.colegio.nombre).toBe('Colegio 1');
      expect(grupos.find(g => g.colegio.id === 'c2')?.colegio.nombre).toBe('Mi colegio');
      expect(grupos.find(g => g.colegio.id === 'sin-colegio')?.colegio.nombre).toBe('Mi colegio');

      expect(component.cantidadHijos()).toBe(3);
      expect(component.cantidadColegios()).toBe(3);
      expect(component.saldoTotal()).toBe(50);
      expect(component.saldoTotalNegativo()).toBeFalse();
      expect(component.saldoTotalFormateado()).toContain('50');
    });

    it('should calculate negative total balance correctly', () => {
      Object.defineProperty(alumnosServiceSpy, 'alumnos', { value: signal([
        { id: 'a1', colegioId: 'c1', saldo: -100 }
      ])});
      expect(component.saldoTotalNegativo()).toBeTrue();
    });
  });
});
