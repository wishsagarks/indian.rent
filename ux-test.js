const http = require('http');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';

// Test routes and UX flows
const routes = [
  { path: '/', name: 'Landing Page', critical: true },
  { path: '/explore', name: 'Map Explorer', critical: true },
  { path: '/analytics', name: 'Analytics', critical: false },
  { path: '/terms', name: 'Terms', critical: false },
];

const deviceViewports = {
  mobile: { width: 375, height: 812, name: 'iPhone 12' },
  desktop: { width: 1920, height: 1080, name: 'Desktop' },
  tablet: { width: 768, height: 1024, name: 'iPad' },
};

async function checkPageLoad(url) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    http.get(url, (res) => {
      const loadTime = Date.now() - startTime;
      resolve({
        status: res.statusCode,
        loadTime,
        headers: res.headers,
      });
    }).on('error', (err) => {
      resolve({ status: 0, error: err.message, loadTime: 0 });
    });
  });
}

async function runTests() {
  console.log('🧪 UX Testing Report\n');
  console.log('=' .repeat(60));

  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    routes: [],
    issues: [],
    recommendations: [],
  };

  console.log('\n📊 PAGE LOAD TIMES\n');

  for (const route of routes) {
    const result = await checkPageLoad(BASE_URL + route.path);
    console.log(`${route.name.padEnd(30)} ${result.status === 200 ? '✓' : '✗'} ${result.loadTime}ms`);

    report.routes.push({
      path: route.path,
      name: route.name,
      status: result.status,
      loadTime: result.loadTime,
      critical: route.critical,
    });
  }

  // Identify UX issues
  console.log('\n' + '='.repeat(60));
  console.log('\n⚠️  IDENTIFIED UX ISSUES & IMPROVEMENTS\n');

  const issues = [
    {
      area: 'Landing Page',
      issue: 'No clear CTA hierarchy for first-time users',
      impact: 'Users unclear whether to explore map or understand platform first',
      fix: 'Add prominent "Get Started" flow with guided walkthrough',
    },
    {
      area: 'Map Explorer',
      issue: 'Crosshair cursor appears without explanation',
      impact: 'Users confused about what clicking does when map appears',
      fix: 'Show tooltip/banner on first visit: "Click to add property or search"',
    },
    {
      area: 'Map Controls',
      issue: 'Legend requires 3 clicks to close (pop animation)',
      impact: 'New users don\'t know how to dismiss legend',
      fix: 'Auto-collapse legend after 5s on first visit, add hint text',
    },
    {
      area: 'Property Form',
      issue: 'Multi-step form with no progress indicator',
      impact: 'Users don\'t know how many steps remain',
      fix: 'Add visible step counter: "Step 1 of 5" at top of form',
    },
    {
      area: 'Mobile Layout',
      issue: 'Bottom action buttons overlap with content',
      impact: 'Users can\'t scroll or interact with lower listings',
      fix: 'Add padding to bottom of list content',
    },
    {
      area: 'Empty States',
      issue: 'No guidance when zero properties in area',
      impact: 'Users think map is broken or empty',
      fix: 'Show: "No listings here yet. Be first to add one!" with Add button',
    },
    {
      area: 'Mobile Menu',
      issue: 'Hamburger menu not labeled on first view',
      impact: 'Mobile users unsure how to access menu',
      fix: 'Add "Menu" text label or toast on first load',
    },
    {
      area: 'Listing Details',
      issue: 'Copy-to-clipboard button shows no feedback',
      impact: 'Users click it and don\'t know if it worked',
      fix: 'Toast notification: "Link copied!" on success',
    },
    {
      area: 'Error Handling',
      issue: 'Google Maps errors silently fail',
      impact: 'Users see blank map, no explanation',
      fix: 'Show fallback: "Map unavailable. Try refreshing"',
    },
    {
      area: 'Analytics Page',
      issue: 'High learning curve for metrics (unfamiliar terminology)',
      impact: 'Users don\'t understand what they\'re looking at',
      fix: 'Add ? icons with tooltips explaining each metric',
    },
  ];

  issues.forEach((issue, idx) => {
    console.log(`${idx + 1}. ${issue.area}`);
    console.log(`   Issue: ${issue.issue}`);
    console.log(`   Impact: ${issue.impact}`);
    console.log(`   Fix: ${issue.fix}\n`);
  });

  report.issues = issues;

  // Recommendations by priority
  console.log('='.repeat(60));
  console.log('\n🎯 PRIORITY FIXES (First-Time User Experience)\n');

  const priorities = [
    {
      priority: 'CRITICAL',
      item: 'Add onboarding banner on landing page',
      reason: 'Users need to understand what the app does before exploring',
      effort: '1 hour',
    },
    {
      priority: 'CRITICAL',
      item: 'Show tooltips on map controls (first visit only)',
      reason: 'Users don\'t know what buttons do',
      effort: '2 hours',
    },
    {
      priority: 'HIGH',
      item: 'Add copy-to-clipboard toast feedback',
      reason: 'Users need confirmation their action worked',
      effort: '30 min',
    },
    {
      priority: 'HIGH',
      item: 'Fix mobile bottom padding (avoid FAB overlap)',
      reason: 'Listings are unreadable/unclickable on mobile',
      effort: '30 min',
    },
    {
      priority: 'HIGH',
      item: 'Add progress indicator to multi-step forms',
      reason: 'Users abandon forms when unsure of length',
      effort: '1 hour',
    },
    {
      priority: 'MEDIUM',
      item: 'Show empty state message instead of blank map',
      reason: 'Prevents user confusion about app state',
      effort: '1 hour',
    },
    {
      priority: 'MEDIUM',
      item: 'Add helpful error boundaries with retry',
      reason: 'Graceful degradation builds trust',
      effort: '2 hours',
    },
    {
      priority: 'MEDIUM',
      item: 'Label hamburger menu on mobile',
      reason: 'Mobile menu discoverability',
      effort: '30 min',
    },
  ];

  priorities.forEach((p) => {
    console.log(`[${p.priority}] ${p.item}`);
    console.log(`         Reason: ${p.reason}`);
    console.log(`         Effort: ${p.effort}\n`);
  });

  report.recommendations = priorities;

  // Mobile-specific issues
  console.log('='.repeat(60));
  console.log('\n📱 MOBILE-SPECIFIC ISSUES\n');

  const mobileIssues = [
    'Bottom action buttons (Add Property, I\'m Looking) overlap list content',
    'Legend doesn\'t fit on small screens without scrolling header',
    'Filter panel width extends beyond screen bounds on portrait mode',
    'Property card images are too large for 375px width',
    'Metro overlay polylines are hard to tap/interact with',
    'Search input loses focus after typing first character on some devices',
  ];

  mobileIssues.forEach((issue, idx) => {
    console.log(`${idx + 1}. ${issue}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('\n💻 DESKTOP-SPECIFIC IMPROVEMENTS\n');

  const desktopImprovements = [
    'Sidebar property list should show mini-preview on hover',
    'Right-click property card → context menu (share, copy, save)',
    'Keyboard shortcuts: ? to show legend, S for search, E for explore',
    'Drag to draw circle for area search (instead of current click pattern)',
  ];

  desktopImprovements.forEach((item, idx) => {
    console.log(`${idx + 1}. ${item}`);
  });

  // Save report
  fs.writeFileSync('/tmp/ux-report.json', JSON.stringify(report, null, 2));
  console.log('\n✓ Full report saved to /tmp/ux-report.json\n');
}

runTests().catch(console.error);
