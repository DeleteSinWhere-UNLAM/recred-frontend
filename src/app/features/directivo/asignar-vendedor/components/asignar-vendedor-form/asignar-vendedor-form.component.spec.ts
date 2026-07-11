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
  let emitSubmitFormSpy: jasmine.Spy;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsignarVendedorFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AsignarVendedorFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    emitSubmitFormSpy = spyOn(component.submitForm, 'emit');
  });

  describe('onSubmit', () => {
    it('dado el form valido y sin loading, cuando submiteo, deberia emitir submitForm con el payload', () => {
      givenFormConPayload(CrearVendedorRequestMother.crearValido());

      whenSubmito();

      thenSeEmitioSubmitFormCon(CrearVendedorRequestMother.crearValido());
    });

    it('dado el form invalido, cuando submiteo, no deberia emitir y deberia marcar los campos como touched', () => {
      whenSubmito();

      thenNoSeEmitio();
      thenElFormEstaTouched();
    });

    it('dado un CUIT con menos de 11 digitos, cuando submiteo, no deberia emitir', () => {
      givenFormConPayload({ ...CrearVendedorRequestMother.crearValido(), cuit: '2012345678' });

      whenSubmito();

      thenNoSeEmitio();
      thenElCuitEsInvalido();
    });

    it('dado el form valido pero loading, cuando submiteo, no deberia emitir', () => {
      givenFormConPayload(CrearVendedorRequestMother.crearValido());
      givenLoading();

      whenSubmito();

      thenNoSeEmitio();
    });
  });

  describe('normalizarCuit', () => {
    it('dado un CUIT pegado con guiones y caracteres extra, cuando lo normalizo, deberia dejar solo 11 digitos', () => {
      const input = givenInputCon('20-12345678-6abc999');

      whenNormalizoElCuit(input);

      thenElInputEs(input, '20123456786');
      thenElCuitDelFormEs('20123456786');
    });
  });

  function givenFormConPayload(payload: CrearVendedorRequest): void {
    component.form.setValue(payload);
  }

  function givenLoading(): void {
    component.loading = true;
  }

  function givenInputCon(valor: string): HTMLInputElement {
    const input = document.createElement('input');
    input.value = valor;
    return input;
  }

  function whenSubmito(): void {
    component.onSubmit();
  }

  function whenNormalizoElCuit(input: HTMLInputElement): void {
    component.normalizarCuit({ target: input } as unknown as Event);
  }

  function thenSeEmitioSubmitFormCon(payload: CrearVendedorRequest): void {
    expect(emitSubmitFormSpy).toHaveBeenCalledWith(payload);
  }

  function thenNoSeEmitio(): void {
    expect(emitSubmitFormSpy).not.toHaveBeenCalled();
  }

  function thenElFormEstaTouched(): void {
    expect(component.form.touched).toBeTrue();
  }

  function thenElCuitEsInvalido(): void {
    expect(component.form.controls.cuit.invalid).toBeTrue();
  }

  function thenElInputEs(input: HTMLInputElement, valor: string): void {
    expect(input.value).toBe(valor);
  }

  function thenElCuitDelFormEs(valor: string): void {
    expect(component.form.controls.cuit.value).toBe(valor);
  }
});
