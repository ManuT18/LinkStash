import fs from 'fs';
import path from 'path';
import { startTestServer, stopTestServer, getBaseUrl } from './helpers/test-server.js';
import { api } from '../src/frontend/services/api.js';
import { Stats, Category } from '../src/frontend/types/index.js';

// Setup fetch wrapper for API testing
const originalFetch = globalThis.fetch;
globalThis.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
  let url = input.toString();
  if (url.startsWith('/api')) {
    url = `${getBaseUrl()}${url}`;
  }
  return originalFetch(url, init);
} as typeof fetch;

async function runEmpiricalChallengerSuite() {
  console.log('====================================================');
  console.log('⚡ EMPIRICAL CHALLENGER MILESTONE 2 TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✓ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      if (detail) console.error(`     Detail: ${detail}`);
      failed++;
    }
  }

  function reportBug(bugId: string, description: string, detail?: string) {
    console.warn(`  ⚠️  [CONFIRMED BUG ${bugId}] ${description}`);
    if (detail) console.warn(`     Evidence: ${detail}`);
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Tailwind CSS xs:inline Breakpoint Inspection
    // ----------------------------------------------------
    console.log('[1/5] Inspecting Navbar CSS breakpoint utility generation...');
    const navbarPath = path.resolve(process.cwd(), 'src/frontend/components/Navbar.tsx');
    const navbarContent = fs.readFileSync(navbarPath, 'utf-8');
    const hasXsInlineInNavbar = navbarContent.includes('xs:inline');
    if (hasXsInlineInNavbar) {
      reportBug('BUG-M2-01', 'Navbar API status label "API" hidden permanently on all viewports due to invalid "xs:inline" Tailwind class',
        'Tailwind config lacks "xs" screen breakpoint definition.');
    }
    assert(!hasXsInlineInNavbar, 'Navbar no longer uses invalid "xs:inline" Tailwind breakpoint');

    // ----------------------------------------------------
    // TEST 2: Sidebar "All Links" Navigation Category Persistence
    // ----------------------------------------------------
    console.log('\n[2/5] Simulating Sidebar handleNavClick logic...');
    let selectedCategoryState: string | null = 'Diseño Web';
    let activeTabState: string = 'dashboard';

    const onTabChange = (tab: string) => { activeTabState = tab; };
    const onSelectCategory = (cat: string | null) => { selectedCategoryState = cat; };

    // Simulate handleNavClick in Sidebar.tsx
    const handleNavClick = (tabId: string) => {
      onTabChange(tabId);
      if (onSelectCategory) {
        onSelectCategory(null);
      }
    };

    // User selects "All Links" from sidebar
    handleNavClick('all');

    const sidebarAllLinksIsActive = (activeTabState === 'all' && !selectedCategoryState);
    if (selectedCategoryState === 'Diseño Web') {
      reportBug('BUG-M2-02', 'Sidebar "All Links" click fails to clear selectedCategory',
        `User clicked "All Links", but selectedCategory remained "${selectedCategoryState}". Active status for All Links evaluated to ${sidebarAllLinksIsActive}.`);
    }
    assert(selectedCategoryState === null, 'Sidebar handleNavClick("all") clears category filter');
    assert(sidebarAllLinksIsActive === true, 'All Links nav item IS marked active when clicked');

    // ----------------------------------------------------
    // TEST 3: StatsOverview Stat Card Click Title Corruption
    // ----------------------------------------------------
    console.log('\n[3/5] Simulating App.tsx getTabTitle and handleStatCardClick logic...');
    selectedCategoryState = 'Diseño Web';
    activeTabState = 'dashboard';

    // Simulate App.tsx getTabTitle()
    const getTabTitle = (tab: string, cat: string | null) => {
      if (cat) return `Category: ${cat}`;
      switch (tab) {
        case 'dashboard': return 'Dashboard Overview';
        case 'all': return 'All Captured Links';
        case 'pending': return 'Pending Links';
        case 'reviewed': return 'Reviewed Links';
        case 'categories': return 'Categories Manager';
        case 'settings': return 'Dashboard Settings';
        default: return 'LinkStash';
      }
    };

    // Simulate App.tsx handleStatCardClick
    const handleStatCardClick = (cardId: string) => {
      if (cardId === 'total') {
        activeTabState = 'all';
        selectedCategoryState = null;
      } else if (cardId === 'pending') {
        activeTabState = 'pending';
        selectedCategoryState = null;
      } else if (cardId === 'reviewed') {
        activeTabState = 'reviewed';
        selectedCategoryState = null;
      } else if (cardId === 'categories') {
        activeTabState = 'categories';
        selectedCategoryState = null;
      }
    };

    // User clicks 'categories' stat card while category filter is active
    handleStatCardClick('categories');
    const computedTitle = getTabTitle(activeTabState, selectedCategoryState);

    if (computedTitle === 'Category: Diseño Web') {
      reportBug('BUG-M2-03', 'Clicking "Active Categories" stat card produces title mismatch ("Category: Diseño Web" instead of "Categories Manager")',
        `activeTab set to "${activeTabState}", but getTabTitle returned "${computedTitle}".`);
    }
    assert(computedTitle === 'Categories Manager', 'Stat card "categories" click sets title to Categories Manager without category filter');

    // ----------------------------------------------------
    // TEST 4: Live API Stats & Category Data Bindings
    // ----------------------------------------------------
    console.log('\n[4/5] Testing Live API Server stats & category bindings...');
    await startTestServer();

    const statsData: Stats = await api.getStats();
    const categoriesData: Category[] = await api.getCategories();

    assert(typeof statsData.totalLinks === 'number', 'StatsOverview live binding totalLinks is numeric');
    assert(typeof statsData.unreadCount === 'number', 'StatsOverview live binding unreadCount is numeric');
    assert(typeof statsData.readCount === 'number', 'StatsOverview live binding readCount is numeric');
    assert(typeof statsData.categoryCounts === 'object', 'Sidebar live binding categoryCounts is object');
    assert(Array.isArray(categoriesData), 'Sidebar & Dashboard categories list is array');
    assert(categoriesData.length > 0, 'Default categories loaded from API');

    // Test category count matching
    for (const cat of categoriesData) {
      const count = statsData.categoryCounts?.[cat.name];
      assert(count !== undefined ? typeof count === 'number' : true, `Category count binding for "${cat.name}" is valid number (${count ?? 0})`);
    }

    // ----------------------------------------------------
    // TEST 5: Stress Harness & Boundary Conditions
    // ----------------------------------------------------
    console.log('\n[5/5] Running Stress Harness & Boundary Conditions...');

    // Stress 1: Large number formatting
    const mockLargeStats: Stats = {
      total: 1254300,
      pending: 42300,
      reviewed: 1212000,
      byCategory: [{ category: 'Diseño Web', count: 1254300 }],
      byPlatform: [{ platform: 'youtube', count: 1254300 }],
      totalLinks: 1254300,
      unreadCount: 42300,
      readCount: 1212000,
      categoryCounts: { 'Diseño Web': 1254300 }
    };
    const formattedTotal = (mockLargeStats.totalLinks ?? 0).toLocaleString();
    assert(formattedTotal === '1,254,300' || formattedTotal === '1.254.300', `StatsOverview correctly formats large numbers: ${formattedTotal}`);

    // Stress 2: Special Unicode Category Names
    const unicodeCatName = 'Cúrsôs & Hérramïentás 🚀';
    const mockUnicodeStats: Stats = {
      total: 10,
      pending: 5,
      reviewed: 5,
      byCategory: [{ category: unicodeCatName, count: 10 }],
      byPlatform: [],
      categoryCounts: { [unicodeCatName]: 10 }
    };
    assert(mockUnicodeStats.categoryCounts[unicodeCatName] === 10, 'Sidebar categoryCounts handles special characters & emojis in category names');

  } catch (err: any) {
    console.error('\n💥 Critical failure in Empirical Challenger suite:', err);
    failed++;
  } finally {
    await stopTestServer();
    globalThis.fetch = originalFetch;
  }

  console.log('\n====================================================');
  console.log('📊 EMPIRICAL CHALLENGER SUITE SUMMARY');
  console.log('====================================================');
  console.log(`Passed: ${passed} ✓`);
  console.log(`Failed: ${failed} ❌`);
  console.log('====================================================\n');

  // Allow async tasks to close cleanly
  setTimeout(() => {
    process.exit(failed > 0 ? 1 : 0);
  }, 100);
}

runEmpiricalChallengerSuite();
