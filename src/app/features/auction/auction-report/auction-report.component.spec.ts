import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuctionReportComponent } from './auction-report.component';

describe('AuctionReportComponent', () => {
  let component: AuctionReportComponent;
  let fixture: ComponentFixture<AuctionReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuctionReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuctionReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
