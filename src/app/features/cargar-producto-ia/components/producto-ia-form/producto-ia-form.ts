import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { RespuestaProductoIa } from "../../models/producto-ia-response.interface";
import { SolicitudGuardarProducto } from "../../models/guardar-producto-request.interface";
import { Categoria } from "../../../inventario/models/categoria.interface";
import {
  ClasificacionSaludCatalogoItem,
  ClaveRestriccion,
  obtenerIdClasificacionPorClave,
} from "../../../restricciones-nutricionales/models/restricciones-nutricionales.model";

@Component({
  selector: "app-ai-product-form",
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: "./producto-ia-form.html",
  styleUrl: "./producto-ia-form.css",
})
export class ProductoIaForm implements OnInit, OnChanges {
  @Input() prefillData: RespuestaProductoIa | null = null;
  @Input() categories: Categoria[] = [];
  @Input() healthClassifications: ClasificacionSaludCatalogoItem[] = [];
  @Input() isSaving = false;
  @Input() buffetId = "";
  @Output() save = new EventEmitter<SolicitudGuardarProducto>();

  private fb = inject(FormBuilder);
  productForm: FormGroup = this.fb.group({
    nombre: ["", Validators.required],
    descripcion: ["", Validators.required],
    peso: [0, [Validators.required, Validators.min(0.001)]],
    precio: [0, [Validators.required, Validators.min(0.01)]],
    stockActual: [0, [Validators.required, Validators.min(0)]],
    categoriaId: [null, Validators.required],
    nuevaCategoriaNombre: [""],
    requierePreparacion: [false],
    contiene_azucar: [false],
    contiene_mani: [false],
    contiene_lactosa: [false],
    contiene_tacc: [false],
    clasificacionesSaludIds: [[] as string[]],
    urlImagen: [""],
  });

  ngOnChanges(changes: SimpleChanges) {
    if (changes["prefillData"] && this.prefillData) {
      this.productForm.patchValue({
        nombre: this.prefillData.nombre,
        descripcion: this.prefillData.descripcion,
        peso: this.parseWeight(this.prefillData.peso),
        contiene_azucar: this.prefillData.contiene_azucar,
        contiene_mani: this.prefillData.contiene_mani,
        contiene_lactosa: this.prefillData.contiene_lactosa,
        contiene_tacc: this.prefillData.contiene_tacc,
        clasificacionesSaludIds: this.buildPrefillHealthClassificationIds(this.prefillData),
        urlImagen: this.prefillData.url_imagen || "",
      });
    } else if (changes["prefillData"] && this.prefillData === null) {
      this.productForm.reset(this.getInitialFormValue());
    } else if (
      changes["healthClassifications"]
      && this.prefillData
      && this.getSelectedHealthClassificationIds().length === 0
    ) {
      this.productForm.patchValue({
        clasificacionesSaludIds: this.buildPrefillHealthClassificationIds(this.prefillData),
      });
    }
  }

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

  hasError(field: string): boolean {
    const control = this.productForm.get(field);
    return !!(control && control.invalid && control.touched);
  }

  getErrorMessage(field: string): string {
    const control = this.productForm.get(field);
    if (!control || !control.errors) return "";

    if (control.errors["required"]) return "Este campo es obligatorio";
    if (control.errors["min"]) return `El valor mínimo es ${control.errors["min"].min}`;

    return "Valor inválido";
  }

  submitForm() {
    if (this.productForm.valid && this.buffetId) {
      const formValue = this.productForm.value;
      const request: SolicitudGuardarProducto = {
        nombre: formValue.nombre,
        descripcion: formValue.descripcion,
        precio: formValue.precio,
        peso: formValue.peso,
        requierePreparacion: formValue.requierePreparacion,
        categoriaId: formValue.categoriaId === "NEW" ? null : formValue.categoriaId,
        nuevaCategoriaNombre: formValue.categoriaId === "NEW" ? formValue.nuevaCategoriaNombre : "",
        buffetId: this.buffetId,
        stockActual: formValue.stockActual,
        clasificacionesSaludIds: this.getSelectedHealthClassificationIds(),
        tiposIds: [],
        urlImagen: formValue.urlImagen,
      };
      this.save.emit(request);
    } else {
      this.productForm.markAllAsTouched();
    }
  }

  private parseWeight(peso: string): number {
    const cleaned = peso.replace(/[^0-9.,]/g, "").replace(",", ".");
    const value = parseFloat(cleaned);
    if (isNaN(value)) return 0;

    const lower = peso.toLowerCase();
    if (lower.includes("kg") || lower.includes("l")) {
      return value;
    }
    return value / 1000;
  }

  private getInitialFormValue(): Record<string, unknown> {
    return {
      nombre: "",
      descripcion: "",
      peso: 0,
      precio: 0,
      stockActual: 0,
      categoriaId: null,
      nuevaCategoriaNombre: "",
      requierePreparacion: false,
      contiene_azucar: false,
      contiene_mani: false,
      contiene_lactosa: false,
      contiene_tacc: false,
      clasificacionesSaludIds: [],
      urlImagen: "",
    };
  }

  isHealthClassificationSelected(id: string): boolean {
    return this.getSelectedHealthClassificationIds().includes(id);
  }

  toggleHealthClassification(id: string, event: Event): void {
    const checked = (event.target as HTMLInputElement | null)?.checked ?? false;
    const selected = new Set(this.getSelectedHealthClassificationIds());

    if (checked) {
      selected.add(id);
    } else {
      selected.delete(id);
    }

    this.productForm.patchValue({ clasificacionesSaludIds: [...selected] });
    this.productForm.get("clasificacionesSaludIds")?.markAsDirty();
  }

  private getSelectedHealthClassificationIds(): string[] {
    const value = this.productForm.get("clasificacionesSaludIds")?.value;
    return Array.isArray(value) ? value : [];
  }

  private buildPrefillHealthClassificationIds(prefill: RespuestaProductoIa): string[] {
    const ids: string[] = [];
    this.pushClassificationId(ids, "sinTacc", !prefill.contiene_tacc);
    this.pushClassificationId(ids, "sinAzucar", !prefill.contiene_azucar);
    this.pushClassificationId(ids, "contieneLacteos", prefill.contiene_lactosa);
    this.pushClassificationId(ids, "tieneMani", prefill.contiene_mani);
    this.pushClassificationId(ids, "contieneHuevo", prefill.contiene_huevo === true);
    this.pushClassificationId(ids, "contienePescado", prefill.contiene_pescado === true);
    this.pushClassificationId(ids, "contieneSoja", prefill.contiene_soja === true);
    return ids;
  }

  private pushClassificationId(ids: string[], clave: ClaveRestriccion, shouldInclude: boolean): void {
    if (!shouldInclude) return;

    const id = obtenerIdClasificacionPorClave(this.healthClassifications, clave);
    if (id && !ids.includes(id)) {
      ids.push(id);
    }
  }
}
