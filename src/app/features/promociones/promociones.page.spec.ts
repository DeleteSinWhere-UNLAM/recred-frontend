import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { signal } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PromocionesPageComponent } from './promociones.page';
import { PromocionesPagePresenter } from './presenter/promociones.presenter';

describe('PromocionesPageComponent', () => {
  let component: PromocionesPageComponent;
  let fixture: ComponentFixture<PromocionesPageComponent>;
  beforeEach(async () => {
    

    await TestBed.configureTestingModule({
      imports: [PromocionesPageComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [{ provide: ActivatedRoute, useValue: {} }]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PromocionesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dado que se inicializa, debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });
});
