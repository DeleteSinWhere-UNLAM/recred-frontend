import { Component, inject } from '@angular/core';
import { AiVisionService } from '../services/ia-vision-service/ai-vision-service';
import { AiProductResponse } from '../models/ai-product-response.interface';
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
    scannedProductData: AiProductResponse | null = null;

    handlePhoto(file: File) {
        this.isLoading = true;
        this.scannedProductData = null;

        this.aiVisionService.analyzeImage(file).subscribe({
            next: (data) => {
                this.scannedProductData = data;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error al analizar la imagen', err);
                this.isLoading = false;
                alert('Hubo un error al procesar la imagen.');
            }
        });
    }

    saveProduct(finalProductData: AiProductResponse) {
        console.log('Enviando a la base de datos de productos:', finalProductData);
        alert('¡Producto guardado exitosamente!');
    }
}