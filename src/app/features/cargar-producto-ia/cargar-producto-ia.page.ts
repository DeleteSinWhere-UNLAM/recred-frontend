import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IaVisionService } from './services/ia-vision.service';
import { RespuestaProductoIa } from './models/respuesta-producto-ia.model';
import { GuardarProductoRequest } from './models/guardar-producto-request.model';
import { ProductService } from '../updated-inventory/services/product.service';
import { Category } from '../updated-inventory/models/category.interface';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { PerfilService } from '../../data-access/services/perfil.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { CapturaCamaraComponent } from './components/captura-camara/captura-camara.component';
import { LoaderEscaneoComponent } from './components/loader-escaneo/loader-escaneo.component';
import { FormularioProductoIaComponent } from './components/formulario-producto-ia/formulario-producto-ia.component';

@Component({
    selector: 'app-cargar-producto-ia-page',
    standalone: true,
    imports: [NavbarComponent, CapturaCamaraComponent, LoaderEscaneoComponent, FormularioProductoIaComponent],
    templateUrl: './cargar-producto-ia.page.html',
    styleUrl: './cargar-producto-ia.page.css'
})
export class CargarProductoIaPage implements OnInit {
    private iaVisionService = inject(IaVisionService);
    private productService = inject(ProductService);
    private router = inject(Router);
    private usuarioService = inject(UsuarioService);
    private perfilService = inject(PerfilService);

    categories: Category[] = [];
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

        this.iaVisionService.analyzeImage(file).subscribe({
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

    saveProduct(request: GuardarProductoRequest) {
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

        this.iaVisionService.saveProduct({ ...request, buffetId }).subscribe({
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
