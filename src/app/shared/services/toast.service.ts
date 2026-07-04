import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import Swal from 'sweetalert2';

@Injectable({
    providedIn: 'root',
})
export class ToastService {
    constructor(private snackBar: MatSnackBar) { }

    success(message: string, action: string = 'OK', duration: number = 3000) {
        Swal.fire({
            title: 'Success!',
            text: message,
            icon: 'success',
            confirmButtonColor: '#0ea5e9',
        });
    }

    error(message: string, action: string = 'Close', duration: number = 5000) {
        Swal.fire({
            title: 'Error!',
            text: message,
            icon: 'error',
            confirmButtonColor: '#0ea5e9',
        });
    }

    info(message: string, action: string = '', duration: number = 3000) {
        Swal.fire({
            title: 'Info!',
            text: message,
            icon: 'info',
            confirmButtonColor: '#0ea5e9',
        });
    }
}
