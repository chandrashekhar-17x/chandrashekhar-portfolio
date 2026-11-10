// The API builds the same graph in Python (portfolio_api/services/graph.py).
// Both are checked against one expected file, so web and API can't drift apart.
// After a content change: `make graph-fixture`, then commit the JSON.
import expected from '../../../../../api/tests/fixtures/graph.expected.json';
import { buildGraph } from './build-graph';
import { MOCK_GRAPH_INPUT } from './mock-content.repository';

describe('buildGraph parity with the API', () => {
  it('matches apps/api/tests/fixtures/graph.expected.json exactly (order included)', () => {
    expect(buildGraph(MOCK_GRAPH_INPUT)).toEqual(expected);
  });
});
