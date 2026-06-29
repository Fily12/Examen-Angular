import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'phoneFormat', standalone: true })
export class PhoneFormatPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return value;
    // Format international +2217XXXXXXXX → +221 77 XXX XX XX
    if (value.startsWith('+221') && value.length === 12) {
      const local = value.slice(4); // 7XXXXXXXX
      return `+221 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5, 7)} ${local.slice(7, 9)}`;
    }
    // Format local 7XXXXXXXX (9 chiffres)
    if (value.length === 9 && value.startsWith('7')) {
      return `+221 ${value.slice(0, 2)} ${value.slice(2, 5)} ${value.slice(5, 7)} ${value.slice(7, 9)}`;
    }
    return value;
  }
}
