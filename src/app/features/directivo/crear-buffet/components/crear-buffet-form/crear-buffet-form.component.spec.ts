import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CrearBuffetRequest } from '../../../models/directivo.model';
import { CrearBuffetFormComponent } from './crear-buffet-form.component';

describe('CrearBuffetFormComponent', () => {
  let component: CrearBuffetFormComponent;
  let fixture: ComponentFixture<CrearBuffetFormComponent>;

  const payloadValido: CrearBuffetRequest = {
    name: 'Kiosco Central',
    habilitationExpirationDate: '2030-01-01',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearBuffetFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CrearBuffetFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('onSubmit', () => {
    it('dado el form valido y sin loading, cuando submiteo, deberia emitir submitForm con el payload mapeado', () => {
      const emitSpy = spyOn(component.submitForm, 'emit');
      component.form.setValue({
        buffetName: payloadValido.name,
        expirationDate: payloadValido.habilitationExpirationDate,
      });

      component.onSubmit();

      expect(emitSpy).toHaveBeenCalledWith(payloadValido);
    });

    it('dado el form invalido, cuando submiteo, no deberia emitir y deberia marcar los campos como touched', () => {
      const emitSpy = spyOn(component.submitForm, 'emit');

      component.onSubmit();

      expect(emitSpy).not.toHaveBeenCalled();
      expect(component.form.touched).toBeTrue();
    });

    it('dado el form valido pero loading, cuando submiteo, no deberia emitir', () => {
      const emitSpy = spyOn(component.submitForm, 'emit');
      component.form.setValue({
        buffetName: payloadValido.name,
        expirationDate: payloadValido.habilitationExpirationDate,
      });
      component.loading = true;

      component.onSubmit();

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });
});
