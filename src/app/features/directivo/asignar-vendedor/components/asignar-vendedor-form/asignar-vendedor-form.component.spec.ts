import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CrearVendedorRequest } from '../../../models/directivo.model';
import { AsignarVendedorFormComponent } from './asignar-vendedor-form.component';

class CrearVendedorRequestMother {
  static crearValido(): CrearVendedorRequest {
    return {
      username: 'juanperez',
      email: 'juan@example.com',
      firstName: 'Juan',
      lastName: 'Perez',
      dni: '30000000',
      phone: '011-1234',
      cuit: '20300000009',
    };
  }
}

describe('AsignarVendedorFormComponent', () => {
  let component: AsignarVendedorFormComponent;
  let fixture: ComponentFixture<AsignarVendedorFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsignarVendedorFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AsignarVendedorFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('onSubmit', () => {
    it('dado el form valido y sin loading, cuando submiteo, deberia emitir submitForm con el payload', () => {
      const emitSpy = spyOn(component.submitForm, 'emit');
      component.form.setValue(CrearVendedorRequestMother.crearValido());

      component.onSubmit();

      expect(emitSpy).toHaveBeenCalledWith(CrearVendedorRequestMother.crearValido());
    });

    it('dado el form invalido, cuando submiteo, no deberia emitir y deberia marcar los campos como touched', () => {
      const emitSpy = spyOn(component.submitForm, 'emit');

      component.onSubmit();

      expect(emitSpy).not.toHaveBeenCalled();
      expect(component.form.touched).toBeTrue();
    });

    it('dado el form valido pero loading, cuando submiteo, no deberia emitir', () => {
      const emitSpy = spyOn(component.submitForm, 'emit');
      component.form.setValue(CrearVendedorRequestMother.crearValido());
      component.loading = true;

      component.onSubmit();

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });
});
