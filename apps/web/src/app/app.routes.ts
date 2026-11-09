import { Routes } from '@angular/router';

// Every page is lazy-loaded so the initial bundle stays small.
// `title` is the browser tab title; the SEO service (PR 8) adds meta tags per route.
const site = 'Chandrashekhar';

export const routes: Routes = [
  {
    path: '',
    title: `${site} — Frontend & AI Engineer`,
    loadComponent: () => import('./features/home/home-page').then((m) => m.HomePage),
  },
  {
    path: 'work',
    title: `Work · ${site}`,
    loadComponent: () => import('./features/work/work-page').then((m) => m.WorkPage),
  },
  {
    path: 'work/:slug',
    title: `Case study · ${site}`,
    loadComponent: () => import('./features/work/project-page').then((m) => m.ProjectPage),
  },
  {
    path: 'lab',
    title: `AI Lab · ${site}`,
    loadComponent: () => import('./features/lab/lab-page').then((m) => m.LabPage),
  },
  {
    path: 'graph',
    title: `Knowledge graph · ${site}`,
    loadComponent: () => import('./features/graph/graph-page').then((m) => m.GraphPage),
  },
  {
    path: 'journal',
    title: `Journal · ${site}`,
    loadComponent: () => import('./features/journal/journal-page').then((m) => m.JournalPage),
  },
  {
    path: 'resume',
    title: `Resume · ${site}`,
    loadComponent: () => import('./features/resume/resume-page').then((m) => m.ResumePage),
  },
  {
    path: '**',
    title: `Not found · ${site}`,
    loadComponent: () => import('./features/not-found/not-found-page').then((m) => m.NotFoundPage),
  },
];
