import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
    providedIn: 'root',
})
export class ToastService {
    constructor(private snackBar: MatSnackBar) { }

    success(message: string, action: string = 'OK', duration: number = 3000) {
        this.snackBar.open(message, action, {
            duration,
            panelClass: ['snackbar-success'],
            horizontalPosition: 'right',
            verticalPosition: 'top',
        });
    }

    error(message: string, action: string = 'Close', duration: number = 5000) {
        this.snackBar.open(message, action, {
            duration,
            panelClass: ['snackbar-error'],
            horizontalPosition: 'right',
            verticalPosition: 'top',
        });
    }

    info(message: string, action: string = '', duration: number = 3000) {
        this.snackBar.open(message, action, {
            duration,
            panelClass: ['snackbar-info'],
            horizontalPosition: 'right',
            verticalPosition: 'top',
        });
    }
}
