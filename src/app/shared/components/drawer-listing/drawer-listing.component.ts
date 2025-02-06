import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ContentChild, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { RouterLink, RouterLinkActive }                                                                                                   from '@angular/router';
import { MatDrawer, MatSidenavModule }                                                                                                    from '@angular/material/sidenav';
import { MatButtonModule }                                                                                                                from '@angular/material/button';
import { MatIconModule }                                                                                                                  from '@angular/material/icon';

import { Subject, takeUntil } from 'rxjs';

import { FuseMediaWatcherService } from '../../../../@fuse/services/media-watcher';
import { trackByFn }               from '@libs/ui/utils/utils';
import { PanelType }               from './panel.type';
import { DrawerHeaderComponent }   from './components/drawer-header.component';
import { DrawerContentComponent }  from './components/drawer-content.component';
import { CdkScrollable }           from '@angular/cdk/overlay';

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
    // type of one of the panels, like entries of Object
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private readonly _changeDetectorRef: ChangeDetectorRef,
        private readonly _fuseMediaWatcherService: FuseMediaWatcherService,
    ) {}

    ngOnInit(): void {
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
