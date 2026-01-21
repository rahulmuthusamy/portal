import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, TemplateRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HighlightPipe } from '../../pipes/highlight.pipe';

export interface TableColumn {
  key: string;
  label: string;
  searchable?: boolean;
  date?: {
    isDateTime?: boolean;
    combinDateandTime?: any,

  }
  isDateTime?: boolean;
  dateFormat?: any;
  isSelect?: boolean;
  isDisabled?: boolean;
  options?: any;
  optionLabelFn?: (opt: any) => string;
  optionValueKey?: string;
  condition?: any;
  rowColors?: { [childId: string]: string };
  actions?: {
    text: string;
    class?: string;
    type: string;
    title?: string;
    icon?: string;
    isDisabled?: boolean
    condition?: (row: any) => boolean;
  }[];
  render?: (row: any) => string | TemplateRef<any>;

}

export interface TableConfig {
  columns: TableColumn[];
  height?: string;
  pageSize?: number;

}

@Component({
  selector: 'app-data-table',
  
  imports: [CommonModule, FormsModule, HighlightPipe,],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss']
})
export class DataTableComponent implements OnChanges {
  @Input() config!: TableConfig;
  @Input() data: any = [];
  @Output() actionClick = new EventEmitter<{
    type: string;
    row: any;
    value?: any;
    key?: string;
  }>();

  filters: { [key: string]: string } = {};
  filteredData: any[] = [];

  currentPage: number = 1;
  pagedData: any[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config']) {
      this.config.columns.forEach(col => {
        if (col.searchable) this.filters[col.key] = '';
      });
    }

    if (changes['data']) {
      this.applyFilters();
    }
  }


  applyFilters() {
    const data = this.data || [];

    this.filteredData = data.filter((row: any) =>
      Object.keys(this.filters).every(key =>
        (row[key] ?? '').toString().toLowerCase().includes((this.filters[key] || '').toLowerCase())
      )
    );

    this.currentPage = 1;
    this.updatePagedData();
  }

  updatePagedData() {
    const startIndex = (this.currentPage - 1) * (this.config.pageSize || this.filteredData.length);
    const endIndex = startIndex + (this.config.pageSize || this.filteredData.length);
    this.pagedData = this.filteredData.slice(startIndex, endIndex);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagedData();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagedData();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.filteredData.length / (this.config.pageSize || this.filteredData.length));
  }

  onActionClick(row: any) {
    this.actionClick.emit(row);
  }

  selected: { [childId: string]: { [key: string]: any } } = {};


  getSelected(childId: string, key: string) {
    return this.selected[childId]?.[key] || '';
  }

  onSelectChange(value: any, row: any, key: string) {
    const childId = row.ChildID;
    if (!this.selected[childId]) this.selected[childId] = {};
    this.selected[childId][key] = value;

    if (value) {
      this.actionClick.emit({ type: 'select-change', row, value, key });
    }
  }

  clearSelectedForClient(childId: string) {
    delete this.selected[childId];
  }

}
