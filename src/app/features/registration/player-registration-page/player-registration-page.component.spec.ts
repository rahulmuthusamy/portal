import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerRegistrationPageComponent } from './player-registration-page.component';

describe('PlayerRegistrationPageComponent', () => {
  let component: PlayerRegistrationPageComponent;
  let fixture: ComponentFixture<PlayerRegistrationPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerRegistrationPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayerRegistrationPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
