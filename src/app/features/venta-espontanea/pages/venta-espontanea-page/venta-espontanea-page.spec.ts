import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VentaEspontaneaPage } from './venta-espontanea-page';

describe('VentaEspontaneaPage', () => {
  let component: VentaEspontaneaPage;
  let fixture: ComponentFixture<VentaEspontaneaPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VentaEspontaneaPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VentaEspontaneaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
