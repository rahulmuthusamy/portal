import {
    Directive,
    HostListener,
    forwardRef
} from '@angular/core';
import {
    AbstractControl,
    NG_VALIDATORS,
    ValidationErrors,
    Validator
} from '@angular/forms';

@Directive({
    selector: '[appPhoneNumber]',
    standalone: true,
    providers: [
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => PhoneNumberDirective),
            multi: true
        }
    ]
})
export class PhoneNumberDirective implements Validator {

    validate(control: AbstractControl): ValidationErrors | null {
        const value = control.value;

        if (!value) {
            return null;
        }

        return /^[6-9]\d{9}$/.test(value)
            ? null
            : { invalidPhoneNumber: true };
    }

    @HostListener('input', ['$event'])
    onInput(event: Event): void {
        const input = event.target as HTMLInputElement;

        input.value = input.value.replace(/\D/g, '').slice(0, 10);
    }
}