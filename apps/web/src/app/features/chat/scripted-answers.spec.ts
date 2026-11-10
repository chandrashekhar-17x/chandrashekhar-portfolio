import { firstValueFrom } from 'rxjs';

import { MockContentRepository } from '../../core/content/mock-content.repository';
import {
  FALLBACK_ANSWER,
  SCRIPTED_ANSWERS,
  SUGGESTED_QUESTIONS,
  pickAnswer,
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
