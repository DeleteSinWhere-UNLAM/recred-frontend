import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastHostComponent } from './toast-host.component';
import { ToastService } from '../../services/toast.service';

describe('ToastHostComponent', () => {
  let component: ToastHostComponent;
  let fixture: ComponentFixture<ToastHostComponent>;
  let toastServiceMock: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    toastServiceMock = jasmine.createSpyObj('ToastService', ['cerrar'], {
      toasts: () => []
    });

    await TestBed.configureTestingModule({
      imports: [ToastHostComponent],
      providers: [
        { provide: ToastService, useValue: toastServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ToastHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('dado que se inicializa, deberia crearse correctamente', () => {
    expect(component).toBeTruthy();
  });
});
