import assert from 'assert';
import { apiRequest, resetTestDatabase } from './helpers/test-server';

export async function runTier2Tests(): Promise<{ passed: number; failed: number }> {
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

  console.log('\n--- Tier 2: Boundary & Corner Cases ---');
  await resetTestDatabase();

  await test('Boundary: Empty lists when query matches nothing', async () => {
    const res = await apiRequest('/api/links?search=nonexistent_query_xyz_123');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.links.length, 0);
    assert.strictEqual(res.data.total, 0);
    assert.strictEqual(res.data.page, 1);
    assert.strictEqual(res.data.totalPages, 1);
  });

  await test('Boundary: Long search query parameter (500+ chars)', async () => {
    const longQuery = 'a'.repeat(600);
    const res = await apiRequest(`/api/links?search=${longQuery}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.links.length, 0);
    assert.strictEqual(res.data.total, 0);
  });

  await test('Boundary: Missing required URL field on POST /api/links', async () => {
    const resEmpty = await apiRequest('/api/links', {
      method: 'POST',
      body: {}
    });
    assert.strictEqual(resEmpty.status, 400);
    assert.ok(resEmpty.data.error);

    const resNullUrl = await apiRequest('/api/links', {
      method: 'POST',
      body: { url: '' }
    });
    assert.strictEqual(resNullUrl.status, 400);
    assert.ok(resNullUrl.data.error);
  });

  await test('Boundary: Invalid IDs for PATCH /api/links/:id', async () => {
    const resNeg = await apiRequest('/api/links/-1', {
      method: 'PATCH',
      body: { status: 'reviewed' }
    });
    assert.strictEqual(resNeg.status, 404);

    const resStr = await apiRequest('/api/links/not_a_number', {
      method: 'PATCH',
      body: { status: 'reviewed' }
    });
    assert.strictEqual(resStr.status, 404);

    const resOverflow = await apiRequest('/api/links/9999999999', {
      method: 'PATCH',
      body: { status: 'reviewed' }
    });
    assert.strictEqual(resOverflow.status, 404);
  });

  await test('Boundary: Invalid IDs for DELETE /api/links/:id', async () => {
    const resNeg = await apiRequest('/api/links/-5', { method: 'DELETE' });
    assert.strictEqual(resNeg.status, 404);

    const resStr = await apiRequest('/api/links/abc', { method: 'DELETE' });
    assert.strictEqual(resStr.status, 404);
  });

  await test('Boundary: Invalid category ID for PUT /api/categories/:id/keywords', async () => {
    const resNeg = await apiRequest('/api/categories/-1/keywords', {
      method: 'PUT',
      body: { keywords: ['test'] }
    });
    assert.strictEqual(resNeg.status, 404);

    const resStr = await apiRequest('/api/categories/invalid_cat/keywords', {
      method: 'PUT',
      body: { keywords: ['test'] }
    });
    assert.strictEqual(resStr.status, 404);
  });

  await test('Boundary: Zero counts on clean database for GET /api/stats', async () => {
    const res = await apiRequest('/api/stats');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.total, 0);
    assert.strictEqual(res.data.pending, 0);
    assert.strictEqual(res.data.reviewed, 0);
    assert.deepStrictEqual(res.data.byCategory, []);
    assert.deepStrictEqual(res.data.byPlatform, []);
  });

  await test('Boundary: Special characters, SQL injection, and XSS safety', async () => {
    const injectionUrl = "https://example.com/item?q=' OR '1'='1' --";
    const postRes = await apiRequest('/api/links', {
      method: 'POST',
      body: {
        url: injectionUrl,
        category: "Diseño Web' OR '1'='1"
      }
    });
    assert.strictEqual(postRes.status, 201);
    const linkId = postRes.data.id;

    // Search query with SQL injection payload should safely return results without breaking SQL query syntax
    const searchRes = await apiRequest("/api/links?search=' OR '1'='1");
    assert.strictEqual(searchRes.status, 200);

    // Update notes with HTML script tags and Emojis
    const patchRes = await apiRequest(`/api/links/${linkId}`, {
      method: 'PATCH',
      body: { notes: "<script>alert('xss')</script> 🚀🔥" }
    });
    assert.strictEqual(patchRes.status, 200);
    assert.strictEqual(patchRes.data.notes, "<script>alert('xss')</script> 🚀🔥");
  });

  await test('Boundary: Pagination out of bounds and page parameter handling', async () => {
    // Seed 1 link
    await apiRequest('/api/links', {
      method: 'POST',
      body: { url: 'https://example.com/page-boundary-test' }
    });

    const resHighPage = await apiRequest('/api/links?page=9999&limit=10');
    assert.strictEqual(resHighPage.status, 200);
    assert.strictEqual(resHighPage.data.links.length, 0);
    assert.strictEqual(resHighPage.data.page, 9999);
    assert.strictEqual(resHighPage.data.total, 2); // 2 links in db total (including injectionUrl link)
  });

  return { passed, failed };
}
