import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuctionPlayerComponent } from './auction-player.component';

describe('AuctionPlayerComponent', () => {
  let component: AuctionPlayerComponent;
  let fixture: ComponentFixture<AuctionPlayerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuctionPlayerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuctionPlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
