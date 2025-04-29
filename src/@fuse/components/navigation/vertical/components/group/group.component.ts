import { BooleanInput }                                                                                         from '@angular/cdk/coercion';
import { NgClass }                                                                                              from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, inject, Input, OnDestroy, OnInit, } from '@angular/core';
import { MatIconModule }                                                                                        from '@angular/material/icon';
import { FuseNavigationService }                                                                                from '@fuse/components/navigation/navigation.service';
import { FuseNavigationItem }                                                                                   from '@fuse/components/navigation/navigation.types';
import { FuseVerticalNavigationBasicItemComponent }                                                             from '@fuse/components/navigation/vertical/components/basic/basic.component';
import { FuseVerticalNavigationCollapsableItemComponent }                                                       from '@fuse/components/navigation/vertical/components/collapsable/collapsable.component';
import { FuseVerticalNavigationDividerItemComponent }                                                           from '@fuse/components/navigation/vertical/components/divider/divider.component';
import { FuseVerticalNavigationSpacerItemComponent }                                                            from '@fuse/components/navigation/vertical/components/spacer/spacer.component';
import { FuseVerticalNavigationComponent }                                                                      from '@fuse/components/navigation/vertical/vertical.component';
import { Subject, takeUntil }                                                                                   from 'rxjs';
import { TranslocoDirective }                                                                                   from '@ngneat/transloco';
import { UserService }                                                                                          from '@core/user/user.service';
import { User }                                                                                                 from '@core/user/user.types';
import { RoleEnum }                                                                                             from '@core/user/role.type';

@Component({
  selector   : 'fuse-vertical-navigation-group-item',
  templateUrl: './group.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone : true,
  imports: [
    NgClass,
    MatIconModule,
    FuseVerticalNavigationBasicItemComponent,
    FuseVerticalNavigationCollapsableItemComponent,
    FuseVerticalNavigationDividerItemComponent,
    forwardRef(() => FuseVerticalNavigationGroupItemComponent),
    FuseVerticalNavigationSpacerItemComponent,
    TranslocoDirective,
  ],
})
export class FuseVerticalNavigationGroupItemComponent
  implements OnInit, OnDestroy {
  /* eslint-disable @typescript-eslint/naming-convention */
  static ngAcceptInputType_autoCollapse: BooleanInput;
  /* eslint-enable @typescript-eslint/naming-convention */

  private _changeDetectorRef = inject(ChangeDetectorRef);
  private _fuseNavigationService = inject(FuseNavigationService);
    private _userService = inject(UserService);

  @Input() autoCollapse: boolean;
  @Input() item: FuseNavigationItem;
  @Input() name: string;

  private _fuseVerticalNavigationComponent: FuseVerticalNavigationComponent;
  private _unsubscribeAll: Subject<any> = new Subject<any>();
    private _currentUser: User | null = null;

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    // Get the parent navigation component
    this._fuseVerticalNavigationComponent =
      this._fuseNavigationService.getComponent(this.name);

    // Subscribe to onRefreshed on the navigation component
    this._fuseVerticalNavigationComponent.onRefreshed
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(() => {
        // Mark for check
        this._changeDetectorRef.markForCheck();
      });

      // Subscribe to user changes
      this._userService.user$
          .pipe(takeUntil(this._unsubscribeAll))
          .subscribe((user: User) => {
              this._currentUser = user;
              // Mark for check to update the view
              this._changeDetectorRef.markForCheck();
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

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Track by function for ngFor loops
   *
   * @param index
   * @param item
   */
  trackByFn(index: number, item: any): any {
    return item.id || index;
  }

    /**
     * Check if the user has access to the navigation item
     *
     * @param item
     */
    canAccess(item: FuseNavigationItem): boolean {
        // If there's no user, deny access
        if (!this._currentUser || !this._currentUser.role) {
            return false;
        }

        // If the user is an admin, allow access to everything
        if (this._currentUser.role.id === RoleEnum.admin) {
            return true;
        }

        // If the item doesn't have requiredRoles or it's an empty array, allow access
        if (!item.requiredRoles || item.requiredRoles.length === 0) {
            return true;
        }

        // Check if the user's role is in the requiredRoles array
        return item.requiredRoles.includes(this._currentUser.role.id);
    }
}
