import { firstValueFrom } from 'rxjs';

import {
  MOCK_GRAPH_INPUT,
  MockContentRepository,
} from '../../core/content/mock-content.repository';
import { buildGraph } from '../../core/content/build-graph';
import {
  FALLBACK_ANSWER,
  SCRIPTED_ANSWERS,
  SUGGESTED_QUESTIONS,
  pickAnswer,
  projectAnswer,
} from './scripted-answers';

describe('scripted answers', () => {
  it('every citation is a real knowledge-graph node (no drift from content)', async () => {
    const graph = await firstValueFrom(new MockContentRepository().graph());
    const ids = new Set(graph.nodes.map((n) => n.id));
    for (const a of SCRIPTED_ANSWERS) {
      for (const c of a.citations)
        expect(ids.has(c), `${c} in "${a.text.slice(0, 30)}"`).toBe(true);
    }
  });

  it('routes the suggested questions to sensible answers', () => {
    expect(pickAnswer('Who is Chandrashekhar?').intent).toBe('about');
    expect(pickAnswer('Tell me about the CAD editor').citations).toContain(
      'project:custom-cad-editor',
    );
    expect(pickAnswer('Does he fit an Angular + AI role? (JD match)').intent).toBe('jd_match');
    for (const q of SUGGESTED_QUESTIONS) expect(pickAnswer(q)).not.toBe(FALLBACK_ANSWER);
  });

  it('says "I don\'t know" instead of guessing', () => {
    const a = pickAnswer('Does he know Rust and Kubernetes?');
    expect(a).toBe(FALLBACK_ANSWER);
    expect(a.citations).toEqual([]);
  });
});

describe('project questions', () => {
  const projects = MOCK_GRAPH_INPUT.projects;
  const nodeIds = new Set(buildGraph(MOCK_GRAPH_INPUT).nodes.map((n) => n.id));

  it('every case study gets its own answer, citing real graph nodes', () => {
    for (const p of projects) {
      const a = pickAnswer(`Tell me about ${p.title}`, projects);
      expect(a.intent, p.title).toBe('project');
      expect(a.text).toContain(p.summary.slice(0, 30));
      expect(a.urls).toEqual([`/work/${p.slug}`]);
      expect(
        a.citations.filter((id) => !nodeIds.has(id)),
        p.title,
      ).toEqual([]);
    }
  });

  it('prefers the longest title that matches', () => {
    const a = projectAnswer('what about the cad playground (public demo)?', projects);
    expect(a?.urls).toEqual(['/work/cad-playground']);
  });

  it('leaves other questions to the keyword answers', () => {
    expect(projectAnswer('What are his key skills?', projects)).toBeNull();
  });
});
