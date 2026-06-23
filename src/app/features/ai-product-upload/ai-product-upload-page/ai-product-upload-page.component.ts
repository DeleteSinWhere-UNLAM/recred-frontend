import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AiVisionService } from '../services/ia-vision-service/ai-vision-service';
import { AiProductResponse } from '../models/ai-product-response.interface';
import { SaveProductRequest } from '../models/save-product-request.interface';
import { ProductService } from '../../updated-inventory/services/product.service';
import { Category } from '../../updated-inventory/models/category.interface';
import { UsuarioService } from '../../../data-access/services/usuario.service';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { } from '../../../shared/components/navbar/navbar.component';
import { CameraCapture } from '../components/camera-capture/camera-capture';
import { ScannerLoader } from '../components/scanner-loader/scanner-loader';
import { AiProductForm } from '../components/ai-product-form/ai-product-form';
import { DialogService } from '../../../shared/services/dialog.service';

@Component({
    selector: 'app-ai-product-upload-page',
    standalone: true,
    imports: [ CameraCapture, ScannerLoader, AiProductForm],
    templateUrl: './ai-product-upload-page.component.html',
    styleUrl: './ai-product-upload-page.component.css'
})
export class AiProductUploadPageComponent implements OnInit {
    private aiVisionService = inject(AiVisionService);
    private productService = inject(ProductService);
    private router = inject(Router);
    private usuarioService = inject(UsuarioService);
    private perfilService = inject(PerfilService);
    private dialogService = inject(DialogService);

    categories: Category[] = [];
    buffetId = '';

    isLoading = false;
    isSaving = false;
    scannedProductData: AiProductResponse | null = null;
    saveSuccess = false;
    saveError: string | null = null;

    constructor() {
        this.usuarioService.setHomeUrl('/kiosquero');
    }

    volver(): void {
        this.router.navigateByUrl('/kiosquero');
    }

    ngOnInit(): void {
        this.actualizarBuffetId();

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
            error: async (err) => {
                console.error('Error analyzing image', err);
                this.isLoading = false;
                await this.dialogService.alert('Hubo un error al procesar la imagen.', 'Error de Análisis');
            }
        });
    }

    saveProduct(request: SaveProductRequest) {
        const buffetId = this.actualizarBuffetId();
        if (!buffetId) {
            this.isSaving = false;
            this.saveSuccess = false;
            this.saveError = 'No se encontro un buffet asociado a tu perfil.';
            return;
        }

        this.isSaving = true;
        this.saveSuccess = false;
        this.saveError = null;

        this.aiVisionService.saveProduct({ ...request, buffetId }).subscribe({
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

    private actualizarBuffetId(): string {
        this.buffetId = this.perfilService.obtenerBuffetId() ?? '';
        return this.buffetId;
    }
}
