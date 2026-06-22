import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TutorWelcome } from './tutor-welcome';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

describe('TutorWelcome', () => {
  let component: TutorWelcome;
  let fixture: ComponentFixture<TutorWelcome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TutorWelcome],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TutorWelcome);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
