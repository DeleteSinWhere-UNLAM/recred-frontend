import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlumnoMother } from '../../../../data-access/services/alumno.mother';
import { ColegioMother } from '../../home-tutor.mother';
import { AlumnoCardComponent } from '../alumno-card/alumno-card.component';
import { ColegioSectionComponent } from './colegio-section.component';

@Component({ selector: 'app-alumno-card', template: '', standalone: true })
class AlumnoCardStub {
  @Input() alumno: unknown;
}

describe('ColegioSectionComponent', () => {
  let component: ColegioSectionComponent;
  let fixture: ComponentFixture<ColegioSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColegioSectionComponent],
    })
      .overrideComponent(ColegioSectionComponent, {
        remove: { imports: [AlumnoCardComponent] },
        add: { imports: [AlumnoCardStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ColegioSectionComponent);
    component = fixture.componentInstance;
    component.colegio = ColegioMother.crear();
    component.alumnos = [
      AlumnoMother.crear({ id: 'a-1', saldo: 1500 }),
      AlumnoMother.crear({ id: 'a-2', saldo: 2500 }),
    ];
  });

  describe('Estado inicial', () => {
    it('dado la seccion recien creada, deberia arrancar expandida', () => {
      expect(component.expandido()).toBeTrue();
    });
  });

  describe('render', () => {
    it('dado el colegio y alumnos, cuando renderizo, deberia mostrar el nombre y contar hijos', () => {
      whenMonto();

      const texto = textoRenderizado();
      expect(texto).toContain('Instituto San José');
      expect(texto).toContain('2 hijos');
    });

    it('dado un solo alumno, deberia decir "1 hijo" en singular', () => {
      component.alumnos = [AlumnoMother.crear({ id: 'unico' })];

      whenMonto();

      expect(textoRenderizado()).toContain('1 hijo');
    });

    it('dado varios alumnos, deberia renderizar una card por cada uno', () => {
      whenMonto();

      const cards = (fixture.nativeElement as HTMLElement).querySelectorAll(
        'app-alumno-card',
      );
      expect(cards.length).toBe(2);
    });
  });

  describe('toggle', () => {
    it('dado expandido en true, cuando toggleo, deberia pasar a false', () => {
      component.toggle();

      expect(component.expandido()).toBeFalse();
    });

    it('dado dos toggles, deberia volver a estar expandido', () => {
      component.toggle();
      component.toggle();

      expect(component.expandido()).toBeTrue();
    });
  });

  describe('totalSaldo', () => {
    it('dado alumnos con distintos saldos, totalSaldo deberia sumarlos', () => {
      expect(component.totalSaldo).toBe(4000);
    });

    it('dado la suma, totalSaldoFormateado deberia incluir $ y el separador de miles', () => {
      const formateado = component.totalSaldoFormateado;
      expect(formateado).toContain('$');
      expect(formateado).toContain('4.000');
    });
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }

  function textoRenderizado(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }
});
