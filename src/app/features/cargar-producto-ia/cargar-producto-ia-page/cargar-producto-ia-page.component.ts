import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IaVisionService } from '../services/ia-vision-service/ia-vision-service';
import { RespuestaProductoIa } from '../models/producto-ia-response.interface';
import { SolicitudGuardarProducto } from '../models/guardar-producto-request.interface';
import { ProductoService } from '../../inventario/services/producto.service';
import { Categoria } from '../../inventario/models/categoria.interface';
import { UsuarioService } from '../../../data-access/services/usuario.service';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { } from '../../../shared/components/navbar/navbar.component';
import { CapturaCamara } from '../components/captura-camara/captura-camara';
import { EscanerLoader } from '../components/escaner-loader/escaner-loader';
import { ProductoIaForm } from '../components/producto-ia-form/producto-ia-form';
import { DialogService } from '../../../shared/services/dialog.service';

@Component({
    selector: 'app-ai-product-upload-page',
    standalone: true,
    imports: [ CapturaCamara, EscanerLoader, ProductoIaForm],
    templateUrl: './cargar-producto-ia-page.component.html',
    styleUrl: './cargar-producto-ia-page.component.css'
})
export class CargarProductoIaPageComponent implements OnInit {
    private aiVisionService = inject(IaVisionService);
    private productService = inject(ProductoService);
    private router = inject(Router);
    private usuarioService = inject(UsuarioService);
    private perfilService = inject(PerfilService);
    private dialogService = inject(DialogService);

    categories: Categoria[] = [];
    buffetId = '';

    isLoading = false;
    isSaving = false;
    scannedProductData: RespuestaProductoIa | null = null;
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

    saveProduct(request: SolicitudGuardarProducto) {
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
