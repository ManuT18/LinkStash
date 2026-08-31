import assert from 'assert';
import { apiRequest, resetTestDatabase } from './helpers/test-server';

export async function runTier1Tests(): Promise<{ passed: number; failed: number }> {
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

  console.log('\n--- Tier 1: Feature Coverage ---');

  // Reset database before starting Tier 1
  await resetTestDatabase();

  // ==========================================
  // Feature 1: GET /api/links (6 tests)
  // ==========================================
  console.log('\n  [Feature 1: GET /api/links]');

  await test('GET /api/links - default response structure', async () => {
    const res = await apiRequest('/api/links');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data.links));
    assert.strictEqual(typeof res.data.total, 'number');
    assert.strictEqual(typeof res.data.page, 'number');
    assert.strictEqual(typeof res.data.totalPages, 'number');
  });

  // Seed sample data for testing filters
  let createdLink1: any;
  let createdLink2: any;
  let createdLink3: any;

  await test('POST sample links for GET filtering tests', async () => {
    const r1 = await apiRequest('/api/links', {
      method: 'POST',
      body: { url: 'https://youtube.com/watch?v=react1', category: 'Diseño Web' }
    });
    createdLink1 = r1.data;

    const r2 = await apiRequest('/api/links', {
      method: 'POST',
      body: { url: 'https://tiktok.com/@user/video/3dprint', category: 'Impresión 3D' }
    });
    createdLink2 = r2.data;

    const r3 = await apiRequest('/api/links', {
      method: 'POST',
      body: { url: 'https://github.com/expressjs/express', category: 'Programación' }
    });
    createdLink3 = r3.data;

    assert.ok(createdLink1.id);
    assert.ok(createdLink2.id);
    assert.ok(createdLink3.id);
  });

  await test('GET /api/links - filter by category', async () => {
    const res = await apiRequest('/api/links?category=Impresión%203D');
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.links.every((l: any) => l.category === 'Impresión 3D'));
    assert.strictEqual(res.data.links.length, 1);
    assert.strictEqual(res.data.links[0].id, createdLink2.id);
  });

  await test('GET /api/links - filter by status', async () => {
    // Update link1 status to reviewed
    await apiRequest(`/api/links/${createdLink1.id}`, {
      method: 'PATCH',
      body: { status: 'reviewed' }
    });

    const resPending = await apiRequest('/api/links?status=pending');
    assert.strictEqual(resPending.status, 200);
    assert.ok(resPending.data.links.every((l: any) => l.status === 'pending'));

    const resReviewed = await apiRequest('/api/links?status=reviewed');
    assert.strictEqual(resReviewed.status, 200);
    assert.ok(resReviewed.data.links.every((l: any) => l.status === 'reviewed'));
    assert.strictEqual(resReviewed.data.links[0].id, createdLink1.id);
  });

  await test('GET /api/links - filter by platform', async () => {
    const res = await apiRequest('/api/links?platform=youtube');
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.links.every((l: any) => l.platform === 'youtube'));
    assert.strictEqual(res.data.links.length, 1);
  });

  await test('GET /api/links - search term query', async () => {
    const res = await apiRequest('/api/links?search=express');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.links.length, 1);
    assert.strictEqual(res.data.links[0].id, createdLink3.id);
  });

  await test('GET /api/links - pagination limits and pages', async () => {
    const resPage1 = await apiRequest('/api/links?page=1&limit=2');
    assert.strictEqual(resPage1.status, 200);
    assert.strictEqual(resPage1.data.links.length, 2);
    assert.strictEqual(resPage1.data.page, 1);
    assert.strictEqual(resPage1.data.total, 3);
    assert.strictEqual(resPage1.data.totalPages, 2);

    const resPage2 = await apiRequest('/api/links?page=2&limit=2');
    assert.strictEqual(resPage2.status, 200);
    assert.strictEqual(resPage2.data.links.length, 1);
    assert.strictEqual(resPage2.data.page, 2);
  });

  // ==========================================
  // Feature 2: POST /api/links (6 tests)
  // ==========================================
  console.log('\n  [Feature 2: POST /api/links]');

  await test('POST /api/links - create valid link', async () => {
    const res = await apiRequest('/api/links', {
      method: 'POST',
      body: { url: 'https://printables.com/model/123-cool-mesh' }
    });
    assert.strictEqual(res.status, 201);
    assert.ok(res.data.id);
    assert.strictEqual(res.data.url, 'https://printables.com/model/123-cool-mesh');
    assert.strictEqual(res.data.status, 'pending');
  });

  await test('POST /api/links - custom category override', async () => {
    const res = await apiRequest('/api/links', {
      method: 'POST',
      body: { url: 'https://dribbble.com/shots/456', category: 'Cursos' }
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.category, 'Cursos');
  });

  await test('POST /api/links - missing URL returns 400', async () => {
    const res = await apiRequest('/api/links', {
      method: 'POST',
      body: { category: 'Programación' }
    });
    assert.strictEqual(res.status, 400);
    assert.ok(res.data.error);
  });

  await test('POST /api/links - platform detection for TikTok', async () => {
    const res = await apiRequest('/api/links', {
      method: 'POST',
      body: { url: 'https://www.tiktok.com/@creator/video/987654' }
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.platform, 'tiktok');
  });

  await test('POST /api/links - auto categorizes Printables to Impresión 3D', async () => {
    const res = await apiRequest('/api/links', {
      method: 'POST',
      body: { url: 'https://thingiverse.com/thing:9999' }
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.category, 'Impresión 3D');
  });

  await test('POST /api/links - duplicate URL error handling', async () => {
    const res = await apiRequest('/api/links', {
      method: 'POST',
      body: { url: 'https://thingiverse.com/thing:9999' }
    });
    assert.strictEqual(res.status, 500);
    assert.ok(res.data.error);
  });

  // ==========================================
  // Feature 3: PATCH /api/links/:id (6 tests)
  // ==========================================
  console.log('\n  [Feature 3: PATCH /api/links/:id]');

  let linkToPatch: any;
  await test('Setup link for PATCH tests', async () => {
    const res = await apiRequest('/api/links', {
      method: 'POST',
      body: { url: 'https://example.com/patch-test', category: 'Otros' }
    });
    linkToPatch = res.data;
    assert.ok(linkToPatch.id);
  });

  await test('PATCH /api/links/:id - update status to reviewed', async () => {
    const res = await apiRequest(`/api/links/${linkToPatch.id}`, {
      method: 'PATCH',
      body: { status: 'reviewed' }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.status, 'reviewed');
    assert.ok(res.data.reviewed_at);
  });

  await test('PATCH /api/links/:id - update category', async () => {
    const res = await apiRequest(`/api/links/${linkToPatch.id}`, {
      method: 'PATCH',
      body: { category: 'Herramientas' }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.category, 'Herramientas');
  });

  await test('PATCH /api/links/:id - update notes', async () => {
    const res = await apiRequest(`/api/links/${linkToPatch.id}`, {
      method: 'PATCH',
      body: { notes: 'Great utility for project setup' }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.notes, 'Great utility for project setup');
  });

  await test('PATCH /api/links/:id - update title and url', async () => {
    const res = await apiRequest(`/api/links/${linkToPatch.id}`, {
      method: 'PATCH',
      body: { title: 'Updated Title', url: 'https://example.com/updated-url' }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.title, 'Updated Title');
    assert.strictEqual(res.data.url, 'https://example.com/updated-url');
  });

  await test('PATCH /api/links/:id - return 404 for non-existent ID', async () => {
    const res = await apiRequest('/api/links/999999', {
      method: 'PATCH',
      body: { status: 'reviewed' }
    });
    assert.strictEqual(res.status, 404);
    assert.ok(res.data.error);
  });

  await test('PATCH /api/links/:id - empty body returns current object', async () => {
    const res = await apiRequest(`/api/links/${linkToPatch.id}`, {
      method: 'PATCH',
      body: {}
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.id, linkToPatch.id);
  });

  // ==========================================
  // Feature 4: DELETE /api/links/:id (5 tests)
  // ==========================================
  console.log('\n  [Feature 4: DELETE /api/links/:id]');

  let linkToDelete: any;
  await test('Setup link for DELETE tests', async () => {
    const res = await apiRequest('/api/links', {
      method: 'POST',
      body: { url: 'https://example.com/delete-test' }
    });
    linkToDelete = res.data;
    assert.ok(linkToDelete.id);
  });

  await test('DELETE /api/links/:id - delete existing link', async () => {
    const res = await apiRequest(`/api/links/${linkToDelete.id}`, {
      method: 'DELETE'
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
  });

  await test('DELETE /api/links/:id - return 404 for non-existent link', async () => {
    const res = await apiRequest('/api/links/999999', {
      method: 'DELETE'
    });
    assert.strictEqual(res.status, 404);
    assert.ok(res.data.error);
  });

  await test('DELETE /api/links/:id - verified removed from GET /api/links', async () => {
    const res = await apiRequest('/api/links?search=delete-test');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.links.length, 0);
  });

  await test('DELETE /api/links/:id - re-deleting same ID returns 404', async () => {
    const res = await apiRequest(`/api/links/${linkToDelete.id}`, {
      method: 'DELETE'
    });
    assert.strictEqual(res.status, 404);
  });

  await test('DELETE /api/links/:id - non-numeric ID returns 404', async () => {
    const res = await apiRequest('/api/links/invalid_id_str', {
      method: 'DELETE'
    });
    assert.strictEqual(res.status, 404);
  });

  // ==========================================
  // Feature 5: GET /api/categories (5 tests)
  // ==========================================
  console.log('\n  [Feature 5: GET /api/categories]');

  await test('GET /api/categories - returns status 200 and category list', async () => {
    const res = await apiRequest('/api/categories');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data));
    assert.ok(res.data.length >= 7);
  });

  await test('GET /api/categories - schema validation', async () => {
    const res = await apiRequest('/api/categories');
    const cat = res.data[0];
    assert.ok(cat.id !== undefined);
    assert.ok(typeof cat.name === 'string');
    assert.ok(typeof cat.emoji === 'string');
    assert.ok(Array.isArray(cat.keywords));
    assert.ok(typeof cat.color === 'string');
  });

  await test('GET /api/categories - default categories present', async () => {
    const res = await apiRequest('/api/categories');
    const names = res.data.map((c: any) => c.name);
    assert.ok(names.includes('Diseño Web'));
    assert.ok(names.includes('Impresión 3D'));
    assert.ok(names.includes('Programación'));
    assert.ok(names.includes('Otros'));
  });

  await test('GET /api/categories - keywords parsed as string array', async () => {
    const res = await apiRequest('/api/categories');
    const diseno = res.data.find((c: any) => c.name === 'Diseño Web');
    assert.ok(diseno);
    assert.ok(Array.isArray(diseno.keywords));
    assert.ok(diseno.keywords.includes('css'));
    assert.ok(diseno.keywords.includes('tailwind'));
  });

  await test('GET /api/categories - json response header', async () => {
    const res = await apiRequest('/api/categories');
    const contentType = res.headers.get('content-type') || '';
    assert.ok(contentType.includes('application/json'));
  });

  // ==========================================
  // Feature 6: PUT /api/categories/:id/keywords (5 tests)
  // ==========================================
  console.log('\n  [Feature 6: PUT /api/categories/:id/keywords]');

  let targetCat: any;
  await test('Fetch category for keywords update', async () => {
    const res = await apiRequest('/api/categories');
    targetCat = res.data.find((c: any) => c.name === 'Cursos');
    assert.ok(targetCat);
  });

  await test('PUT /api/categories/:id/keywords - update keywords successfully', async () => {
    const res = await apiRequest(`/api/categories/${targetCat.id}/keywords`, {
      method: 'PUT',
      body: { keywords: ['course', 'tutorial', 'udemy', 'coursera'] }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
  });

  await test('PUT /api/categories/:id/keywords - return 404 for non-existent category', async () => {
    const res = await apiRequest('/api/categories/999999/keywords', {
      method: 'PUT',
      body: { keywords: ['test'] }
    });
    assert.strictEqual(res.status, 404);
    assert.ok(res.data.error);
  });

  await test('PUT /api/categories/:id/keywords - return 400 for non-array keywords', async () => {
    const res = await apiRequest(`/api/categories/${targetCat.id}/keywords`, {
      method: 'PUT',
      body: { keywords: 'not-an-array' }
    });
    assert.strictEqual(res.status, 400);
    assert.ok(res.data.error);
  });

  await test('PUT /api/categories/:id/keywords - deduplication & normalization', async () => {
    const res = await apiRequest(`/api/categories/${targetCat.id}/keywords`, {
      method: 'PUT',
      body: { keywords: ['UDEMY ', 'udemy', ' Coursera', ''] }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);

    const getRes = await apiRequest('/api/categories');
    const updatedCat = getRes.data.find((c: any) => c.id === targetCat.id);
    assert.deepStrictEqual(updatedCat.keywords, ['udemy', 'coursera']);
  });

  await test('PUT /api/categories/:id/keywords - persistence verified in categories API', async () => {
    await apiRequest(`/api/categories/${targetCat.id}/keywords`, {
      method: 'PUT',
      body: { keywords: ['masterclass', 'bootcamp', 'lecture'] }
    });

    const getRes = await apiRequest('/api/categories');
    const updatedCat = getRes.data.find((c: any) => c.id === targetCat.id);
    assert.deepStrictEqual(updatedCat.keywords, ['masterclass', 'bootcamp', 'lecture']);
  });

  // ==========================================
  // Feature 7: GET /api/stats (6 tests)
  // ==========================================
  console.log('\n  [Feature 7: GET /api/stats]');

  await test('GET /api/stats - returns valid schema structure', async () => {
    const res = await apiRequest('/api/stats');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(typeof res.data.total, 'number');
    assert.strictEqual(typeof res.data.pending, 'number');
    assert.strictEqual(typeof res.data.reviewed, 'number');
    assert.ok(Array.isArray(res.data.byCategory));
    assert.ok(Array.isArray(res.data.byPlatform));
  });

  await test('GET /api/stats - total matches sum of pending and reviewed', async () => {
    const res = await apiRequest('/api/stats');
    assert.strictEqual(res.data.total, res.data.pending + res.data.reviewed);
  });

  await test('GET /api/stats - category breakdown accuracy', async () => {
    const res = await apiRequest('/api/stats');
    const categorySum = res.data.byCategory.reduce((acc: number, item: any) => acc + item.count, 0);
    assert.strictEqual(res.data.total, categorySum);
  });

  await test('GET /api/stats - platform breakdown accuracy', async () => {
    const res = await apiRequest('/api/stats');
    const platformSum = res.data.byPlatform.reduce((acc: number, item: any) => acc + item.count, 0);
    assert.strictEqual(res.data.total, platformSum);
  });

  await test('GET /api/stats - updates on link creation and status patch', async () => {
    const initialStats = (await apiRequest('/api/stats')).data;

    const newLink = await apiRequest('/api/links', {
      method: 'POST',
      body: { url: 'https://instagram.com/p/stats-test-123' }
    });

    const updatedStats1 = (await apiRequest('/api/stats')).data;
    assert.strictEqual(updatedStats1.total, initialStats.total + 1);
    assert.strictEqual(updatedStats1.pending, initialStats.pending + 1);

    await apiRequest(`/api/links/${newLink.data.id}`, {
      method: 'PATCH',
      body: { status: 'reviewed' }
    });

    const updatedStats2 = (await apiRequest('/api/stats')).data;
    assert.strictEqual(updatedStats2.total, updatedStats1.total);
    assert.strictEqual(updatedStats2.reviewed, initialStats.reviewed + 1);
    assert.strictEqual(updatedStats2.pending, initialStats.pending);
  });

  await test('GET /api/stats - zero counts on clean database', async () => {
    await resetTestDatabase();
    const res = await apiRequest('/api/stats');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.total, 0);
    assert.strictEqual(res.data.pending, 0);
    assert.strictEqual(res.data.reviewed, 0);
    assert.strictEqual(res.data.byCategory.length, 0);
    assert.strictEqual(res.data.byPlatform.length, 0);
  });

  return { passed, failed };
}
