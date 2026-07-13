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

  it('should populate the form from an existing profile when a matching phone number is entered', () => {
    component.existingPlayers = [{
      Name: 'Ravi Kumar',
      FatherName: 'Suresh Kumar',
      DOB: '1995-01-20',
      Mobile: '9876543210',
      Role: 'Batsman',
      BattingStyle: 'Right-hand bat',
      BowlingStyle: 'Right-arm medium',
      JerseySize: 'M'
    }] as any;

    component.lookupExistingPlayer('9876543210');

    expect(component.playerRegForm.playerName).toBe('Ravi Kumar');
    expect(component.playerRegForm.fatherName).toBe('Suresh Kumar');
    expect(component.playerRegForm.dob).toBe('1995-01-20');
    expect(component.playerRegForm.role).toBe('Batsman');
    expect(component.lookupMessage).toContain('found');
  });
});
