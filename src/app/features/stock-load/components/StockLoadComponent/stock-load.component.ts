import { Component, OnInit, Inject } from '@angular/core';
import { StockLoadPresenter, StockLoadView } from '../../presenter/stock-load.presenter';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-stock-load',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stock-load.component.html',
  styleUrls: ['./stock-load.component.css'],
  providers: [StockLoadPresenter] 
})
export class StockLoadComponent implements StockLoadView, OnInit {
  private presenter = Inject(StockLoadPresenter);
  
  textInput: string = '';
  selectedFile: File | null = null;
  isLoading: boolean = false;
  message: string = '';
  isError: boolean = false;

  ngOnInit(): void {
    this.presenter.attachView(this);
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (this.hasSelectedFile(input)) this.selectedFile = input.files![0];
  }

  onSubmit(): void {
    this.presenter.submitStockLoad(this.textInput, this.selectedFile);
  }

  showLoading(): void {
    this.isLoading = true;
    this.message = '';
  }

  hideLoading(): void {
    this.isLoading = false;
  }

  showSuccess(msg: string): void {
    this.message = msg;
    this.isError = false;
    this.resetForm();
  }

  showError(msg: string): void {
    this.message = msg;
    this.isError = true;
  }

  private hasSelectedFile(input: HTMLInputElement): boolean {
    return input.files !== null && input.files.length > 0;
  }

  private resetForm(): void {
    this.textInput = '';
    this.selectedFile = null;
  }
}