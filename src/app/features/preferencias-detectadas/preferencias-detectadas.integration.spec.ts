import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { PreferenciaDetectada } from './models/preferencia-detectada.model';
import { PreferenciasDetectadasMother } from './preferencias-detectadas.mother';
import { PreferenciasDetectadasPage } from './preferencias-detectadas.page';
import { PreferenciasDetectadasService } from './services/preferencias-detectadas.service';

describe('PreferenciasDetectadas Integration', () => {
  let fixture: ComponentFixture<PreferenciasDetectadasPage>;
  let servicioPreferencias: jasmine.SpyObj<PreferenciasDetectadasService>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;

  beforeEach(async () => {
    servicioPreferencias = jasmine.createSpyObj('PreferenciasDetectadasService', ['getPreferencias']);
    servicioUsuario = jasmine.createSpyObj('UsuarioService', ['getUsuarioActual'], {
      nombreNavbar: signal('Tutor Integration'),
    });
    servicioUsuario.getUsuarioActual.and.returnValue(PreferenciasDetectadasMother.crearUsuario());

    await TestBed.configureTestingModule({
      imports: [PreferenciasDetectadasPage],
      providers: [
        { provide: PreferenciasDetectadasService, useValue: servicioPreferencias },
        { provide: UsuarioService, useValue: servicioUsuario },
      ],
    }).compileComponents();
  });

  it('dado el perfil en localStorage y 2 preferencias del service, cuando se monta, deberia renderizar el titulo y una card por preferencia', () => {
    givenPerfilEnLocalStorage({ id: 'user-1' });
    givenPreferenciasDelBack([
      PreferenciasDetectadasMother.crearPreferencia({
        sugerenciaId: 'sug-1',
        titulo: 'Le gustan los alfajores',
        mensaje: 'Compra muchos alfajores',
      }),
      PreferenciasDetectadasMother.crearPreferencia({
        sugerenciaId: 'sug-2',
        titulo: 'Prefiere jugos naturales',
        mensaje: 'Consume jugos en el recreo',
        razonIA: 'Aparece en 80% de sus recreos',
      }),
    ]);

    whenMonto();

    const texto = textoRenderizado();
    expect(texto).toContain('Preferencias detectadas');
    expect(texto).toContain('Le gustan los alfajores');
    expect(texto).toContain('Prefiere jugos naturales');
    expect(queryAll('app-preferencia-detectada-card').length).toBe(2);
  });

  it('dado una card colapsada, cuando hago click en Ver detalle, deberia expandir y mostrar la razon IA', () => {
    givenPerfilEnLocalStorage({ id: 'user-1' });
    givenPreferenciasDelBack([
      PreferenciasDetectadasMother.crearPreferencia({
        razonIA: 'Por compras recurrentes los lunes',
      }),
    ]);

    whenMonto();

    expect(textoRenderizado()).not.toContain('Por compras recurrentes los lunes');

    whenHagoClickEn('.card__btn');

    expect(textoRenderizado()).toContain('Por compras recurrentes los lunes');
    expect(textoRenderizado()).toContain('Ocultar detalle');
  });

  it('dado que el service devuelve lista vacia, cuando se monta, deberia mostrar el estado vacio y no renderizar cards', () => {
    givenPerfilEnLocalStorage({ id: 'user-1' });
    givenPreferenciasDelBack([]);

    whenMonto();

    expect(textoRenderizado()).toContain('No hay preferencias detectadas.');
    expect(queryAll('app-preferencia-detectada-card').length).toBe(0);
  });

  it('dado sin perfil en localStorage, cuando se monta, no deberia llamar al service ni renderizar cards', () => {
    givenSinPerfilEnLocalStorage();

    whenMonto();

    expect(servicioPreferencias.getPreferencias).not.toHaveBeenCalled();
    expect(queryAll('app-preferencia-detectada-card').length).toBe(0);
    expect(textoRenderizado()).toContain('No hay preferencias detectadas.');
  });

  function givenPerfilEnLocalStorage(perfil: { id: string }): void {
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(perfil));
  }

  function givenSinPerfilEnLocalStorage(): void {
    spyOn(localStorage, 'getItem').and.returnValue(null);
  }

  function givenPreferenciasDelBack(preferencias: PreferenciaDetectada[]): void {
    servicioPreferencias.getPreferencias.and.returnValue(of(preferencias));
  }

  function whenMonto(): void {
    fixture = TestBed.createComponent(PreferenciasDetectadasPage);
    fixture.detectChanges();
  }

  function whenHagoClickEn(selector: string): void {
    const btn = (fixture.nativeElement as HTMLElement).querySelector(selector) as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
  }

  function textoRenderizado(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  function queryAll(selector: string): NodeListOf<Element> {
    return (fixture.nativeElement as HTMLElement).querySelectorAll(selector);
  }
});
