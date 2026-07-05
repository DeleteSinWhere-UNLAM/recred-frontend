import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AlumnoContextoService } from '../../core/services/alumno-contexto.service';
import { AlumnoMother } from '../../data-access/services/alumno.mother';
import { AlumnosService } from '../../data-access/services/alumnos.service';
import { BuffetService } from '../buffet/services/buffet.service';
import { Producto } from '../buffet/models/producto.model';
import { FavoritosService } from '../favoritos/services/favoritos.service';
import { FavoritosAlumnoPage } from './favoritos-alumno.page';

const ALUMNO_ID = 'alumno-1';
const BUFFET_ID = 'buffet-1';

class ProductoMother {
  static crear(override: Partial<Producto> = {}): Producto {
    return {
      id: 'prod-1',
      nombre: 'Alfajor',
      precio: 500,
      imagen: 'https://cdn/alfajor.png',
      ...override,
    } as Producto;
  }
}

describe('FavoritosAlumnoPage', () => {
  let component: FavoritosAlumnoPage;
  let fixture: ComponentFixture<FavoritosAlumnoPage>;
  let favoritosService: jasmine.SpyObj<FavoritosService>;
  let buffetService: jasmine.SpyObj<BuffetService>;
  let alumnosService: jasmine.SpyObj<AlumnosService>;
  let router: jasmine.SpyObj<Router>;
  let alumnoIdSignal: ReturnType<typeof signal<string>>;
  let alumnosSignal: ReturnType<typeof signal<ReturnType<typeof AlumnoMother.crear>[]>>;

  beforeEach(async () => {
    alumnoIdSignal = signal(ALUMNO_ID);
    alumnosSignal = signal([AlumnoMother.crear({ id: ALUMNO_ID, nombre: 'Juan Perez' })]);

    favoritosService = jasmine.createSpyObj<FavoritosService>('FavoritosService', ['getFavoritos']);
    buffetService = jasmine.createSpyObj<BuffetService>('BuffetService', [
      'obtenerBuffetDelAlumno',
      'getProductosDelBuffet',
    ]);
    alumnosService = jasmine.createSpyObj<AlumnosService>('AlumnosService', [], {
      alumnos: alumnosSignal.asReadonly(),
    });
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    favoritosService.getFavoritos.and.returnValue(of([]));
    buffetService.obtenerBuffetDelAlumno.and.returnValue(of({ id: BUFFET_ID }) as never);
    buffetService.getProductosDelBuffet.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [FavoritosAlumnoPage],
      providers: [
        { provide: FavoritosService, useValue: favoritosService },
        { provide: BuffetService, useValue: buffetService },
        { provide: AlumnoContextoService, useValue: { alumnoId: alumnoIdSignal.asReadonly() } },
        { provide: AlumnosService, useValue: alumnosService },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FavoritosAlumnoPage);
    component = fixture.componentInstance;
  });

  describe('effect de contexto', () => {
    it('dado sin alumnoId en el contexto, cuando se dispara el effect, deberia navegar a /tutor', () => {
      givenAlumnoIdEnContexto('');

      fixture.detectChanges();

      expect(router.navigate).toHaveBeenCalledWith(['/tutor']);
    });

    it('dado un alumnoId valido, cuando se dispara el effect, deberia setear el alumno y pedir favoritos', () => {
      fixture.detectChanges();

      expect(component.alumno()?.id).toBe(ALUMNO_ID);
      expect(favoritosService.getFavoritos).toHaveBeenCalledWith(ALUMNO_ID);
    });

    it('dado favoritos con imagen y buffet con imagen distinta, cuando se cargan, deberia priorizar la del buffet', () => {
      const favoritoOriginal = ProductoMother.crear({ imagen: 'https://vieja/alfajor.png' });
      const enBuffet = ProductoMother.crear({ imagen: 'https://nueva/alfajor.png' });
      favoritosService.getFavoritos.and.returnValue(of([favoritoOriginal]));
      buffetService.getProductosDelBuffet.and.returnValue(of([enBuffet]));

      fixture.detectChanges();

      expect(component.favoritos()[0].imagen).toBe('https://nueva/alfajor.png');
      expect(component.cargando()).toBeFalse();
    });

    it('dado que el service de favoritos falla, cuando se dispara el effect, deberia quedar con lista vacia', () => {
      favoritosService.getFavoritos.and.returnValue(throwError(() => new Error('boom')));

      fixture.detectChanges();

      expect(component.favoritos()).toEqual([]);
      expect(component.cargando()).toBeFalse();
    });
  });

  describe('nombreAlumno', () => {
    it('dado un alumno con nombre "Juan Perez", cuando pido nombreAlumno, deberia devolver solo "Juan"', () => {
      fixture.detectChanges();

      expect(component.nombreAlumno).toBe('Juan');
    });

    it('dado sin alumno, cuando pido nombreAlumno, deberia devolver "alumno"', () => {
      component.alumno.set(null);

      expect(component.nombreAlumno).toBe('alumno');
    });
  });

  describe('volver', () => {
    it('dado la page, cuando llamo volver, deberia navegar a /tutor', () => {
      component.volver();

      expect(router.navigate).toHaveBeenCalledWith(['/tutor']);
    });
  });

  describe('formatARS', () => {
    it('dado un precio 1500, cuando formateo, deberia devolver el string con $ y 1.500', () => {
      const formateado = component.formatARS(1500);

      expect(formateado).toContain('$');
      expect(formateado).toContain('1.500');
    });
  });

  describe('onImagenError', () => {
    it('dado una imagen que falla y src distinto al fallback, cuando se dispara error, deberia asignar el fallback', () => {
      const img = document.createElement('img');
      img.src = 'https://original/foto.png';

      component.onImagenError({ target: img } as unknown as Event);

      expect(img.src).toContain('logo_sin_fondo_ikciro');
    });

    it('dado una imagen que ya es el fallback, cuando se dispara error, no deberia reasignar el src (evita loop)', () => {
      const img = document.createElement('img');
      img.src = component.IMAGEN_FALLBACK;
      const previo = img.src;

      component.onImagenError({ target: img } as unknown as Event);

      expect(img.src).toBe(previo);
    });
  });

  function givenAlumnoIdEnContexto(alumnoId: string): void {
    alumnoIdSignal.set(alumnoId);
  }
});
