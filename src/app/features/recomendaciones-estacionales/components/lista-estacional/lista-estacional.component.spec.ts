import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListaEstacionalComponent } from './lista-estacional.component';

describe('ListaEstacionalComponent', () => {
  let component: ListaEstacionalComponent;
  let fixture: ComponentFixture<ListaEstacionalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaEstacionalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ListaEstacionalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });
});
