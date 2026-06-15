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

  constructor(private readonly http: HttpClient) {}

  enableCredit(request: EnableSchoolCreditRequest): Observable<SchoolCredit> {
    return this.http.post<SchoolCredit>(this.apiUrl, request);
  }
}
