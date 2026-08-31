import assert from 'assert';
import { apiRequest, resetTestDatabase } from './helpers/test-server';

export async function runTier4Tests(): Promise<{ passed: number; failed: number }> {
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

  console.log('\n--- Tier 4: Real-World Application Scenarios ---');
  await resetTestDatabase();

  await test('Scenario 1: Complete end-to-end user bookmark lifecycle', async () => {
    // Step 1: User ingests bookmarks from web via Dashboard Add Modal
    const post1 = await apiRequest('/api/links', {
      method: 'POST',
      body: { url: 'https://www.youtube.com/watch?v=framer-motion-tutorial', category: 'Diseño Web' }
    });
    assert.strictEqual(post1.status, 201);
    const link1 = post1.data;

    const post2 = await apiRequest('/api/links', {
      method: 'POST',
      body: { url: 'https://printables.com/model/54321-voron-part' }
    });
    assert.strictEqual(post2.status, 201);
    const link2 = post2.data;

    const post3 = await apiRequest('/api/links', {
      method: 'POST',
      body: { url: 'https://github.com/facebook/react', category: 'Programación' }
    });
    assert.strictEqual(post3.status, 201);
    const link3 = post3.data;

    // Step 2: User opens dashboard stats widget
    const stats1 = (await apiRequest('/api/stats')).data;
    assert.strictEqual(stats1.total, 3);
    assert.strictEqual(stats1.pending, 3);
    assert.strictEqual(stats1.reviewed, 0);

    // Step 3: User filters dashboard by 'Diseño Web' category
    const filter1 = (await apiRequest('/api/links?category=Dise%C3%B1o%20Web')).data;
    assert.strictEqual(filter1.links.length, 1);
    assert.strictEqual(filter1.links[0].id, link1.id);

    // Step 4: User watches/reads item and marks as reviewed with notes
    const patch1 = await apiRequest(`/api/links/${link1.id}`, {
      method: 'PATCH',
      body: {
        status: 'reviewed',
        notes: 'Great animation techniques for Framer Motion glass cards!'
      }
    });
    assert.strictEqual(patch1.status, 200);
    assert.strictEqual(patch1.data.status, 'reviewed');
    assert.strictEqual(patch1.data.notes, 'Great animation techniques for Framer Motion glass cards!');

    // Step 5: User searches notes for 'animation'
    const searchRes = (await apiRequest('/api/links?search=animation')).data;
    assert.strictEqual(searchRes.links.length, 1);
    assert.strictEqual(searchRes.links[0].id, link1.id);

    // Step 6: User deletes processed link 3 (React repo)
    const delRes = await apiRequest(`/api/links/${link3.id}`, { method: 'DELETE' });
    assert.strictEqual(delRes.status, 200);
    assert.strictEqual(delRes.data.success, true);

    // Step 7: Final verification of state and stats
    const finalStats = (await apiRequest('/api/stats')).data;
    assert.strictEqual(finalStats.total, 2);
    assert.strictEqual(finalStats.pending, 1);
    assert.strictEqual(finalStats.reviewed, 1);

    const finalLinks = (await apiRequest('/api/links')).data;
    assert.strictEqual(finalLinks.links.length, 2);
  });

  await test('Scenario 2: Bulk link ingestion, pagination, category customization & filtering', async () => {
    await resetTestDatabase();

    // Ingest 25 links across categories
    const categoriesList = ['Diseño Web', 'Impresión 3D', 'Cursos', 'Herramientas', 'Programación'];
    const linksCreated: any[] = [];

    for (let i = 1; i <= 25; i++) {
      const cat = categoriesList[(i - 1) % categoriesList.length];
      const res = await apiRequest('/api/links', {
        method: 'POST',
        body: {
          url: `https://example.com/resource-${i}`,
          category: cat
        }
      });
      assert.strictEqual(res.status, 201);
      linksCreated.push(res.data);
    }

    // Verify stats after bulk ingestion
    const bulkStats = (await apiRequest('/api/stats')).data;
    assert.strictEqual(bulkStats.total, 25);
    assert.strictEqual(bulkStats.pending, 25);

    // Test Pagination: Page 1 (limit 10)
    const page1 = (await apiRequest('/api/links?page=1&limit=10')).data;
    assert.strictEqual(page1.links.length, 10);
    assert.strictEqual(page1.page, 1);
    assert.strictEqual(page1.total, 25);
    assert.strictEqual(page1.totalPages, 3);

    // Test Pagination: Page 2 (limit 10)
    const page2 = (await apiRequest('/api/links?page=2&limit=10')).data;
    assert.strictEqual(page2.links.length, 10);
    assert.strictEqual(page2.page, 2);

    // Test Pagination: Page 3 (limit 10)
    const page3 = (await apiRequest('/api/links?page=3&limit=10')).data;
    assert.strictEqual(page3.links.length, 5);
    assert.strictEqual(page3.page, 3);

    // Bulk review first 5 links
    for (let i = 0; i < 5; i++) {
      await apiRequest(`/api/links/${linksCreated[i].id}`, {
        method: 'PATCH',
        body: { status: 'reviewed' }
      });
    }

    const updatedBulkStats = (await apiRequest('/api/stats')).data;
    assert.strictEqual(updatedBulkStats.total, 25);
    assert.strictEqual(updatedBulkStats.reviewed, 5);
    assert.strictEqual(updatedBulkStats.pending, 20);
  });

  return { passed, failed };
}
