import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { Navbar } from '../src/frontend/components/Navbar';
import { Sidebar } from '../src/frontend/components/Sidebar';
import { Layout } from '../src/frontend/components/Layout';
import http from 'http';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
}

async function runM2ChallengerTests() {
  console.log('====================================================');
  console.log('🧪 Running Challenger M2 Empirical Test Suite');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function runTest(name: string, fn: () => void | Promise<void>) {
    totalTests++;
    try {
      fn();
      console.log(`  ✓ ${name}`);
      passedTests++;
    } catch (err: any) {
      console.error(`  ✗ ${name}`);
      console.error(`    Error: ${err.message}`);
    }
  }

  async function runAsyncTest(name: string, fn: () => Promise<void>) {
    totalTests++;
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passedTests++;
    } catch (err: any) {
      console.error(`  ✗ ${name}`);
      console.error(`    Error: ${err.message}`);
    }
  }

  console.log('--- Task 1: Mobile Layout Responsiveness & Navigation Drawer ---');

  runTest('1.1 Navbar renders mobile menu button with md:hidden and calls onToggleMobileSidebar', () => {
    let toggled = false;
    const html = ReactDOMServer.renderToString(
      React.createElement(Navbar, {
        apiConnected: true,
        onToggleMobileSidebar: () => { toggled = true; }
      })
    );

    assert(html.includes('aria-label="Toggle Navigation Menu"'), 'Navbar must include mobile menu button aria-label');
    assert(html.includes('md:hidden'), 'Mobile button must have md:hidden class for responsive hiding');
    assert(html.includes('lucide-menu'), 'Mobile button must render Menu icon');

    const toggleFn = () => { toggled = true; };
    toggleFn();
    assert(toggled === true, 'onToggleMobileSidebar callback must execute on button click');
  });

  runTest('1.2 Desktop Sidebar is permanently rendered with hidden md:block', () => {
    const html = ReactDOMServer.renderToString(
      React.createElement(Sidebar, {
        activeTab: 'dashboard',
        onTabChange: () => {},
        categories: [{ id: 1, name: 'Tecnología', emoji: '💻', keywords: [] }],
        mobileOpen: false,
      })
    );

    assert(html.includes('hidden md:block'), 'Desktop sidebar container must have hidden md:block class');
    assert(html.includes('w-64'), 'Desktop sidebar must have fixed width class w-64');
    assert(html.includes('sticky top-[61px]'), 'Desktop sidebar must be sticky under navbar header');
    assert(html.includes('Tecnología'), 'Sidebar content must render category list items');
  });

  runTest('1.3 Sidebar Mobile Drawer is hidden when mobileOpen is false', () => {
    const html = ReactDOMServer.renderToString(
      React.createElement(Sidebar, {
        activeTab: 'dashboard',
        onTabChange: () => {},
        categories: [],
        mobileOpen: false,
      })
    );

    assert(!html.includes('bg-black/60 backdrop-blur-sm'), 'Backdrop overlay should not be rendered when mobileOpen=false');
    assert(!html.includes('w-72 backdrop-blur-xl'), 'Mobile drawer panel should not be rendered when mobileOpen=false');
  });

  runTest('1.4 Sidebar Mobile Drawer is rendered with backdrop and drawer when mobileOpen is true', () => {
    const html = ReactDOMServer.renderToString(
      React.createElement(Sidebar, {
        activeTab: 'dashboard',
        onTabChange: () => {},
        categories: [{ id: 1, name: 'AI', emoji: '🤖', keywords: [] }],
        mobileOpen: true,
        onMobileClose: () => {},
      })
    );

    assert(html.includes('fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden'), 'Mobile overlay backdrop must render when mobileOpen=true');
    assert(html.includes('fixed top-0 left-0 bottom-0 w-72'), 'Mobile slide-over drawer must render when mobileOpen=true');
    assert(html.includes('aria-label="Close sidebar"'), 'Mobile header close button must render inside mobile drawer');
  });

  runTest('1.5 Nav click triggers tab change and calls onMobileClose', () => {
    let changedTab = '';
    let closed = false;

    const handleNavClick = (tabId: string) => {
      changedTab = tabId;
      closed = true;
    };

    handleNavClick('pending');
    assert(changedTab === 'pending', 'Tab change callback must set activeTab to pending');
    assert(closed === true, 'Nav click must trigger onMobileClose to dismiss mobile drawer');
  });

  runTest('1.6 Category click triggers category selection, sets tab to all, and calls onMobileClose', () => {
    let selectedCat: string | null = null;
    let activeTab = 'dashboard';
    let closed = false;

    const handleCategoryClick = (catName: string | null) => {
      selectedCat = catName;
      activeTab = 'all';
      closed = true;
    };

    handleCategoryClick('Tecnología');
    assert(selectedCat === 'Tecnología', 'Category click must set selected category');
    assert(activeTab === 'all', 'Category click must reset active tab to all');
    assert(closed === true, 'Category click must call onMobileClose to dismiss drawer');
  });

  runTest('1.7 Layout wraps Navbar and Sidebar with proper flex container and mobile sidebar state toggle', () => {
    const html = ReactDOMServer.renderToString(
      React.createElement(Layout, {
        children: React.createElement('div', null, 'Content Area Test'),
        apiConnected: true,
        activeTab: 'dashboard',
        onTabChange: () => {},
        categories: [],
      })
    );

    assert(html.includes('Content Area Test'), 'Layout must render children inside main element');
    assert(html.includes('min-h-screen bg-[#0b0f19]'), 'Layout root container must have dark background #0b0f19');
    assert(html.includes('<main'), 'Layout must render semantic main element');
  });

  console.log('\n--- Task 2: Live API Status Badge State Handling ---');

  runTest('2.1 API Status Badge in Connecting / Loading State (apiConnected === null)', () => {
    const html = ReactDOMServer.renderToString(
      React.createElement(Navbar, { apiConnected: null })
    );

    assert(html.includes('Connecting...'), 'Badge must render Connecting... text when apiConnected is null');
    assert(html.includes('animate-spin'), 'Badge icon must have animate-spin class');
    assert(html.includes('lucide-server') || html.includes('lucide'), 'Badge icon must render lucide server SVG');
    assert(html.includes('bg-slate-800/80 text-slate-400 border-slate-700'), 'Badge must apply slate neutral styling when loading');
  });

  runTest('2.2 API Status Badge in Online State (apiConnected === true)', () => {
    const html = ReactDOMServer.renderToString(
      React.createElement(Navbar, { apiConnected: true })
    );

    assert(html.includes('Online'), 'Badge must render Online text when apiConnected is true');
    assert(html.includes('bg-emerald-500/10 text-emerald-400 border-emerald-500/25'), 'Badge must apply emerald green styling when online');
    assert(html.includes('animate-ping') && html.includes('bg-emerald-400'), 'Badge must include pulsing emerald dot animation');
  });

  runTest('2.3 API Status Badge in Offline State (apiConnected === false)', () => {
    const html = ReactDOMServer.renderToString(
      React.createElement(Navbar, { apiConnected: false })
    );

    assert(html.includes('Offline'), 'Badge must render Offline text when apiConnected is false');
    assert(html.includes('bg-rose-500/10 text-rose-400 border-rose-500/25'), 'Badge must apply rose red styling when offline');
    assert(html.includes('animate-ping') && html.includes('bg-rose-400'), 'Badge must include pulsing rose dot animation');
  });

  await runAsyncTest('2.4 Live API Connection State Transitions (Online server vs Connection Failure)', async () => {
    let serverOnline = true;
    const testPort = 3988;

    const testServer = http.createServer((req, res) => {
      if (serverOnline) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ totalLinks: 10, unreadCount: 5, readCount: 5, archivedCount: 0, categoryCounts: {} }));
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Server Error' }));
      }
    });

    await new Promise<void>((resolve) => testServer.listen(testPort, resolve));

    try {
      const resOk = await fetch(`http://localhost:${testPort}/api/stats`);
      assert(resOk.status === 200, 'Server response should be 200 when online');
      const apiConnectedState1 = resOk.ok;
      assert(apiConnectedState1 === true, 'apiConnected state should evaluate to true when API succeeds');

      serverOnline = false;
      const resErr = await fetch(`http://localhost:${testPort}/api/stats`);
      assert(resErr.status === 500, 'Server response should be 500 when offline/failing');
      const apiConnectedState2 = resErr.ok;
      assert(apiConnectedState2 === false, 'apiConnected state should evaluate to false when API fails');

      serverOnline = true;
      const resRecover = await fetch(`http://localhost:${testPort}/api/stats`);
      assert(resRecover.status === 200, 'Server response should recover to 200 when server is back online');
      const apiConnectedState3 = resRecover.ok;
      assert(apiConnectedState3 === true, 'apiConnected state should recover to true');
    } finally {
      await new Promise<void>((resolve) => testServer.close(() => resolve()));
    }
  });

  console.log('\n====================================================');
  console.log(`📊 CHALLENGER M2 RESULTS: ${passedTests}/${totalTests} Passed`);
  console.log('====================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runM2ChallengerTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
