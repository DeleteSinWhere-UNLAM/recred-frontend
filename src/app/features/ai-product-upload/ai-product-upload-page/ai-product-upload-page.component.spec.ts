import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AiProductUploadPageComponent } from './ai-product-upload-page.component';
import { AiVisionService } from '../services/ia-vision-service/ai-vision-service';
import { of } from 'rxjs';

describe('AiProductUploadPageComponent', () => {
  let component: AiProductUploadPageComponent;
  let fixture: ComponentFixture<AiProductUploadPageComponent>;
  let aiVisionServiceMock: jasmine.SpyObj<AiVisionService>;

  beforeEach(async () => {
    aiVisionServiceMock = jasmine.createSpyObj('AiVisionService', ['analyzeImage']);
    aiVisionServiceMock.analyzeImage.and.returnValue(of({ nombre: 'Cepita', marca: 'Cepita', categoria: 'Bebidas' }));

    await TestBed.configureTestingModule({
      imports: [AiProductUploadPageComponent],
      providers: [
        { provide: AiVisionService, useValue: aiVisionServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AiProductUploadPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
