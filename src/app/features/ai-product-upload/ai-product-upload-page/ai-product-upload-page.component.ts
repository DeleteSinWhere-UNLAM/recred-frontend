import { Component, inject, OnInit } from '@angular/core';
import { AiVisionService } from '../services/ia-vision-service/ai-vision-service';
import { AiProductResponse } from '../models/ai-product-response.interface';
import { SaveProductRequest } from '../models/save-product-request.interface';
import { ProductService } from '../../updated-inventory/services/product.service';
import { Category } from '../../updated-inventory/models/category.interface';
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
export class AiProductUploadPageComponent implements OnInit {
    private aiVisionService = inject(AiVisionService);
    private productService = inject(ProductService);

    categories: Category[] = [];

    isLoading = false;
    isSaving = false;
    scannedProductData: AiProductResponse | null = null;
    saveSuccess = false;
    saveError: string | null = null;

    ngOnInit(): void {
        this.productService.getCategories().subscribe({
            next: (data) => {
                this.categories = data;
            },
            error: (err) => {
                console.error('Error fetching categories', err);
            }
        });
    }

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