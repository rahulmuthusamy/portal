import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerRegistrationFormComponent } from './player-registration-form.component';

describe('PlayerRegistrationFormComponent', () => {
  let component: PlayerRegistrationFormComponent;
  let fixture: ComponentFixture<PlayerRegistrationFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerRegistrationFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayerRegistrationFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
