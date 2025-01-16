import { Component, HostListener, OnDestroy, OnInit, ViewEncapsulation }                              from '@angular/core';
import { MatButtonModule }                                                                            from '@angular/material/button';
import { MatIconModule }                                                                              from '@angular/material/icon';
import { ActivatedRoute, Router, RouterOutlet }                                                       from '@angular/router';
import { FuseFullscreenComponent }                                                                    from '@fuse/components/fullscreen';
import { FuseLoadingBarComponent }                                                                    from '@fuse/components/loading-bar';
import { FuseHorizontalNavigationComponent, FuseNavigationService, FuseVerticalNavigationComponent, } from '@fuse/components/navigation';
import { FuseMediaWatcherService }                                                                    from '@fuse/services/media-watcher';
import { NavigationService }                                                                          from 'app/core/navigation/navigation.service';
import { Navigation }                                                                                 from 'app/core/navigation/navigation.types';
import { SearchComponent }                                                                            from 'app/layout/components/search/search.component';
import { UserComponent }                                                                              from 'app/layout/components/user/user.component';
import { Subject, takeUntil }                                                                         from 'rxjs';

@Component({
    selector     : 'enterprise-layout',
    templateUrl  : './enterprise.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone   : true,
    imports      : [
        FuseLoadingBarComponent,
        FuseVerticalNavigationComponent,
        MatButtonModule,
        MatIconModule,
        FuseFullscreenComponent,
        SearchComponent,
        UserComponent,
        FuseHorizontalNavigationComponent,
        RouterOutlet,
    ],
})
export class EnterpriseLayoutComponent implements OnInit, OnDestroy {
    isScreenSmall: boolean;
    navigation: Navigation;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _router: Router,
        private _navigationService: NavigationService,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _fuseNavigationService: FuseNavigationService
    ) {}

    /**
     * Getter for current year
     */
    get currentYear(): number {
        return new Date().getFullYear();
    }

    /**
     * On init
     */
    ngOnInit(): void {
        // Subscribe to navigation data
        this._navigationService.navigation$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((navigation: Navigation) => {
                this.navigation = navigation;
            });

        // Subscribe to media changes
        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({matchingAliases}) => {
                // Check if the screen is small
                this.isScreenSmall = !matchingAliases.includes('md');
            });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    @HostListener('window:scroll', [ '$event' ])
    onWindowScroll(e: Event): void {
        // Get the scroll position
        const scrollPosition = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;

        // Toggle the class based on the scroll position
        if (scrollPosition > 100) {
            document.body.classList.add('scroll-top');
            document.body.classList.add('group/body');
        } else {
            document.body.classList.remove('scroll-top');
        }
    }

    /**
     * Toggle navigation
     *
     * @param name
     */
    toggleNavigation(name: string): void {
        // Get the navigation
        const navigation =
            this._fuseNavigationService.getComponent<FuseVerticalNavigationComponent>(
                name
            );

        if (navigation) {
            // Toggle the opened status
            navigation.toggle();
        }
    }
}
