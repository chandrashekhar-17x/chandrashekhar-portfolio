import { Project } from '../content/content.types.gen';
import { articleSchema } from './article-schema';

describe('articleSchema', () => {
  it('describes a case study and links its author to the home-page Person', () => {
    const project = {
      slug: 'custom-cad-editor',
      title: 'Custom CAD Viewer & Editor',
      summary: 'Built from zero.',
      tags: ['Three.js', 'WebGL'],
    } as Project;
    expect(articleSchema('https://x.dev', project, '/og/work/custom-cad-editor.jpg')).toMatchObject(
      {
        '@type': 'Article',
        headline: 'Custom CAD Viewer & Editor',
        url: 'https://x.dev/work/custom-cad-editor',
        image: 'https://x.dev/og/work/custom-cad-editor.jpg',
        keywords: 'Three.js, WebGL',
        author: { '@id': 'https://x.dev/#person' },
      },
    );
  });
});
