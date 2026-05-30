import { Component, inject } from '@angular/core';
import { AiVisionService } from '../services/ia-vision-service/ai-vision-service';
import { AiProductResponse } from '../models/ai-product-response.interface';
import { SaveProductRequest } from '../models/save-product-request.interface';
import { CameraCapture } from '../components/camera-capture/camera-capture';
import { ScannerLoader } from '../components/scanner-loader/scanner-loader';
import { AiProductForm } from '../components/ai-product-form/ai-product-form';

@Component({
    selector: 'app-ai-product-upload-page',
    standalone: true,
    imports: [CameraCapture, ScannerLoader, AiProductForm],
    templateUrl: './ai-product-upload-page.component.html',
    styleUrl: './ai-product-upload-page.component.css'
})
export class AiProductUploadPageComponent {
    private aiVisionService = inject(AiVisionService);

    isLoading = false;
    isSaving = false;
    scannedProductData: AiProductResponse | null = null;
    saveSuccess = false;
    saveError: string | null = null;

    handlePhoto(file: File) {
        this.isLoading = true;
        this.scannedProductData = null;
        this.saveSuccess = false;
        this.saveError = null;

        this.aiVisionService.analyzeImage(file).subscribe({
            next: (data) => {
                this.scannedProductData = data;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error analyzing image', err);
                this.isLoading = false;
                alert('Hubo un error al procesar la imagen.');
            }
        });
    }

    saveProduct(request: SaveProductRequest) {
        this.isSaving = true;
        this.saveSuccess = false;
        this.saveError = null;

        this.aiVisionService.saveProduct(request).subscribe({
            next: () => {
                this.isSaving = false;
                this.saveSuccess = true;
                this.scannedProductData = null;
            },
            error: (err) => {
                console.error('Error saving product', err);
                this.isSaving = false;
                this.saveError = 'Hubo un error al guardar el producto. Intenta nuevamente.';
            }
        });
    }
}