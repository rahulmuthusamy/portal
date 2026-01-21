import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DateandtimeComponent } from './dateandtime.component';

describe('DateandtimeComponent', () => {
  let component: DateandtimeComponent;
  let fixture: ComponentFixture<DateandtimeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateandtimeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DateandtimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
