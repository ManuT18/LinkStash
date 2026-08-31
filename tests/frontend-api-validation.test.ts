import { startTestServer, stopTestServer, getBaseUrl } from './helpers/test-server.js';
import { api } from '../src/frontend/services/api.js';

// Setup node fetch wrapper to resolve relative /api URLs to test server base URL
const originalFetch = globalThis.fetch;
globalThis.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
  let url = input.toString();
  if (url.startsWith('/api')) {
    url = `${getBaseUrl()}${url}`;
  }
  return originalFetch(url, init);
} as typeof fetch;

async function runValidationTests() {
  console.log('====================================================');
  console.log('🧪 Empirical Frontend API Client Validation Suite');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✓ ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ ${testName}`);
      if (detail) console.error(`     Detail: ${detail}`);
      failed++;
    }
  }

  try {
    await startTestServer();
    console.log('✓ Isolated Test Server online at http://localhost:3999\n');

    // ----------------------------------------------------
    // Test 1: getCategories()
    // ----------------------------------------------------
    console.log('[1/7] Testing getCategories()...');
    const categories = await api.getCategories();
    assert(Array.isArray(categories), 'getCategories returns an array');
    assert(categories.length > 0, 'getCategories returns non-empty list of default categories');
    if (categories.length > 0) {
      const cat = categories[0];
      assert(typeof cat.id !== 'undefined', 'Category has id property');
      assert(typeof cat.name === 'string', 'Category has name string');
      assert(typeof cat.emoji === 'string', 'Category has emoji string');
      assert(Array.isArray(cat.keywords), 'Category keywords is an array');
      assert(typeof cat.color === 'string', 'Category has color string');
    }

    // ----------------------------------------------------
    // Test 2: createLink()
    // ----------------------------------------------------
    console.log('\n[2/7] Testing createLink()...');
    const createdLink = await api.createLink({
      url: 'https://react.dev/blog/2026/01/01/test-article',
      category: 'Diseño Web'
    });
    assert(typeof createdLink.id === 'number', 'createLink returns link with numeric id');
    assert(createdLink.url === 'https://react.dev/blog/2026/01/01/test-article', 'createLink URL matches payload');
    assert(createdLink.category === 'Diseño Web', 'createLink category matches custom override');
    assert(createdLink.status === 'pending', 'createLink default status is pending');
    assert(typeof createdLink.created_at === 'string', 'createLink has created_at timestamp');

    // Error handling for missing URL
    let missingUrlError: string | null = null;
    try {
      await api.createLink({ url: '' });
    } catch (err: any) {
      missingUrlError = err.message;
    }
    assert(missingUrlError === 'URL es requerida', 'createLink error handling for missing URL throws "URL es requerida"', `Got: ${missingUrlError}`);

    // ----------------------------------------------------
    // Test 3: getLinks() & Query Parameter Behavior
    // ----------------------------------------------------
    console.log('\n[3/7] Testing getLinks()...');
    const defaultLinks = await api.getLinks();
    assert(Array.isArray(defaultLinks.links), 'getLinks returns links array');
    assert(typeof defaultLinks.total === 'number', 'getLinks returns numeric total');
    assert(defaultLinks.page === 1, 'getLinks default page is 1');
    assert(defaultLinks.totalPages >= 1, 'getLinks totalPages is >= 1');

    // Filter by category
    const filteredCat = await api.getLinks({ category: 'Diseño Web' });
    assert(filteredCat.links.every(l => l.category === 'Diseño Web'), 'getLinks filters by category');

    // Filter by status 'pending'
    const pendingLinks = await api.getLinks({ status: 'pending' });
    assert(pendingLinks.links.every(l => l.status === 'pending'), 'getLinks filters by status "pending"');

    // Empirical Test for PROJECT.md status mismatch ('unread' vs 'pending')
    const unreadLinks = await api.getLinks({ status: 'unread' as any });
    assert(unreadLinks.links.length === 0, 'EMPIRICAL CHECK: getLinks with status "unread" returns 0 results because DB uses "pending"');

    // Pagination test
    const pageLinks = await api.getLinks({ page: 1, limit: 1 });
    assert(pageLinks.links.length <= 1, 'getLinks limit parameter respects limit value');
    assert(pageLinks.page === 1, 'getLinks page parameter matches input');
    assert(pageLinks.totalPages === defaultLinks.total, `getLinks calculates totalPages correctly (${pageLinks.totalPages} vs expected ${defaultLinks.total})`);

    // ----------------------------------------------------
    // Test 4: updateLink()
    // ----------------------------------------------------
    console.log('\n[4/7] Testing updateLink()...');
    const updatedLink = await api.updateLink(createdLink.id, {
      status: 'reviewed',
      notes: 'Reviewed and useful',
      title: 'Updated React Article Title'
    });
    assert(updatedLink.status === 'reviewed', 'updateLink status updated to reviewed');
    assert(updatedLink.notes === 'Reviewed and useful', 'updateLink notes updated');
    assert(updatedLink.title === 'Updated React Article Title', 'updateLink title updated');

    // Update non-existent link
    let update404Error: string | null = null;
    try {
      await api.updateLink(999999, { notes: 'Does not exist' });
    } catch (err: any) {
      update404Error = err.message;
    }
    assert(update404Error === 'Link no encontrado', 'updateLink 404 error handling throws "Link no encontrado"', `Got: ${update404Error}`);

    // ----------------------------------------------------
    // Test 5: updateCategoryKeywords()
    // ----------------------------------------------------
    console.log('\n[5/7] Testing updateCategoryKeywords()...');
    const targetCat = categories[0]; // numeric id
    const kwResult = await api.updateCategoryKeywords(targetCat.id, ['react', 'frontend', 'ui']);
    assert(kwResult.success === true, 'updateCategoryKeywords succeeds with valid numeric ID');

    // Empirical Test for Category Name vs ID discrepancy
    let catNameKwResult = false;
    try {
      const res = await api.updateCategoryKeywords('Diseño Web', ['test']);
      catNameKwResult = res.success;
    } catch (err) {
      catNameKwResult = false;
    }
    assert(catNameKwResult === false, 'EMPIRICAL CHECK: updateCategoryKeywords with string category name fails (returns 404) because DB queries by numeric id column');

    // Test non-array payload error handling
    let nonArrayError: string | null = null;
    try {
      await api.updateCategoryKeywords(targetCat.id, 'invalid' as any);
    } catch (err: any) {
      nonArrayError = err.message;
    }
    assert(nonArrayError === 'Keywords debe ser un arreglo de strings', 'updateCategoryKeywords returns 400 error when payload keywords is not an array', `Got: ${nonArrayError}`);

    // ----------------------------------------------------
    // Test 6: getStats()
    // ----------------------------------------------------
    console.log('\n[6/7] Testing getStats()...');
    const stats = await api.getStats();
    assert(typeof stats.total === 'number', 'getStats has total count');
    assert(typeof stats.pending === 'number', 'getStats has pending count');
    assert(typeof stats.reviewed === 'number', 'getStats has reviewed count');
    assert(Array.isArray(stats.byCategory), 'getStats has byCategory array');
    assert(Array.isArray(stats.byPlatform), 'getStats has byPlatform array');

    // Transformed stats fields (PROJECT.md compatibility)
    assert(stats.totalLinks === stats.total, 'getStats mapped totalLinks matches total');
    assert(stats.unreadCount === stats.pending, 'getStats mapped unreadCount matches pending');
    assert(stats.readCount === stats.reviewed, 'getStats mapped readCount matches reviewed');
    assert(stats.archivedCount === 0, 'getStats mapped archivedCount is 0');
    assert(typeof stats.categoryCounts === 'object', 'getStats mapped categoryCounts is object');
    assert(typeof stats.categoryCounts['Diseño Web'] === 'number', 'getStats categoryCounts contains entry for "Diseño Web"');

    // ----------------------------------------------------
    // Test 7: deleteLink()
    // ----------------------------------------------------
    console.log('\n[7/7] Testing deleteLink()...');
    const deleteRes = await api.deleteLink(createdLink.id);
    assert(deleteRes.success === true, 'deleteLink returns success true for existing link');

    let delete404Error: string | null = null;
    try {
      await api.deleteLink(createdLink.id);
    } catch (err: any) {
      delete404Error = err.message;
    }
    assert(delete404Error === 'Link no encontrado', 'deleteLink returns 404 Error for already deleted link', `Got: ${delete404Error}`);

  } catch (err: any) {
    console.error('\n💥 Critical Error in Validation Suite:', err);
    failed++;
  } finally {
    await stopTestServer();
    globalThis.fetch = originalFetch;
  }

  console.log('\n====================================================');
  console.log('📊 EMPIRICAL VALIDATION SUMMARY');
  console.log('====================================================');
  console.log(`Passed: ${passed} ✓`);
  console.log(`Failed: ${failed} ❌`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runValidationTests();
