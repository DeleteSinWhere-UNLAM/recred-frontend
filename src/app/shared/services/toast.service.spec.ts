import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('dado que llamo a mostrar, deberia agregar un toast', fakeAsync(() => {
    service.mostrar('Test message', 'success', 4000);
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].mensaje).toBe('Test message');
    
    tick(4000);
    
    expect(service.toasts().length).toBe(0);
  }));

  it('dado que llamo a cerrar, deberia remover un toast por id', fakeAsync(() => {
    service.mostrar('Test message', 'error', 4000);
    const toast = service.toasts()[0];
    
    service.cerrar(toast.id);
    
    expect(service.toasts().length).toBe(0);
    
    tick(4000);
  }));
});
