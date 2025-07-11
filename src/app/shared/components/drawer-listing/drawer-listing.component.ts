import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ContentChild, EventEmitter, inject, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { RouterLink, RouterLinkActive }                                                                                                           from '@angular/router';
import { MatDrawer, MatSidenavModule }                                                                                                            from '@angular/material/sidenav';
import { MatButtonModule }                                                                                                                        from '@angular/material/button';
import { MatIconModule }                                                                                                                          from '@angular/material/icon';

import { Subject, takeUntil } from 'rxjs';

import { FuseMediaWatcherService } from '../../../../@fuse/services/media-watcher';
import { trackByFn }               from '@libs/ui/utils/utils';
import { PanelType }               from './panel.type';
import { DrawerHeaderComponent }   from './components/drawer-header.component';
import { DrawerContentComponent }  from './components/drawer-content.component';
import { CdkScrollable }           from '@angular/cdk/overlay';
import { UserService }                                                                                                                            from '@core/user/user.service';
import { RoleEnum }                                                                                                                               from '@core/user/role.type';

@Component({
    selector       : 'drawer-listing',
    standalone     : true,
    imports        : [
        MatSidenavModule,
        MatButtonModule,
        MatIconModule,
        RouterLink,
        RouterLinkActive,
        CdkScrollable,
    ],
    templateUrl    : './drawer-listing.component.html',
    styles         : `:host {
        width: 100%;
        height: 100%;
    }`,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DrawerListingComponent implements OnInit, OnDestroy {
    @ContentChild(DrawerHeaderComponent) headerComponent: DrawerHeaderComponent;
    @ContentChild(DrawerContentComponent) contentComponent: DrawerContentComponent;
    @Input() title: string;
    @Input() panels: Array<PanelType> = [ {
        id         : 'panel1',
        icon       : 'heroicons_outline:exclamation-triangle',
        title      : 'Invalid panels input',
        description: 'Please provide a valid array of panels',
        link       : undefined,
        disabled   : true
    } ];
    @Input() selectedPanel: string = this.panels[0].id;
    @Output() panelSelected: EventEmitter<PanelType> = new EventEmitter<PanelType>();
    @Output() drawerOpenedChange: EventEmitter<boolean> = new EventEmitter<boolean>();
    @ViewChild('drawer') drawer: MatDrawer;
    drawerMode: 'over' | 'side' = 'side';
    drawerOpened: boolean = true;
    protected readonly trackByFn = trackByFn;

    visiblePanels: PanelType[] = [];

    private _userService = inject(UserService);
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private readonly _changeDetectorRef: ChangeDetectorRef,
        private readonly _fuseMediaWatcherService: FuseMediaWatcherService,
    ) {}

    ngOnInit(): void {
        // Initialize visiblePanels with all panels
        this.visiblePanels = [ ...this.panels ];

        // Subscribe to media changes for responsive behavior
        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({matchingAliases}) => {
                // Set the drawerMode and drawerOpened
                if (matchingAliases.includes('xl')) {
                    this.drawerMode = 'side';
                    this.drawerOpened = true;
                } else {
                    this.drawerMode = 'over';
                    this.drawerOpened = false;
                }

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Subscribe to user changes to filter panels by role
        this._userService.user$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(user => {
                if (user) {
                    this.visiblePanels = this.filterPanelsByRole(this.panels, user.role.id);
                    this._changeDetectorRef.markForCheck();
                }
            });
    }

    /**
     * Filters the panels based on the user's role
     */
    filterPanelsByRole(panels: PanelType[], roleId: RoleEnum): PanelType[] {
        // If admin, show all panels
        if (roleId === RoleEnum.admin) {
            return panels;
        }

        return panels
            .filter(panel => {
                // If no requiredRoles, show the panel
                if (!panel.requiredRoles || panel.requiredRoles.length === 0) return true;

                // If the panel has requiredRoles, check if the user has the role
                if (panel.requiredRoles && !panel.requiredRoles.includes(roleId)) {
                    return false;
                }

                // If the panel has children, check if at least one child is visible
                if (panel.children && panel.children.length) {
                    const visibleChildren = this.filterPanelsByRole(panel.children, roleId);
                    return visibleChildren.length > 0;
                }

                return true;
            })
            .map(panel => {
                // If the panel has children, filter them too
                if (panel.children && panel.children.length) {
                    return {
                        ...panel,
                        children: this.filterPanelsByRole(panel.children, roleId)
                    };
                }
                return panel;
            });
    }

    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    goToPanel(panel: PanelType): void {
        this.selectedPanel = panel.id;

        // Close the drawer on 'over' mode
        if (this.drawerMode === 'over') {
            this.drawer.close();
        }

        this.panelSelected.emit(panel);
    }
}
