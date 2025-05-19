import { inject, Injectable }                                  from '@angular/core';
import { FuseNavigationItem }                                  from '@fuse/components/navigation';
import { FuseMockApiService }                                  from '@fuse/lib/mock-api';
import { compactNavigation, defaultNavigation, getNavigation } from 'app/mock-api/common/navigation/data';
import { cloneDeep }                                           from 'lodash-es';
import { PermissionsService }                                  from '@core/permissions/permissions.service';

@Injectable({providedIn: 'root'})
export class NavigationMockApi {
    readonly permissionsService = inject(PermissionsService);

    private readonly _compactNavigation: FuseNavigationItem[] = compactNavigation;
    private readonly _defaultNavigation: FuseNavigationItem[] = getNavigation(this.permissionsService);

    /**
     * Constructor
     */
    constructor(private _fuseMockApiService: FuseMockApiService) {
        // Register Mock API handlers
        this.registerHandlers();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Register Mock API handlers
     */
    registerHandlers(): void {
        // -----------------------------------------------------------------------------------------------------
        // @ Navigation - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/common/navigation')
            .reply(() => {
                // Fill compact navigation children using the default navigation
                this._compactNavigation.forEach((compactNavItem) => {
                    this._defaultNavigation.forEach((defaultNavItem) => {
                        if (defaultNavItem.id === compactNavItem.id) {
                            compactNavItem.children = cloneDeep(defaultNavItem.children);
                        }
                    });
                });

                // Return the response
                return [
                    200,
                    {
                        compact   : cloneDeep(this._compactNavigation),
                        default   : cloneDeep(this._defaultNavigation),
                        futuristic: cloneDeep(this._defaultNavigation),
                        horizontal: cloneDeep(this._defaultNavigation),
                    },
                ];
            });
    }
}
