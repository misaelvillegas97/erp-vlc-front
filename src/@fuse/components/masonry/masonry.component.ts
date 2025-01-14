import { NgClass, NgTemplateOutlet }                                                                  from '@angular/common';
import { AfterViewInit, Component, Input, OnChanges, SimpleChanges, TemplateRef, ViewEncapsulation, } from '@angular/core';
import { fuseAnimations }                                                                             from '@fuse/animations';

@Component({
  selector   : 'fuse-masonry',
  templateUrl: './masonry.component.html',
  encapsulation: ViewEncapsulation.None,
  animations : fuseAnimations,
  exportAs   : 'fuseMasonry',
  standalone : true,
  imports    : [ NgTemplateOutlet, NgClass ],
})
export class FuseMasonryComponent implements OnChanges, AfterViewInit {
  @Input() columnsTemplate: TemplateRef<any>;
  @Input() columns: number;
  @Input() items: any[] = [];
  @Input() containerClasses: string[] = [];
  distributedColumns: any[] = [];

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On changes
   *
   * @param changes
   */
  ngOnChanges(changes: SimpleChanges): void {
    // Columns
    if ('columns' in changes) {
      // Distribute the items
      this._distributeItems();
    }

    // Items
    if ('items' in changes) {
      // Distribute the items
      this._distributeItems();
    }
  }

  /**
   * After view init
   */
  ngAfterViewInit(): void {
    // Distribute the items for the first time
    this._distributeItems();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Private methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Distribute items into columns
   */
  private _distributeItems(): void {
    if (!this.columns || this.columns <= 0) {
      console.error('Invalid number of columns:', this.columns);
      this.distributedColumns = [];
      return;
    }

    if (!this.items || this.items.length === 0) {
      console.warn('No items to distribute.');
      this.distributedColumns = [];
      return;
    }

    this.distributedColumns = Array.from({length: this.columns}, () => ({
      items: []
    }));

    for (let i = 0; i < this.items.length; i++) {
      const columnIndex = i % this.columns;
      this.distributedColumns[columnIndex].items.push(this.items[i]);
    }
  }
}
