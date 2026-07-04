import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DateAndTimeComponent } from './dateandtime.component';

describe('DateAndTimeComponent', () => {
  let component: DateAndTimeComponent;
  let fixture: ComponentFixture<DateAndTimeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateAndTimeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DateAndTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
