import { Injectable }                              from '@angular/core';
import { HttpClient }                              from '@angular/common/http';
import { BehaviorSubject, Observable, retry, tap } from 'rxjs';
import { Selector }                                from '../../model/selector';

@Injectable({providedIn: 'root'})
export class NewsCategoryService {
    constructor(private readonly _httpClient: HttpClient) { }

    private _selector$: BehaviorSubject<Selector[]> = new BehaviorSubject<Selector[]>([]);

    get selector$() {
        return this._selector$.asObservable();
    }

    getSelector(): Observable<Selector[]> {
        return this._httpClient.get<Selector>('api/news-category/selector')
            .pipe(
                retry({count: 3, delay: 1000, resetOnSuccess: true}),
                tap((data: any) => this._selector$.next(data))
            );
    }
}
