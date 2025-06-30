import { Component, OnDestroy, OnInit }  from '@angular/core';
import { CommonModule }                  from '@angular/common';
import { MatIconModule }                 from '@angular/material/icon';
import { MatButtonModule }               from '@angular/material/button';
import { MatProgressSpinnerModule }      from '@angular/material/progress-spinner';
import { IndustryNewsService, NewsData } from '../services/industry-news.service';
import { Subscription }                  from 'rxjs';

@Component({
    selector  : 'app-industry-news',
    standalone: true,
    imports   : [
        CommonModule,
        MatIconModule,
        MatButtonModule,
        MatProgressSpinnerModule
    ],
    template  : `
        <div class="flex flex-col">
            <div class="flex justify-between items-center mb-4">
                <div class="text-lg font-semibold">Noticias del sector</div>
                <div class="bg-purple-900/30 text-purple-500 text-sm font-bold px-2 py-1 rounded" *ngIf="newsData">
                    {{ newsData.totalCount }} nuevas hoy
                </div>
            </div>

            <!-- Loading state -->
            <div class="flex justify-center items-center py-8" *ngIf="loading">
                <mat-spinner [diameter]="40"></mat-spinner>
            </div>

            <!-- Error state -->
            <div class="text-center py-8 text-red-500" *ngIf="error">
                <p>{{ error }}</p>
                <button mat-button color="primary" class="mt-2" (click)="loadNewsData()">
                    Reintentar
                </button>
            </div>

            <!-- News data -->
            <ng-container *ngIf="newsData && !loading && !error">
                <div class="space-y-4 mb-3">
                    <div class="p-3 rounded-lg"
                         [ngClass]="{
                 'bg-purple-900/20': article.importance === 'medium',
                 'bg-red-900/20': article.importance === 'high',
                 'bg-blue-900/20': article.importance === 'low'
               }"
                         *ngFor="let article of newsData.articles">
                        <div class="flex justify-between items-start mb-2">
                            <div class="font-medium">{{ article.title }}</div>
                            <div class="text-xs px-2 py-0.5 rounded ml-2 whitespace-nowrap"
                                 [ngClass]="{
                     'bg-red-900/30 text-red-500': article.importance === 'high',
                     'bg-yellow-900/30 text-yellow-500': article.importance === 'medium',
                     'bg-blue-900/30 text-blue-500': article.importance === 'low'
                   }">
                                {{ getImportanceLabel(article.importance) }}
                            </div>
                        </div>
                        <div class="text-sm text-gray-400 mb-2">
                            {{ article.description }}
                        </div>
                        <div class="flex justify-between items-center text-xs text-gray-500">
                            <div>{{ article.source }}</div>
                            <div>{{ getTimeAgo(article.publishedAt) }}</div>
                        </div>
                    </div>
                </div>

                <div class="text-sm text-gray-400 mb-3" *ngIf="newsData.popularTopics.length > 0">
                    Temas populares:
                    <span class="inline-block bg-gray-800 text-xs rounded px-2 py-0.5 ml-2" *ngFor="let topic of newsData.popularTopics; let i = index"
                          [ngClass]="{'ml-1': i > 0}">
            {{ topic }}
          </span>
                </div>

                <button mat-button color="primary" class="mt-2 self-end">
                    <mat-icon svgIcon="mat_solid:article"></mat-icon>
                    Ver todas las noticias
                </button>
            </ng-container>
        </div>
    `
})
export class IndustryNewsComponent implements OnInit, OnDestroy {
    newsData: NewsData | null = null;
    loading = true;
    error: string | null = null;
    private subscription: Subscription | null = null;

    constructor(private newsService: IndustryNewsService) {}

    ngOnInit(): void {
        this.loadNewsData();
    }

    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    loadNewsData(): void {
        this.loading = true;
        this.error = null;

        // Use the mock data for now, but in production we would use getIndustryNews with actual parameters
        this.subscription = this.newsService.getIndustryNews().subscribe({
            next : (data) => {
                this.newsData = data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading industry news:', err);
                this.error = 'No se pudo cargar las noticias del sector. Por favor, intente de nuevo más tarde.';
                this.loading = false;
            }
        });
    }

    getImportanceLabel(importance: string): string {
        switch (importance) {
            case 'high':
                return 'Importante';
            case 'medium':
                return 'Tendencia';
            case 'low':
                return 'Tecnología';
            default:
                return importance;
        }
    }

    getTimeAgo(date: Date): string {
        const now = new Date();
        const diffMs = now.getTime() - new Date(date).getTime();
        const diffMins = Math.round(diffMs / 60000);

        if (diffMins < 60) {
            return 'Hace unos minutos';
        } else if (diffMins < 120) {
            return 'Hace 1 hora';
        } else if (diffMins < 24 * 60) {
            return `Hace ${ Math.floor(diffMins / 60) } horas`;
        } else if (diffMins < 48 * 60) {
            return 'Hace 1 día';
        } else {
            return `Hace ${ Math.floor(diffMins / (60 * 24)) } días`;
        }
    }
}
