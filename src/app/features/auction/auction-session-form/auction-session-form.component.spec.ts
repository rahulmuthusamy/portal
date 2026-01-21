import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuctionSessionFormComponent } from './auction-session-form.component';

describe('AuctionSessionFormComponent', () => {
  let component: AuctionSessionFormComponent;
  let fixture: ComponentFixture<AuctionSessionFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuctionSessionFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuctionSessionFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
