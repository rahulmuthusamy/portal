import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuctionRoomComponent } from './auction-room.component';

describe('AuctionRoomComponent', () => {
  let component: AuctionRoomComponent;
  let fixture: ComponentFixture<AuctionRoomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuctionRoomComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuctionRoomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
