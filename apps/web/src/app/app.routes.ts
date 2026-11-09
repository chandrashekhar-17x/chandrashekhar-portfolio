import { Routes } from '@angular/router';

// Every page is lazy-loaded so the initial bundle stays small.
// Phase 1 adds /work, /work/:slug, /lab, /graph, /journal, /resume and a 404 page.
export const routes: Routes = [
  {
    path: '',
    title: 'Chandrashekhar — Frontend & AI Engineer',
    loadComponent: () => import('./features/home/home-page').then((m) => m.HomePage),
  },
  { path: '**', redirectTo: '' },
];
