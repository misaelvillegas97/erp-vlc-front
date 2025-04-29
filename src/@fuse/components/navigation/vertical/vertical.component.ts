import { animate, AnimationBuilder, AnimationPlayer, style, }                                                                from '@angular/animations';
import { BooleanInput, coerceBooleanProperty }                                                                               from '@angular/cdk/coercion';
import { ScrollStrategy, ScrollStrategyOptions }                                                                             from '@angular/cdk/overlay';
import { DOCUMENT }                                                                                                          from '@angular/common';
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    HostBinding,
    HostListener,
    inject,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    QueryList,
    Renderer2,
    SimpleChanges,
    ViewChild,
    ViewChildren,
    ViewEncapsulation,
}                                                                                                                            from '@angular/core';
import { NavigationEnd, Router }                                                                                             from '@angular/router';
import { fuseAnimations }                                                                                                    from '@fuse/animations';
import { FuseNavigationService }                                                                                             from '@fuse/components/navigation/navigation.service';
import { FuseNavigationItem, FuseVerticalNavigationAppearance, FuseVerticalNavigationMode, FuseVerticalNavigationPosition, } from '@fuse/components/navigation/navigation.types';
import { FuseVerticalNavigationAsideItemComponent }                                                                          from '@fuse/components/navigation/vertical/components/aside/aside.component';
import { FuseVerticalNavigationBasicItemComponent }                                                                          from '@fuse/components/navigation/vertical/components/basic/basic.component';
import { FuseVerticalNavigationCollapsableItemComponent }                                                                    from '@fuse/components/navigation/vertical/components/collapsable/collapsable.component';
import { FuseVerticalNavigationDividerItemComponent }                                                                        from '@fuse/components/navigation/vertical/components/divider/divider.component';
import { FuseVerticalNavigationGroupItemComponent }                                                                          from '@fuse/components/navigation/vertical/components/group/group.component';
import { FuseVerticalNavigationSpacerItemComponent }                                                                         from '@fuse/components/navigation/vertical/components/spacer/spacer.component';
import { FuseScrollbarDirective }                                                                                            from '@fuse/directives/scrollbar/scrollbar.directive';
import { FuseUtilsService }                                                                                                  from '@fuse/services/utils/utils.service';
import { debounceTime, delay, filter, merge, ReplaySubject, Subject, Subscription, takeUntil, }                              from 'rxjs';
import { UserService }                                                                                                       from '@core/user/user.service';
import { User }                                                                                                              from '@core/user/user.types';
import { canAccess }                                                                                                         from '../navigation.utils';

@Component({
  selector     : 'fuse-vertical-navigation',
  templateUrl  : './vertical.component.html',
  styleUrls    : [ './vertical.component.scss' ],
  animations   : fuseAnimations,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs     : 'fuseVerticalNavigation',
  standalone   : true,
  imports      : [
    FuseScrollbarDirective,
    FuseVerticalNavigationAsideItemComponent,
    FuseVerticalNavigationBasicItemComponent,
    FuseVerticalNavigationCollapsableItemComponent,
    FuseVerticalNavigationDividerItemComponent,
    FuseVerticalNavigationGroupItemComponent,
    FuseVerticalNavigationSpacerItemComponent,
  ],
})
export class FuseVerticalNavigationComponent implements OnChanges, OnInit, AfterViewInit, OnDestroy {
  /* eslint-disable @typescript-eslint/naming-convention */
  static ngAcceptInputType_inner: BooleanInput;
  static ngAcceptInputType_opened: BooleanInput;
  static ngAcceptInputType_transparentOverlay: BooleanInput;
  /* eslint-enable @typescript-eslint/naming-convention */

  @Output() readonly appearanceChanged: EventEmitter<FuseVerticalNavigationAppearance> = new EventEmitter<FuseVerticalNavigationAppearance>();
  @Output() readonly modeChanged: EventEmitter<FuseVerticalNavigationMode> = new EventEmitter<FuseVerticalNavigationMode>();
  @Output() readonly openedChanged: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() readonly positionChanged: EventEmitter<FuseVerticalNavigationPosition> = new EventEmitter<FuseVerticalNavigationPosition>();
  onCollapsableItemCollapsed: ReplaySubject<FuseNavigationItem> = new ReplaySubject<FuseNavigationItem>(1);
  onCollapsableItemExpanded: ReplaySubject<FuseNavigationItem> = new ReplaySubject<FuseNavigationItem>(1);
  private _animationBuilder = inject(AnimationBuilder);
  private _changeDetectorRef = inject(ChangeDetectorRef);
  private _document = inject(DOCUMENT);
  private _elementRef = inject(ElementRef);
  private _fuseNavigationService = inject(FuseNavigationService);
  private _fuseUtilsService = inject(FuseUtilsService);
  private _renderer2 = inject(Renderer2);
  private _router = inject(Router);
  private _scrollStrategyOptions = inject(ScrollStrategyOptions);
    private _userService = inject(UserService);

  @Input() appearance: FuseVerticalNavigationAppearance = 'default';
  @Input() autoCollapse: boolean = true;
  @Input() inner: boolean = false;
  @Input() mode: FuseVerticalNavigationMode = 'side';
  @Input() name: string = this._fuseUtilsService.randomId();
  @Input() navigation: FuseNavigationItem[];
  @Input() opened: boolean = true;
  @Input() position: FuseVerticalNavigationPosition = 'left';
  @Input() transparentOverlay: boolean = false;

  activeAsideItemId: string | null = null;
    currentUser: User | null = null;
  @ViewChild('navigationContent') private _navigationContentEl: ElementRef;
  onRefreshed: ReplaySubject<boolean> = new ReplaySubject<boolean>(1);
  private _animationsEnabled: boolean = false;
  private _asideOverlay: HTMLElement;
  private readonly _handleAsideOverlayClick: any;
  private readonly _handleOverlayClick: any;
  private _hovered: boolean = false;
    private _mouseEnterSubject: Subject<void> = new Subject<void>();
    private _mouseLeaveSubject: Subject<void> = new Subject<void>();
  private _mutationObserver: MutationObserver;
  private _overlay: HTMLElement;
    private _player: AnimationPlayer | null = null;
  private _scrollStrategy: ScrollStrategy = this._scrollStrategyOptions.block();

  /**
   * Constructor
   */
  constructor() {
    this._handleAsideOverlayClick = (): void => {
      this.closeAside();
    };
    this._handleOverlayClick = (): void => {
      this.close();
    };
  }
  private _fuseScrollbarDirectivesSubscription: Subscription;
  private _unsubscribeAll: Subject<any> = new Subject<any>();

  private _fuseScrollbarDirectives!: QueryList<FuseScrollbarDirective>;

  // -----------------------------------------------------------------------------------------------------
  // @ Accessors
  // -----------------------------------------------------------------------------------------------------

  /**
   * Setter for fuseScrollbarDirectives
   */
  @ViewChildren(FuseScrollbarDirective)
  set fuseScrollbarDirectives(
    fuseScrollbarDirectives: QueryList<FuseScrollbarDirective>
  ) {
    // Store the directives
    this._fuseScrollbarDirectives = fuseScrollbarDirectives;

    // Return if there are no directives
    if (fuseScrollbarDirectives.length === 0) {
      return;
    }

    // Unsubscribe the previous subscriptions
    if (this._fuseScrollbarDirectivesSubscription) {
      this._fuseScrollbarDirectivesSubscription.unsubscribe();
    }

    // Update the scrollbars on collapsable items' collapse/expand
    this._fuseScrollbarDirectivesSubscription = merge(
      this.onCollapsableItemCollapsed,
      this.onCollapsableItemExpanded
    )
      .pipe(takeUntil(this._unsubscribeAll), delay(250))
      .subscribe(() => {
        // Loop through the scrollbars and update them
        fuseScrollbarDirectives.forEach((fuseScrollbarDirective) => {
          fuseScrollbarDirective.update();
        });
      });
  }

  /**
   * Host binding for component classes
   */
  @HostBinding('class') get classList(): any {
    return {
      'fuse-vertical-navigation-animations-enabled'               :
      this._animationsEnabled,
      [`fuse-vertical-navigation-appearance-${ this.appearance }`]: true,
      'fuse-vertical-navigation-hover'                            : this._hovered,
      'fuse-vertical-navigation-inner'                            : this.inner,
      'fuse-vertical-navigation-mode-over'                        : this.mode === 'over',
      'fuse-vertical-navigation-mode-side'                        : this.mode === 'side',
      'fuse-vertical-navigation-opened'                           : this.opened,
      'fuse-vertical-navigation-position-left'                    : this.position === 'left',
      'fuse-vertical-navigation-position-right'                   :
        this.position === 'right',
    };
  }

  /**
   * Host binding for component inline styles
   */
  @HostBinding('style') get styleList(): any {
    return {
      visibility: this.opened ? 'visible' : 'hidden',
    };
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Decorated methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * On changes
   *
   * @param changes
   */
  ngOnChanges(changes: SimpleChanges): void {
    // Appearance
    if ('appearance' in changes) {
      // Execute the observable
      this.appearanceChanged.next(changes.appearance.currentValue);
    }

    // Inner
    if ('inner' in changes) {
      // Coerce the value to a boolean
      this.inner = coerceBooleanProperty(changes.inner.currentValue);
    }

    // Mode
    if ('mode' in changes) {
      // Get the previous and current values
      const currentMode = changes.mode.currentValue;
      const previousMode = changes.mode.previousValue;

      // Disable the animations
      this._disableAnimations();

      // If the mode changes: 'over -> side'
      if (previousMode === 'over' && currentMode === 'side') {
        // Hide the overlay
        this._hideOverlay();
      }

      // If the mode changes: 'side -> over'
      if (previousMode === 'side' && currentMode === 'over') {
        // Close the aside
        this.closeAside();

        // If the navigation is opened
        if (this.opened) {
          // Show the overlay
          this._showOverlay();
        }
      }

      // Execute the observable
      this.modeChanged.next(currentMode);

      // Enable the animations after a delay
      // The delay must be bigger than the current transition-duration
      // to make sure nothing will be animated while the mode changing
      setTimeout(() => {
        this._enableAnimations();
      }, 500);
    }

    // Navigation
      if ('navigation' in changes && !changes.navigation.firstChange) {
          // Only mark for check if this is not the first change (initial setup)
          // This avoids unnecessary change detection cycles during initialization
      this._changeDetectorRef.markForCheck();
    }

    // Opened
    if ('opened' in changes) {
      // Coerce the value to a boolean
      this.opened = coerceBooleanProperty(changes.opened.currentValue);

      // Open/close the navigation
      this._toggleOpened(this.opened);
    }

    // Position
    if ('position' in changes) {
      // Execute the observable
      this.positionChanged.next(changes.position.currentValue);
    }

    // Transparent overlay
    if ('transparentOverlay' in changes) {
      // Coerce the value to a boolean
      this.transparentOverlay = coerceBooleanProperty(
        changes.transparentOverlay.currentValue
      );
    }
  }

  /**
   * On init
   */
  ngOnInit(): void {
    // Make sure the name input is not an empty string
    if (this.name === '') {
      this.name = this._fuseUtilsService.randomId();
    }

    // Register the navigation component
    this._fuseNavigationService.registerComponent(this.name, this);

    // Subscribe to the 'NavigationEnd' event
    this._router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this._unsubscribeAll)
      )
      .subscribe(() => {
        // If the mode is 'over' and the navigation is opened...
        if (this.mode === 'over' && this.opened) {
          // Close the navigation
          this.close();
        }

        // If the mode is 'side' and the aside is active...
        if (this.mode === 'side' && this.activeAsideItemId) {
          // Close the aside
          this.closeAside();
        }
      });

      // Subscribe to user changes
      this._userService.user$
          .pipe(takeUntil(this._unsubscribeAll))
          .subscribe((user: User) => {
              this.currentUser = user;
              // Mark for check to update the view
              this._changeDetectorRef.markForCheck();
          });

      // Set up debounced mouse enter/leave handlers
      this._mouseEnterSubject
          .pipe(
              debounceTime(50), // 50ms debounce time
              takeUntil(this._unsubscribeAll)
          )
          .subscribe(() => {
              this._enableAnimations();
              this._hovered = true;
              this._changeDetectorRef.markForCheck();
          });

      this._mouseLeaveSubject
          .pipe(
              debounceTime(50), // 50ms debounce time
              takeUntil(this._unsubscribeAll)
          )
          .subscribe(() => {
              this._enableAnimations();
              this._hovered = false;
              this._changeDetectorRef.markForCheck();
          });
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * After view init
   */
  ngAfterViewInit(): void {
    // Fix for Firefox.
    //
    // Because 'position: sticky' doesn't work correctly inside a 'position: fixed' parent,
    // adding the '.cdk-global-scrollblock' to the html element breaks the navigation's position.
    // This fixes the problem by reading the 'top' value from the html element and adding it as a
    // 'marginTop' to the navigation itself.
      // Create a more efficient mutation observer that only processes
      // changes when the cdk-global-scrollblock class is added or removed
    this._mutationObserver = new MutationObserver((mutations) => {
        // Only process if we have mutations
        if (!mutations.length) return;

        const mutationTarget = mutations[0].target as HTMLElement;
        if (mutations[0].attributeName === 'class') {
            // Check if the scrollblock class was added
            if (mutationTarget.classList.contains('cdk-global-scrollblock')) {
                const top = parseInt(mutationTarget.style.top, 10);
                if (!isNaN(top)) {
            this._renderer2.setStyle(
              this._elementRef.nativeElement,
              'margin-top',
                `${ Math.abs(top) }px`
            );
                }
            } else {
                // Remove the style when the class is removed
                this._renderer2.setStyle(
                    this._elementRef.nativeElement,
                    'margin-top',
                    null
                );
            }

            // Only mark for check when the class actually changes
            this._changeDetectorRef.markForCheck();
        }
    });

      // Observe only class changes on the document element
    this._mutationObserver.observe(this._document.documentElement, {
      attributes: true,
        attributeFilter: [ 'class' ],
    });

      // Use a specific timeout value for better predictability
    setTimeout(() => {
      // Return if 'navigation content' element does not exist
      if (!this._navigationContentEl) {
        return;
      }

      // If 'navigation content' element doesn't have
      // perfect scrollbar activated on it...
      if (
        !this._navigationContentEl.nativeElement.classList.contains(
          'ps'
        )
      ) {
        // Find the active item
        const activeItem =
          this._navigationContentEl.nativeElement.querySelector(
            '.fuse-vertical-navigation-item-active'
          );

        // If the active item exists, scroll it into view
        if (activeItem) {
            activeItem.scrollIntoView({behavior: 'smooth', block: 'nearest'});
        }
      }
      // Otherwise
      else {
        // Go through all the scrollbar directives
        this._fuseScrollbarDirectives.forEach(
          (fuseScrollbarDirective) => {
            // Skip if not enabled
            if (!fuseScrollbarDirective.isEnabled()) {
              return;
            }

            // Scroll to the active element
            fuseScrollbarDirective.scrollToElement(
              '.fuse-vertical-navigation-item-active',
              -120,
              true
            );
          }
        );
      }
    }, 100); // 100ms is usually sufficient for the DOM to be ready
  }

  /**
   * On mouseenter
   *
   * @private
   */
  @HostListener('mouseenter')
  private _onMouseenter(): void {
      // Emit to the subject instead of directly setting state
      // This allows for debouncing
      this._mouseEnterSubject.next();
  }

  /**
   * On mouseleave
   *
   * @private
   */
  @HostListener('mouseleave')
  private _onMouseleave(): void {
      // Emit to the subject instead of directly setting state
      // This allows for debouncing
      this._mouseLeaveSubject.next();
  }

  /**
   * On destroy
   */
  ngOnDestroy(): void {
    // Disconnect the mutation observer
      if (this._mutationObserver) {
          this._mutationObserver.disconnect();
      }

    // Forcefully close the navigation and aside in case they are opened
    this.close();
    this.closeAside();

      // Clean up any remaining animation player
      if (this._player) {
          this._player.destroy();
          this._player = null;
      }

      // Unsubscribe from the scrollbar directives subscription
      if (this._fuseScrollbarDirectivesSubscription) {
          this._fuseScrollbarDirectivesSubscription.unsubscribe();
      }

    // Deregister the navigation component from the registry
    this._fuseNavigationService.deregisterComponent(this.name);

      // Clean up mouse event subjects
      this._mouseEnterSubject.complete();
      this._mouseLeaveSubject.complete();

    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Refresh the component to apply the changes
   */
  refresh(): void {
      // Execute the observable first
    this.onRefreshed.next(true);

      // Then mark for check - only needed once per refresh cycle
      this._changeDetectorRef.markForCheck();
  }

  /**
   * Open the navigation
   */
  open(): void {
    // Return if the navigation is already open
    if (this.opened) {
      return;
    }

    // Set the opened
    this._toggleOpened(true);
  }

  /**
   * Close the navigation
   */
  close(): void {
    // Return if the navigation is already closed
    if (!this.opened) {
      return;
    }

    // Close the aside
    this.closeAside();

    // Set the opened
    this._toggleOpened(false);
  }

  /**
   * Toggle the navigation
   */
  toggle(): void {
    // Toggle
    if (this.opened) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Open the aside
   *
   * @param item
   */
  openAside(item: FuseNavigationItem): void {
    // Return if the item is disabled
    if (item.disabled || !item.id) {
      return;
    }

    // Open
    this.activeAsideItemId = item.id;

    // Show the aside overlay
    this._showAsideOverlay();

      // Mark for check - only needed once at the end of the method
    this._changeDetectorRef.markForCheck();
  }

  /**
   * Close the aside
   */
  closeAside(): void {
    // Close
    this.activeAsideItemId = null;

    // Hide the aside overlay
    this._hideAsideOverlay();

      // Mark for check - only needed once at the end of the method
    this._changeDetectorRef.markForCheck();
  }

  /**
   * Toggle the aside
   *
   * @param item
   */
  toggleAside(item: FuseNavigationItem): void {
    // Toggle
    if (this.activeAsideItemId === item.id) {
      this.closeAside();
    } else {
      this.openAside(item);
    }
  }

  /**
   * Track by function for ngFor loops
   *
   * @param index
   * @param item
   */
  trackByFn(index: number, item: FuseNavigationItem): any {
      // Use a combination of id and type for more precise tracking
      return item.id ? `${ item.id }-${ item.type }` : index;
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Private methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Enable the animations
   *
   * @private
   */
  private _enableAnimations(): void {
    // Return if the animations are already enabled
    if (this._animationsEnabled) {
      return;
    }

    // Enable the animations
    this._animationsEnabled = true;
  }

  /**
   * Disable the animations
   *
   * @private
   */
  private _disableAnimations(): void {
    // Return if the animations are already disabled
    if (!this._animationsEnabled) {
      return;
    }

    // Disable the animations
    this._animationsEnabled = false;
  }

  /**
   * Show the overlay
   *
   * @private
   */
  private _showOverlay(): void {
    // Return if there is already an overlay
    if (this._asideOverlay) {
      return;
    }

    // Create the overlay element
    this._overlay = this._renderer2.createElement('div');

    // Add a class to the overlay element
    this._overlay.classList.add('fuse-vertical-navigation-overlay');

    // Add a class depending on the transparentOverlay option
    if (this.transparentOverlay) {
      this._overlay.classList.add(
        'fuse-vertical-navigation-overlay-transparent'
      );
    }

    // Append the overlay to the parent of the navigation
    this._renderer2.appendChild(
      this._elementRef.nativeElement.parentElement,
      this._overlay
    );

    // Enable block scroll strategy
    this._scrollStrategy.enable();

      // Clean up any existing animation player
      if (this._player) {
          this._player.destroy();
          this._player = null;
      }

    // Create the enter animation and attach it to the player
    this._player = this._animationBuilder
      .build([
        animate(
          '300ms cubic-bezier(0.25, 0.8, 0.25, 1)',
          style({opacity: 1})
        ),
      ])
      .create(this._overlay);

    // Play the animation
    this._player.play();

    // Add an event listener to the overlay
    this._overlay.addEventListener('click', this._handleOverlayClick);
  }

  /**
   * Hide the overlay
   *
   * @private
   */
  private _hideOverlay(): void {
    if (!this._overlay) {
      return;
    }

      // Clean up any existing animation player
      if (this._player) {
          this._player.destroy();
          this._player = null;
      }

    // Create the leave animation and attach it to the player
    this._player = this._animationBuilder
      .build([
        animate(
          '300ms cubic-bezier(0.25, 0.8, 0.25, 1)',
          style({opacity: 0})
        ),
      ])
      .create(this._overlay);

    // Play the animation
    this._player.play();

    // Once the animation is done...
    this._player.onDone(() => {
      // If the overlay still exists...
      if (this._overlay) {
        // Remove the event listener
        this._overlay.removeEventListener(
          'click',
          this._handleOverlayClick
        );

        // Remove the overlay
        this._overlay.parentNode.removeChild(this._overlay);
        this._overlay = null;
      }

      // Disable block scroll strategy
      this._scrollStrategy.disable();

        // Clean up the player after it's done
        if (this._player) {
            this._player.destroy();
            this._player = null;
        }
    });
  }

  /**
   * Show the aside overlay
   *
   * @private
   */
  private _showAsideOverlay(): void {
    // Return if there is already an overlay
    if (this._asideOverlay) {
      return;
    }

    // Create the aside overlay element
    this._asideOverlay = this._renderer2.createElement('div');

    // Add a class to the aside overlay element
    this._asideOverlay.classList.add(
      'fuse-vertical-navigation-aside-overlay'
    );

    // Append the aside overlay to the parent of the navigation
    this._renderer2.appendChild(
      this._elementRef.nativeElement.parentElement,
      this._asideOverlay
    );

      // Clean up any existing animation player
      if (this._player) {
          this._player.destroy();
          this._player = null;
      }

    // Create the enter animation and attach it to the player
    this._player = this._animationBuilder
      .build([
        animate(
          '300ms cubic-bezier(0.25, 0.8, 0.25, 1)',
          style({opacity: 1})
        ),
      ])
      .create(this._asideOverlay);

    // Play the animation
    this._player.play();

    // Add an event listener to the aside overlay
    this._asideOverlay.addEventListener(
      'click',
      this._handleAsideOverlayClick
    );
  }

  /**
   * Hide the aside overlay
   *
   * @private
   */
  private _hideAsideOverlay(): void {
    if (!this._asideOverlay) return;

      // Clean up any existing animation player
      if (this._player) {
          this._player.destroy();
          this._player = null;
      }

    // Create the leave animation and attach it to the player
    this._player = this._animationBuilder
      .build([
        animate(
          '300ms cubic-bezier(0.25, 0.8, 0.25, 1)',
          style({opacity: 0})
        ),
      ])
      .create(this._asideOverlay);

    // Play the animation
    this._player.play();

    // Once the animation is done...
    this._player.onDone(() => {
      // If the aside overlay still exists...
      if (this._asideOverlay) {
        // Remove the event listener
        this._asideOverlay.removeEventListener(
          'click',
          this._handleAsideOverlayClick
        );

        // Remove the aside overlay
        this._asideOverlay.parentNode.removeChild(this._asideOverlay);
        this._asideOverlay = null;
      }

        // Clean up the player after it's done
        if (this._player) {
            this._player.destroy();
            this._player = null;
      }
    });
  }

  /**
   * Open/close the navigation
   *
   * @param open
   * @private
   */
  private _toggleOpened(open: boolean): void {
    // Set the opened
    this.opened = open;

    // Enable the animations
    this._enableAnimations();

    // If the navigation opened, and the mode
    // is 'over', show the overlay
    if (this.mode === 'over') {
      if (this.opened) {
        this._showOverlay();
      } else {
        this._hideOverlay();
      }
    }

    // Execute the observable
    this.openedChanged.next(open);
  }

    protected readonly canAccess = canAccess;
}
