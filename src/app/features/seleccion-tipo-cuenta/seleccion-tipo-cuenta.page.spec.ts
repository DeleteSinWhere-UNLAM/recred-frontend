import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SeleccionTipoCuentaPage } from './seleccion-tipo-cuenta.page';

describe('SeleccionTipoCuentaPage', () => {
  let componente: SeleccionTipoCuentaPage;
  let fixture: ComponentFixture<SeleccionTipoCuentaPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeleccionTipoCuentaPage]
    }).compileComponents();

    fixture = TestBed.createComponent(SeleccionTipoCuentaPage);
    componente = fixture.componentInstance;
  });

  it('dado que se inicializa, debe crearse correctamente', () => {
    fixture.detectChanges();
    expect(componente).toBeTruthy();
  });

  it('dado que se renderiza el template, debe mostrar el texto placeholder de construccion', () => {
    fixture.detectChanges();
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Bienvenido a RECRED');
    expect(texto).toContain('esperando endpoint del back');
  });
});
