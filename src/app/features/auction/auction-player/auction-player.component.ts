import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { SHARED_FORM_COMPONENTS } from '@shared/forms/form-controls';
import { AuctionPlayerService } from '../services/auction-player.services';
import { ToastService } from '@shared/services/toast.service';

@Component({
  selector: 'app-auction-player',
  
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ...SHARED_FORM_COMPONENTS
  ],
  templateUrl: './auction-player.component.html',
  styleUrl: './auction-player.component.scss'
})
export class AuctionPlayerComponent implements OnInit {
  form!: FormGroup;
  existingImageUrl = '';
  loading = false;
  playerNotFound = false;

  roles = [
    { label: 'Batsman', value: 'batsman' },
    { label: 'Bowler', value: 'bowler' },
    { label: 'All-Rounder', value: 'allrounder' },
    { label: 'Wicket-Keeper', value: 'wicketkeeper' }
  ];

  constructor(
    private fb: FormBuilder,
    private auctionPlayerService: AuctionPlayerService,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    this.InitForm();
  }

  InitForm() {
    this.form = this.fb.group({
      PhotoURL: [null],
      Name: ['', Validators.required],
      DOB: ['', Validators.required],
      FatherName: ['', Validators.required],
      Mobile: ['', Validators.required],
      Email: ['', [Validators.email]],
      Role: ['', Validators.required],
      BasePrice: [0, [Validators.required, Validators.min(0)]],
      Status: ['Active', Validators.required]
    });
  }

  SessionID: Number = 0;
  onSubmit() {
    if (this.form.invalid) {
      this.toast.info('Please fill all required fields correctly.');
      return;
    }

    const payload = this.form.getRawValue();
    payload.SessionID =  1;

    this.auctionPlayerService.create(payload).subscribe({
      next: (data: any) => {
        this.toast.success('Player registered successfully!');
        this.form.reset();
        this.existingImageUrl = '';
      },
      error: (err) => {
        if (err.status === 409 && err.error?.message?.includes('mobile')) {
          this.toast.error('This mobile number is already registered.');
        } else {
          this.toast.error('Failed to register. Please try again.');
        }
        console.error(err);
      }
    });
  }

}
