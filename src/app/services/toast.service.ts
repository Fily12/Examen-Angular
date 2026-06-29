import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private counter = 0;

  success(message: string): void { this.add('success', message); }
  error(message: string): void   { this.add('error', message); }
  info(message: string): void    { this.add('info', message); }

  private add(type: Toast['type'], message: string): void {
    const id = ++this.counter;
    this.toasts.update(list => {
      const updated = [...list, { id, type, message }];
      return updated.length > 3 ? updated.slice(updated.length - 3) : updated;
    });
    setTimeout(() => this.remove(id), 4000);
  }

  remove(id: number): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}
