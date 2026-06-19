import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button-component';
import { By } from '@angular/platform-browser';

describe('ButtonComponent', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('dado que se inicializa, deberia crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('dado que esta deshabilitado, deberia retornar las clases de deshabilitado', () => {
    component.disabled = true;
    const classes = component.getClasses();
    expect(classes).toContain('bg-texto-claro text-white opacity-50 cursor-not-allowed');
  });

  it('dado que la variante es primary y no esta deshabilitado, deberia retornar las clases primary', () => {
    component.variant = 'primary';
    component.disabled = false;
    const classes = component.getClasses();
    expect(classes).toContain('bg-pizarra text-white hover:opacity-90 shadow-md');
  });

  it('dado que la variante es success y no esta deshabilitado, deberia retornar las clases success', () => {
    component.variant = 'success';
    component.disabled = false;
    const classes = component.getClasses();
    expect(classes).toContain('bg-menta text-white hover:opacity-90 shadow-md');
  });

  it('dado que la variante es danger y no esta deshabilitado, deberia retornar las clases danger', () => {
    component.variant = 'danger';
    component.disabled = false;
    const classes = component.getClasses();
    expect(classes).toContain('bg-melocoton text-white hover:opacity-90 shadow-md');
  });

  it('dado que la variante es outline y no esta deshabilitado, deberia retornar las clases outline', () => {
    component.variant = 'outline';
    component.disabled = false;
    const classes = component.getClasses();
    expect(classes).toContain('border-2 border-pizarra text-pizarra hover:bg-pizarra hover:text-white');
  });

  it('dado que se provee una variante desconocida, deberia retornar las clases base por defecto', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component.variant = 'unknown' as any;
    component.disabled = false;
    const classes = component.getClasses();
    expect(classes.trim()).toBe('px-4 py-2 rounded-lg font-semibold transition-all duration-200');
  });

  it('dado que se hace click en el boton, deberia emitir el evento Click', () => {
    spyOn(component.Click, 'emit');
    
    const button = fixture.debugElement.query(By.css('button'));
    button.triggerEventHandler('click', null);
    
    expect(component.Click.emit).toHaveBeenCalled();
  });
});
