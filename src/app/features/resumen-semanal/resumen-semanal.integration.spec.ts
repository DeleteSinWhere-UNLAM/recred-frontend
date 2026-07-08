import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { UsuarioService } from '../../data-access/services/usuario.service';
import {
  ResumenSemanalMother,
  USUARIO_ID_TEST,
  UsuarioMother,
} from './resumen-semanal.mother';
import { ResumenSemanalPage } from './resumen-semanal.page';

describe('ResumenSemanal Integration', () => {
  const URL_RESUMEN = `${environment.apiUrl}/resumen/me`;

  let fixture: ComponentFixture<ResumenSemanalPage>;
  let httpMock: HttpTestingController;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;

  beforeEach(async () => {
    servicioUsuario = jasmine.createSpyObj<UsuarioService>('UsuarioService', ['getUsuarioActual']);
    servicioUsuario.getUsuarioActual.and.returnValue(UsuarioMother.crear());

    await TestBed.configureTestingModule({
      imports: [ResumenSemanalPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: UsuarioService, useValue: servicioUsuario },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('dado un perfil en localStorage, cuando se monta la page, deberia pegar a /resumen/me y renderizar el gasto total', async () => {
    givenPerfilEnLocalStorage({ id: USUARIO_ID_TEST });

    whenMonto();
    whenElBackDevuelveResumen(ResumenSemanalMother.crear());

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('$1500');
    expect(texto).toContain('Juan');
  });

  it('dado que no hay perfil, cuando se monta la page, no deberia hacer requests HTTP', () => {
    givenSinPerfilEnLocalStorage();

    whenMonto();

    httpMock.expectNone(URL_RESUMEN);
    expect(fixture.componentInstance.resumen).toBeUndefined();
  });

  function givenPerfilEnLocalStorage(perfil: { id: string }): void {
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(perfil));
  }

  function givenSinPerfilEnLocalStorage(): void {
    spyOn(localStorage, 'getItem').and.returnValue(null);
  }

  function whenMonto(): void {
    fixture = TestBed.createComponent(ResumenSemanalPage);
    fixture.detectChanges();
  }

  function whenElBackDevuelveResumen(resumen: ReturnType<typeof ResumenSemanalMother.crear>): void {
    const req = httpMock.expectOne(URL_RESUMEN);
    expect(req.request.method).toBe('GET');
    req.flush(resumen);
    fixture.detectChanges();
  }
});
