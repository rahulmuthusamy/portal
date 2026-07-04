import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnerRegistrationPageComponent } from './owner-registration-page.component';

describe('OwnerRegistrationPageComponent', () => {
  let component: OwnerRegistrationPageComponent;
  let fixture: ComponentFixture<OwnerRegistrationPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnerRegistrationPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OwnerRegistrationPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
