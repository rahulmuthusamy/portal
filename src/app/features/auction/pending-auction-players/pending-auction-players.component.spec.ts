import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingAuctionPlayersComponent } from './pending-auction-players.component';

describe('PendingAuctionPlayersComponent', () => {
  let component: PendingAuctionPlayersComponent;
  let fixture: ComponentFixture<PendingAuctionPlayersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PendingAuctionPlayersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PendingAuctionPlayersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
