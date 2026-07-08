import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlumnoSelector } from './alumno-selector';

describe('AlumnoSelector', () => {
  let component: AlumnoSelector;
  let fixture: ComponentFixture<AlumnoSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlumnoSelector],
    }).compileComponents();

    fixture = TestBed.createComponent(AlumnoSelector);
    component = fixture.componentInstance;
  });

  describe('inicializacion', () => {
    it('dado el componente, cuando se monta, deberia crearse', () => {
      whenMonto();

      expect(component).toBeTruthy();
    });
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }
});
