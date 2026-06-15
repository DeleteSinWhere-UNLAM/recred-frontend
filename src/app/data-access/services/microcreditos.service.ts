import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface EnableSchoolCreditRequest {
  parentId: string;
  studentId: string;
}

export interface SchoolCredit {
  id: string;
  studentId: string;
  amount: number;
  status: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class MicrocreditosService {
  private readonly apiUrl = `${environment.apiUrl}/school-credits`;

  constructor(private http: HttpClient) {}

  requestCredit(studentId: string, parentId: string, amount: number, installments: number): Observable<any> {
    const body = { 
      studentId: studentId,
      parentId: parentId,
      amount: amount,
      installments: installments
    };
    return this.http.post(`${this.apiUrl}`, body);
  }

  getLastRecharge(studentId: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/alumno/${studentId}/last-recharge`);
  }

  getActiveCredit(studentId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/alumno/${studentId}/active`);
  }
}
