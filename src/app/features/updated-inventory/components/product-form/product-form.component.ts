import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject, signal } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Product } from "../../models/product.interface";
import { Category } from "../../models/category.interface";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../../environments/environment";

export interface ProductFormData {
  nombre: string;
  descripcion: string;
  precio: number;
  peso: number;
  stockActual: number;
  categoriaId: string | null;
  nuevaCategoriaNombre: string;
  requierePreparacion: boolean;
  contiene_azucar: boolean;
  contiene_mani: boolean;
  contiene_lactosa: boolean;
  contiene_tacc: boolean;
  urlImagen?: string | null;
}

@Component({
  selector: "app-product-form",
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: "./product-form.component.html",
  styleUrl: "./product-form.component.css"
})
export class ProductFormComponent implements OnInit, OnChanges {
  @Input() product: Product | null = null;
  @Input() categories: Category[] = [];
  @Input() isSaving = false;
  @Input() buffetId: string | null = null;
  @Output() formSubmit = new EventEmitter<ProductFormData>();
  @Output() formCancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  isUploadingImage = signal(false);
  imagePreview = signal<string | null>(null);

  productForm: FormGroup = this.fb.group({
    nombre: ["", [Validators.required, Validators.minLength(2)]],
    descripcion: ["", [Validators.required, Validators.minLength(3)]],
    precio: [null, [Validators.required, Validators.min(0.01)]],
    peso: [null, [Validators.required, Validators.min(0.001)]],
    stockActual: [null, [Validators.required, Validators.min(0)]],
    categoriaId: [null, Validators.required],
    nuevaCategoriaNombre: [""],
    requierePreparacion: [false],
    contiene_azucar: [false],
    contiene_mani: [false],
    contiene_lactosa: [false],
    contiene_tacc: [false],
    urlImagen: [null],
  });

  ngOnInit(): void {
    this.productForm.get("categoriaId")?.valueChanges.subscribe(value => {
      const nuevaCategoriaCtrl = this.productForm.get("nuevaCategoriaNombre");
      if (value === "NEW") {
        nuevaCategoriaCtrl?.setValidators([Validators.required]);
      } else {
        nuevaCategoriaCtrl?.clearValidators();
        nuevaCategoriaCtrl?.setValue("");
      }
      nuevaCategoriaCtrl?.updateValueAndValidity();
    });
  }

  get isEditing(): boolean {
    return this.product !== null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["product"] && this.product) {
      this.productForm.patchValue({
        nombre: this.product.nombre,
        descripcion: this.product.descripcion,
        precio: this.product.precio,
        peso: this.product.peso,
        stockActual: this.product.stockActual,
        categoriaId: this.product.categoriaId || "NEW",
        nuevaCategoriaNombre: this.product.categoriaId ? "" : (this.product.categoriaNombre || ""),
        requierePreparacion: this.product.requierePreparacion,
        contiene_azucar: this.product.clasificacionesSalud ? !this.product.clasificacionesSalud.some(c => c.descripcion === "Sin Azúcar") : false,
        contiene_mani: false,
        contiene_lactosa: this.product.clasificacionesSalud ? this.product.clasificacionesSalud.some(c => c.descripcion === "Contiene Lácteos") : false,
        contiene_tacc: this.product.clasificacionesSalud ? !this.product.clasificacionesSalud.some(c => c.descripcion === "Sin TACC") : false,
        urlImagen: this.product.urlImagen
      });
      this.imagePreview.set(this.product.urlImagen || null);
    }

    if (changes["product"] && !this.product) {
      this.productForm.reset({
        requierePreparacion: false,
        contiene_azucar: false,
        contiene_mani: false,
        contiene_lactosa: false,
        contiene_tacc: false,
      });
      this.imagePreview.set(null);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Mostrar preview local inmediatamente
      const reader = new FileReader();
      reader.onload = () => this.imagePreview.set(reader.result as string);
      reader.readAsDataURL(file);

      // Subir a Cloudinary vía Backend
      this.uploadImage(file);
    }
  }

  private uploadImage(file: File): void {
    this.isUploadingImage.set(true);
    const formData = new FormData();
    formData.append("image", file);

    // Usamos el endpoint de la IA para subir la imagen y obtener la URL de Cloudinary
    this.http.post<{url_imagen: string}>(`${environment.apiUrl}/load-stock/upload-image`, formData)
      .subscribe({
        next: (res) => {
          this.productForm.patchValue({ urlImagen: res.url_imagen });
          this.imagePreview.set(res.url_imagen);
          this.isUploadingImage.set(false);
        },
        error: () => {
          this.isUploadingImage.set(false);
          // Opcional: manejar error
        }
      });
  }

  submitForm(): void {
    if (this.productForm.valid) {
      this.formSubmit.emit(this.productForm.value);
    } else {
      this.productForm.markAllAsTouched();
    }
  }

  hasError(field: string): boolean {
    const control = this.productForm.get(field);
    return !!(control && control.invalid && control.touched);
  }

  getErrorMessage(field: string): string {
    const control = this.productForm.get(field);
    if (!control || !control.errors) return "";

    if (control.errors["required"]) return "Este campo es obligatorio";
    if (control.errors["minlength"]) return `Mínimo ${control.errors["minlength"].requiredLength} caracteres`;        
    if (control.errors["min"]) return `El valor mínimo es ${control.errors["min"].min}`;

    return "Valor inválido";
  }
}
