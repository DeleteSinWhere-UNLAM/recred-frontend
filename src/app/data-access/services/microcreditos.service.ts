import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface EnableSchoolCreditRequest {
  parentId: string;
  studentId: string;
}

export interface SchoolCredit {
  id?: string;
  creditId?: string;
  studentId?: string;
  amount: number;
  installments: number;
  status: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MicrocreditosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/school-credits`;

  requestCredit(studentId: string, parentId: string, amount: number, installments: number): Observable<SchoolCredit> {
    const body = { 
      studentId: studentId,
      parentId: parentId,
      amount: amount,
      installments: installments
    };
    return this.http.post<SchoolCredit>(`${this.apiUrl}`, body);
  }

  getLastRecharge(studentId: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/alumno/${studentId}/last-recharge`);
  }

  getActiveCredit(studentId: string): Observable<SchoolCredit | null> {
    return this.http.get<SchoolCredit | null>(`${this.apiUrl}/alumno/${studentId}/active`);
  }

  payCredit(creditId: string): Observable<SchoolCredit> {
    return this.http.post<SchoolCredit>(`${this.apiUrl}/${creditId}/pay`, {});
  }

  getHistory(studentId: string): Observable<SchoolCredit[]> {
    return this.http.get<SchoolCredit[]>(`${this.apiUrl}/alumno/${studentId}`);
  }
}
