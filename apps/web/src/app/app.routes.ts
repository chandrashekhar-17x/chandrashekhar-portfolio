import { Routes } from '@angular/router';

// Every page is lazy-loaded so the initial bundle stays small.
// `title` + `data.description` feed SeoTitleStrategy (meta, Open Graph, canonical).
const site = 'Chandrashekhar';

export const routes: Routes = [
  {
    path: '',
    title: `${site} — Frontend & AI Engineer`,
    loadComponent: () => import('./features/home/home-page').then((m) => m.HomePage),
  },
  {
    path: 'work',
    data: {
      description:
        'Projects and case studies: a canvas CAD editor, a PDF rendering engine, data-heavy grids and an AI-native portfolio.',
    },
    title: `Work · ${site}`,
    loadComponent: () => import('./features/work/work-page').then((m) => m.WorkPage),
  },
  {
    path: 'work/:slug',
    data: {
      description:
        "A case study: the problem, the approach, the result and what I'd do differently.",
    },
    title: `Case study · ${site}`,
    loadComponent: () => import('./features/work/project-page').then((m) => m.ProjectPage),
  },
  {
    path: 'lab',
    data: {
      description:
        'The AI Lab: the agents behind this site, model routing and my AI-engineering learning path.',
    },
    title: `AI Lab · ${site}`,
    loadComponent: () => import('./features/lab/lab-page').then((m) => m.LabPage),
  },
  {
    path: 'graph',
    data: {
      description:
        'An interactive knowledge graph of my skills, projects and roles, with an accessible list view.',
    },
    title: `Knowledge graph · ${site}`,
    loadComponent: () => import('./features/graph/graph-page').then((m) => m.GraphPage),
  },
  {
    path: 'journal',
    data: { description: 'Learning in public: notes on Python, FastAPI, RAG and AI agents.' },
    title: `Journal · ${site}`,
    loadComponent: () => import('./features/journal/journal-page').then((m) => m.JournalPage),
  },
  {
    path: 'resume',
    data: {
      description:
        'Resume of Chandrashekhar: frontend and AI engineering experience, skills and selected projects.',
    },
    title: `Resume · ${site}`,
    loadComponent: () => import('./features/resume/resume-page').then((m) => m.ResumePage),
  },
  {
    path: 'recruiter',
    data: {
      description:
        'Chandrashekhar in 30 seconds: role, experience, strongest stack, three best projects and how to reach him.',
    },
    title: `Recruiter view · ${site}`,
    loadComponent: () => import('./features/recruiter/recruiter-page').then((m) => m.RecruiterPage),
  },
  {
    path: '**',
    data: { description: "This page doesn't exist." },
    title: `Not found · ${site}`,
    loadComponent: () => import('./features/not-found/not-found-page').then((m) => m.NotFoundPage),
  },
];
