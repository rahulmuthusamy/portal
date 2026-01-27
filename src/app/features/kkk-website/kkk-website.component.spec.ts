import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KkkWebsiteComponent } from './kkk-website.component';

describe('KkkWebsiteComponent', () => {
  let component: KkkWebsiteComponent;
  let fixture: ComponentFixture<KkkWebsiteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KkkWebsiteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KkkWebsiteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
