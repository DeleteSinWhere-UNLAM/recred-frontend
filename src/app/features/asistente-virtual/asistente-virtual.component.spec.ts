import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AsistenteVirtualComponent } from './asistente-virtual.component';
import { AsistenteVirtualPresenter } from './presenter/asistente-virtual.presenter';
import { PerfilService } from '../../data-access/services/perfil.service';
import { AsistenteVirtualService } from './services/asistente-virtual.service';

describe('AsistenteVirtualComponent', () => {
  let component: AsistenteVirtualComponent;
  let fixture: ComponentFixture<AsistenteVirtualComponent>;

  beforeEach(async () => {
    const perfilSpy = jasmine.createSpyObj('PerfilService', ['getPerfil']);
    const serviceSpy = jasmine.createSpyObj('AsistenteVirtualService', ['listarSesiones']);
    const presenterSpy = {
      abierto: jasmine.createSpy('abierto').and.returnValue(false)
    };

    await TestBed.configureTestingModule({
      imports: [AsistenteVirtualComponent],
      providers: [
        { provide: PerfilService, useValue: perfilSpy },
        { provide: AsistenteVirtualService, useValue: serviceSpy }
      ]
    })
    .overrideProvider(AsistenteVirtualPresenter, { useValue: presenterSpy })
    .compileComponents();

    fixture = TestBed.createComponent(AsistenteVirtualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dado que se inicializa, deberia tener acceso al presenter inyectado', () => {
    expect(component['presenter']).toBeDefined();
  });
});
