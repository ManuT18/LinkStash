import assert from 'assert';
import { apiRequest, resetTestDatabase } from './helpers/test-server';

export async function runTier3Tests(): Promise<{ passed: number; failed: number }> {
  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      passed++;
      console.log(`  ✓ ${name}`);
    } catch (err: any) {
      failed++;
      console.error(`  ✗ ${name}`);
      console.error(`    Error: ${err.message}`);
    }
  }

  console.log('\n--- Tier 3: Cross-Feature Combinations ---');
  await resetTestDatabase();

  await test('Cross-Feature: Create links then filter by category and status combination', async () => {
    // 1. Create link A (Impresión 3D, pending)
    const linkA = (await apiRequest('/api/links', {
      method: 'POST',
      body: { url: 'https://printables.com/model/cross-1', category: 'Impresión 3D' }
    })).data;

    // 2. Create link B (Impresión 3D, reviewed)
    const linkB = (await apiRequest('/api/links', {
      method: 'POST',
      body: { url: 'https://thingiverse.com/thing/cross-2', category: 'Impresión 3D' }
    })).data;
    await apiRequest(`/api/links/${linkB.id}`, { method: 'PATCH', body: { status: 'reviewed' } });

    // 3. Create link C (Diseño Web, pending)
    await apiRequest('/api/links', {
      method: 'POST',
      body: { url: 'https://codepen.io/cross-3', category: 'Diseño Web' }
    });

    // Filter by category='Impresión 3D' AND status='reviewed'
    const res = await apiRequest('/api/links?category=Impresi%C3%B3n%203D&status=reviewed');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.links.length, 1);
    assert.strictEqual(res.data.links[0].id, linkB.id);
  });

  await test('Cross-Feature: Update category keywords then verify auto-categorizer integration', async () => {
    // 1. Get category ID for 'Herramientas'
    const catsRes = await apiRequest('/api/categories');
    const catHerramientas = catsRes.data.find((c: any) => c.name === 'Herramientas');
    assert.ok(catHerramientas);

    // 2. Update keywords to include 'supertool'
    await apiRequest(`/api/categories/${catHerramientas.id}/keywords`, {
      method: 'PUT',
      body: { keywords: ['tool', 'supertool', 'utility'] }
    });

    // 3. Post a link that contains 'supertool' in open-graph/URL or custom category check
    const postRes = await apiRequest('/api/links', {
      method: 'POST',
      body: { url: 'https://github.com/my-supertool-repo' }
    });

    assert.strictEqual(postRes.status, 201);
    // Since title/url contains 'supertool', auto-categorizer should categorize it as 'Herramientas'
    assert.strictEqual(postRes.data.category, 'Herramientas');
  });

  await test('Cross-Feature: Update link status and validate stats update', async () => {
    // 1. Fetch initial stats
    const statsBefore = (await apiRequest('/api/stats')).data;

    // 2. Post new link (pending)
    const newLink = (await apiRequest('/api/links', {
      method: 'POST',
      body: { url: 'https://example.com/status-stats-cross' }
    })).data;

    const statsMid = (await apiRequest('/api/stats')).data;
    assert.strictEqual(statsMid.pending, statsBefore.pending + 1);

    // 3. Update link to reviewed
    await apiRequest(`/api/links/${newLink.id}`, {
      method: 'PATCH',
      body: { status: 'reviewed' }
    });

    const statsAfter = (await apiRequest('/api/stats')).data;
    assert.strictEqual(statsAfter.pending, statsBefore.pending);
    assert.strictEqual(statsAfter.reviewed, statsBefore.reviewed + 1);
  });

  await test('Cross-Feature: Delete link and verify list and stats consistency', async () => {
    // 1. Post link
    const link = (await apiRequest('/api/links', {
      method: 'POST',
      body: { url: 'https://example.com/delete-cross-test' }
    })).data;

    const statsBefore = (await apiRequest('/api/stats')).data;

    // 2. Delete link
    const delRes = await apiRequest(`/api/links/${link.id}`, { method: 'DELETE' });
    assert.strictEqual(delRes.status, 200);

    // 3. Verify link is absent from list
    const listRes = await apiRequest(`/api/links?search=delete-cross-test`);
    assert.strictEqual(listRes.data.links.length, 0);

    // 4. Verify stats total decremented
    const statsAfter = (await apiRequest('/api/stats')).data;
    assert.strictEqual(statsAfter.total, statsBefore.total - 1);
  });

  await test('Cross-Feature: Patch category triggers keyword learning mechanism', async () => {
    // 1. Get 'Cursos' category ID
    const catsRes = await apiRequest('/api/categories');
    const catCursos = catsRes.data.find((c: any) => c.name === 'Cursos');
    assert.ok(catCursos);

    // 2. Create link with unique title word 'masterclassd3'
    const link = (await apiRequest('/api/links', {
      method: 'POST',
      body: { url: 'https://example.com/learning-test-course', category: 'Otros' }
    })).data;

    // Update title of link
    await apiRequest(`/api/links/${link.id}`, {
      method: 'PATCH',
      body: { title: 'Advanced Masterclassd3 Course' }
    });

    // 3. Change category of link to 'Cursos'
    await apiRequest(`/api/links/${link.id}`, {
      method: 'PATCH',
      body: { category: 'Cursos' }
    });

    // 4. Check if 'masterclassd3' was learned into 'Cursos' keywords
    const catsUpdated = (await apiRequest('/api/categories')).data;
    const updatedCursos = catsUpdated.find((c: any) => c.id === catCursos.id);
    assert.ok(updatedCursos.keywords.includes('masterclassd3'));
  });

  return { passed, failed };
}
