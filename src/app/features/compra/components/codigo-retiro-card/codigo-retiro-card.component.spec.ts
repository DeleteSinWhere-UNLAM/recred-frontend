import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlumnoMother } from '../../../../data-access/services/alumno.mother';
import { CodigoRetiroCardComponent } from './codigo-retiro-card.component';

describe('CodigoRetiroCardComponent', () => {
  let component: CodigoRetiroCardComponent;
  let fixture: ComponentFixture<CodigoRetiroCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodigoRetiroCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CodigoRetiroCardComponent);
    component = fixture.componentInstance;
  });

  describe('render', () => {
    it('dado un alumno con foto, cuando renderizo, deberia mostrar la img', () => {
      component.alumno = AlumnoMother.crear({
        nombre: 'Julián',
        apellido: 'García',
        urlFotoPerfil: 'foto.jpg',
      });
      component.codigo = 'ABC123';
      component.fecha = '2026-07-15';

      whenMonto();

      expect(imagen()).not.toBeNull();
      expect(iniciales()).toBeNull();
    });

    it('dado un alumno sin foto, cuando renderizo, deberia mostrar las iniciales', () => {
      component.alumno = AlumnoMother.crear({
        nombre: 'Julián',
        apellido: 'García',
        urlFotoPerfil: null,
      });
      component.codigo = 'ABC123';
      component.fecha = '2026-07-15';

      whenMonto();

      expect(iniciales()?.textContent).toBe('JG');
      expect(imagen()).toBeNull();
    });

    it('dado un codigo y un recreo, cuando renderizo, deberia mostrar el codigo y el label del recreo', () => {
      component.alumno = AlumnoMother.crear();
      component.codigo = 'XYZ789';
      component.fecha = '2026-07-15';
      component.recreo = 'SEGUNDO_RECREO';

      whenMonto();

      const html = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(html).toContain('XYZ789');
      expect(html).toContain('2do Recreo');
    });
  });

  describe('fechaFormateada', () => {
    beforeEach(() => {
      component.alumno = AlumnoMother.crear();
      component.codigo = 'ABC';
    });

    it('dado una fecha yyyy-mm-dd, cuando la formateo, deberia devolver dd-mm-yyyy', () => {
      component.fecha = '2026-07-15';

      whenMonto();

      expect(component.fechaFormateada()).toBe('15-07-2026');
    });

    it('dado una fecha con T (ISO), cuando la formateo, deberia tomar solo la parte de la fecha', () => {
      component.fecha = '2026-07-15T10:30:00Z';

      whenMonto();

      expect(component.fechaFormateada()).toBe('15-07-2026');
    });

    it('dado una fecha vacia, cuando la formateo, deberia devolver ""', () => {
      component.fecha = '';

      whenMonto();

      expect(component.fechaFormateada()).toBe('');
    });

    it('dado una fecha con formato invalido (sin guiones), deberia devolverla tal cual', () => {
      component.fecha = 'sin-formato-valido-nope';

      whenMonto();

      expect(component.fechaFormateada()).toBe('sin-formato-valido-nope');
    });
  });

  describe('helpers cuando el alumno no esta seteado', () => {
    it('dado sin alumno cargado, iniciales y nombreCompleto deberian ser strings vacios', () => {
      component.codigo = 'X';

      expect(component.iniciales()).toBe('');
      expect(component.nombreCompleto()).toBe('');
    });
  });

  describe('iniciales con datos parciales', () => {
    it('dado un alumno con nombre "" y apellido "Perez", iniciales deberia ser "P"', () => {
      component.alumno = AlumnoMother.crear({ nombre: '', apellido: 'Perez' });

      expect(component.iniciales()).toBe('P');
    });

    it('dado un alumno con nombre "Juan" y apellido "", iniciales deberia ser "J"', () => {
      component.alumno = AlumnoMother.crear({ nombre: 'Juan', apellido: '' });

      expect(component.iniciales()).toBe('J');
    });
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }

  function imagen(): HTMLImageElement | null {
    return (fixture.nativeElement as HTMLElement).querySelector('img.codigo-retiro__avatar-img');
  }

  function iniciales(): HTMLElement | null {
    return (fixture.nativeElement as HTMLElement).querySelector('.codigo-retiro__avatar span');
  }
});
