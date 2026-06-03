import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SeasonalPageComponent } from './seasonal-page.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

describe('SeasonalPageComponent', () => {
  let component: SeasonalPageComponent;
  let fixture: ComponentFixture<SeasonalPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeasonalPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SeasonalPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });
});
