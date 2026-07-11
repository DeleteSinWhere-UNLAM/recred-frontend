import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CrearBuffetRequest } from '../../../models/directivo.model';
import { CrearBuffetFormComponent } from './crear-buffet-form.component';

interface FormValidoInputs {
  buffetName: string;
  expirationDate: string;
}

class CrearBuffetRequestMother {
  static crear(override: Partial<CrearBuffetRequest> = {}): CrearBuffetRequest {
    return {
      name: 'Kiosco Central',
      habilitationExpirationDate: '2030-01-01',
      ...override,
    };
  }

  static crearInputsDelForm(override: Partial<FormValidoInputs> = {}): FormValidoInputs {
    const payload = CrearBuffetRequestMother.crear();
    return {
      buffetName: payload.name,
      expirationDate: payload.habilitationExpirationDate,
      ...override,
    };
  }
}

describe('CrearBuffetFormComponent', () => {
  let component: CrearBuffetFormComponent;
  let fixture: ComponentFixture<CrearBuffetFormComponent>;
  let emitSubmitFormSpy: jasmine.Spy;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearBuffetFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CrearBuffetFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    emitSubmitFormSpy = spyOn(component.submitForm, 'emit');
  });

  describe('onSubmit', () => {
    it('dado el form valido y sin loading, cuando submiteo, deberia emitir submitForm con el payload mapeado', () => {
      givenFormConInputs(CrearBuffetRequestMother.crearInputsDelForm());

      whenSubmito();

      thenSeEmitioSubmitFormCon(CrearBuffetRequestMother.crear());
    });

    it('dado el form invalido, cuando submiteo, no deberia emitir y deberia marcar los campos como touched', () => {
      whenSubmito();

      thenNoSeEmitio();
      thenElFormEstaTouched();
    });

    it('dado el form valido pero loading, cuando submiteo, no deberia emitir', () => {
      givenFormConInputs(CrearBuffetRequestMother.crearInputsDelForm());
      givenLoading();

      whenSubmito();

      thenNoSeEmitio();
    });
  });

  function givenFormConInputs(inputs: FormValidoInputs): void {
    component.form.setValue(inputs);
  }

  function givenLoading(): void {
    component.loading = true;
  }

  function whenSubmito(): void {
    component.onSubmit();
  }

  function thenSeEmitioSubmitFormCon(payload: CrearBuffetRequest): void {
    expect(emitSubmitFormSpy).toHaveBeenCalledWith(payload);
  }

  function thenNoSeEmitio(): void {
    expect(emitSubmitFormSpy).not.toHaveBeenCalled();
  }

  function thenElFormEstaTouched(): void {
    expect(component.form.touched).toBeTrue();
  }
});
