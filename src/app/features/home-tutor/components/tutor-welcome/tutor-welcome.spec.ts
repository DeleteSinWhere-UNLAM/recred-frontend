import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TutorWelcome } from './tutor-welcome';

describe('TutorWelcome', () => {
  let component: TutorWelcome;
  let fixture: ComponentFixture<TutorWelcome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TutorWelcome]
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
