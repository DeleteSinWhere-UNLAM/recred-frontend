import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EscanerLoader } from './escaner-loader';

describe('EscanerLoader', () => {
  let component: EscanerLoader;
  let fixture: ComponentFixture<EscanerLoader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EscanerLoader]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EscanerLoader);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
