import { Injectable }     from '@angular/core';
import { HttpClient }     from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment }    from '../../../../../environments/environment';

export interface NewsArticle {
    title: string;
    description: string;
    source: string;
    publishedAt: Date;
    url: string;
    category: string;
    importance: 'high' | 'medium' | 'low';
}

export interface NewsData {
    articles: NewsArticle[];
    totalCount: number;
    popularTopics: string[];
    lastUpdated: Date;
}

@Injectable({
    providedIn: 'root'
})
export class IndustryNewsService {
    private apiKey = environment.newsApiKey || 'YOUR_API_KEY';
    private apiUrl = 'https://api.example.com/news'; // Replace with actual API URL

    constructor(private http: HttpClient) {}

    getIndustryNews(category: string = 'logistics', count: number = 5): Observable<NewsData> {
        // If we have a real API, we would use it like this:
        // const url = `${this.apiUrl}?category=${category}&count=${count}&apiKey=${this.apiKey}`;
        // return this.http.get<any>(url).pipe(
        //   map(response => this.transformNewsData(response)),
        //   catchError(error => {
        //     console.error('Error fetching industry news:', error);
        //     return throwError(() => new Error('Failed to load industry news. Please try again later.'));
        //   })
        // );

        // For now, return mock data
        return this.getMockNewsData();
    }

    private transformNewsData(response: any): NewsData {
        if (!response || !response.articles) {
            throw new Error('Invalid news data received');
        }

        // Transform the API response to our data model
        const articles = response.articles.map((article: any) => ({
            title      : article.title,
            description: article.description,
            source     : article.source.name,
            publishedAt: new Date(article.publishedAt),
            url        : article.url,
            category   : article.category,
            importance : this.getImportanceLevel(article.category)
        }));

        return {
            articles,
            totalCount   : response.totalResults,
            popularTopics: response.popularTopics || [ 'Combustibles', 'Regulaciones', 'Tecnología' ],
            lastUpdated  : new Date()
        };
    }

    private getImportanceLevel(category: string): 'high' | 'medium' | 'low' {
        // Determine importance level based on category
        const highImportanceCategories = [ 'regulations', 'safety', 'emergency' ];
        const mediumImportanceCategories = [ 'market', 'trends', 'technology' ];

        if (highImportanceCategories.includes(category.toLowerCase())) {
            return 'high';
        } else if (mediumImportanceCategories.includes(category.toLowerCase())) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    // Mock data for development and fallback
    getMockNewsData(): Observable<NewsData> {
        const mockData: NewsData = {
            articles     : [
                {
                    title      : 'Nueva regulación para transporte de carga',
                    description: 'El gobierno anuncia cambios en las regulaciones de transporte de carga que entrarán en vigor el próximo mes.',
                    source     : 'Secretaría de Transporte',
                    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
                    url        : '#',
                    category   : 'regulations',
                    importance : 'high'
                },
                {
                    title      : 'Aumento en precios de combustible para 2024',
                    description: 'Analistas predicen un aumento del 5% en los precios de combustible para el primer trimestre de 2024.',
                    source     : 'Economía Hoy',
                    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
                    url        : '#',
                    category   : 'market',
                    importance : 'medium'
                },
                {
                    title      : 'Nuevas tecnologías para flotas de transporte',
                    description: 'Las últimas innovaciones en sistemas de gestión de flotas prometen reducir costos operativos hasta un 15%.',
                    source     : 'Tech Logistics',
                    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
                    url        : '#',
                    category   : 'technology',
                    importance : 'medium'
                }
            ],
            totalCount   : 5,
            popularTopics: [ 'Combustibles', 'Regulaciones', 'Tecnología' ],
            lastUpdated  : new Date()
        };

        return of(mockData);
    }
}
