import { test, expect } from '@playwright/test';

// Viewports to test hydration on
const VIEWPORTS = [
  { name: 'Desktop', width: 1366, height: 768 },
  { name: 'Tablet', width: 1024, height: 768 },
  { name: 'Chrome Mobile', width: 412, height: 915 },
  { name: 'Pixel 7', width: 412, height: 915 },
  { name: 'Samsung S21', width: 360, height: 800 }
];

/**
 * Compare two DOM structures and return differences
 */
async function compareDOMStructures(serverDOM: string, clientDOM: string) {
  const differences = {
    extraNodes: [] as string[],
    removedNodes: [] as string[],
    mismatchedAttributes: [] as string[]
  };

  // Parse DOM strings
  const parser = new DOMParser();
  const serverDoc = parser.parseFromString(serverDOM, 'text/html');
  const clientDoc = parser.parseFromString(clientDOM, 'text/html');

  // Compare nodes recursively
  function compareNodes(serverNode: Element, clientNode: Element, path: string = '') {
    // Compare tag names
    if (serverNode.tagName !== clientNode.tagName) {
      differences.mismatchedAttributes.push(`${path}: Tag mismatch - Server: ${serverNode.tagName}, Client: ${clientNode.tagName}`);
    }

    // Compare attributes
    const serverAttrs = Array.from(serverNode.attributes);
    const clientAttrs = Array.from(clientNode.attributes);

    // Check for removed attributes
    for (const attr of serverAttrs) {
      const clientAttr = clientNode.getAttributeNode(attr.name);
      if (!clientAttr) {
        differences.removedNodes.push(`${path}[${attr.name}]`);
      } else if (clientAttr.value !== attr.value) {
        differences.mismatchedAttributes.push(`${path}[${attr.name}]: Value mismatch - Server: "${attr.value}", Client: "${clientAttr.value}"`);
      }
    }

    // Check for extra attributes
    for (const attr of clientAttrs) {
      const serverAttr = serverNode.getAttributeNode(attr.name);
      if (!serverAttr) {
        differences.extraNodes.push(`${path}[${attr.name}="${attr.value}"]`);
      }
    }

    // Compare children
    const serverChildren = Array.from(serverNode.children);
    const clientChildren = Array.from(clientNode.children);

    const maxChildren = Math.max(serverChildren.length, clientChildren.length);
    for (let i = 0; i < maxChildren; i++) {
      const currentPath = `${path} > :nth-child(${i + 1})`;
      
      if (i >= serverChildren.length) {
        // Extra node in client
        differences.extraNodes.push(`${currentPath} (${clientChildren[i].tagName})`);
      } else if (i >= clientChildren.length) {
        // Missing node in client
        differences.removedNodes.push(`${currentPath} (${serverChildren[i].tagName})`);
      } else {
        // Compare recursively
        compareNodes(serverChildren[i], clientChildren[i], currentPath);
      }
    }
  }

  // Start comparison from body
  const serverBody = serverDoc.body;
  const clientBody = clientDoc.body;
  
  if (serverBody && clientBody) {
    compareNodes(serverBody, clientBody, 'body');
  }

  return differences;
}

/**
 * Capture and analyze hydration errors
 */
async function captureHydrationErrors(page: any) {
  const hydrationErrors: string[] = [];
  
  // Check for React hydration error flag
  const hasHydrationError = await page.evaluate(() => {
    return (window as any).__NEXT_HYDRATION_ERROR || false;
  });
  
  if (hasHydrationError) {
    hydrationErrors.push('React __NEXT_HYDRATION_ERROR flag detected');
  }
  
  // Check console for hydration warnings
  const consoleMessages = (page as any)._consoleMessages || [];
  for (const msg of consoleMessages) {
    const text = msg.text();
    if (text.includes('hydration failed') || 
        text.includes('Hydration failed') ||
        text.includes('Text content did not match') ||
        text.includes('Server and client') ||
        (msg.type() === 'error' && text.includes('hydration'))) {
      hydrationErrors.push(`Console error: ${text}`);
    }
  }
  
  return hydrationErrors;
}

/**
 * Check for client-only components not wrapped correctly
 */
async function checkClientComponentWrapping(page: any) {
  const issues = [];
  
  // Check if ClipDetection component is properly implemented (should render null)
  const clipDetectionExists = await page.evaluate(() => {
    // ClipDetection should be a client-only component that renders null
    const clipDetectionElements = document.querySelectorAll('[data-client-component="ClipDetection"]');
    return clipDetectionElements.length === 0; // Should not render any DOM elements
  });
  
  if (!clipDetectionExists) {
    issues.push('ClipDetection component may not be properly wrapped as client-only');
  }
  
  return issues;
}

/**
 * Check for DOM structure consistency
 */
async function checkDOMStructure(page: any) {
  const issues = [];
  
  // Check for content-offset wrapper
  const contentOffsetExists = await page.evaluate(() => {
    return document.querySelector('.content-offset') !== null;
  });
  
  if (!contentOffsetExists) {
    issues.push('Missing .content-offset wrapper');
  }
  
  // Check TopBar positioning
  const topBarPosition = await page.evaluate(() => {
    const topBar = document.querySelector('header.topbar');
    if (!topBar) return null;
    
    const rect = topBar.getBoundingClientRect();
    return {
      top: rect.top,
      bottom: rect.bottom,
      height: rect.height
    };
  });
  
  if (topBarPosition) {
    if (topBarPosition.top < -10) {
      issues.push(`TopBar is clipped (top: ${topBarPosition.top}px)`);
    }
  } else {
    issues.push('TopBar element not found');
  }
  
  return issues;
}

test.describe('Hydration Mismatch Detection', () => {
  for (const viewport of VIEWPORTS) {
    test(`${viewport.name} - Detect hydration mismatches`, async ({ page }) => {
      // Capture console messages
      const consoleMessages: { type: string; text: string }[] = [];
      page.on('console', msg => {
        consoleMessages.push({
          type: msg.type(),
          text: msg.text()
        });
      });
      
      // Store console messages on the page object for later access
      (page as any)._consoleMessages = consoleMessages;
      
      // Set viewport
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      // Navigate to home page
      await page.goto('/home');
      
      // Wait for network idle to ensure all resources are loaded
      await page.waitForLoadState('networkidle');
      
      // Wait a bit more for any hydration to complete
      await page.waitForTimeout(1000);
      
      // Capture server-rendered DOM
      const serverDOM = await page.evaluate(() => {
        // Clone the document to preserve original
        const clone = document.cloneNode(true) as Document;
        return clone.documentElement.outerHTML;
      });
      
      // Wait for client-side hydration to complete
      await page.waitForTimeout(1000);
      
      // Capture client-rendered DOM
      const clientDOM = await page.evaluate(() => {
        return document.documentElement.outerHTML;
      });
      
      // Compare DOM structures
      const differences = await compareDOMStructures(serverDOM, clientDOM);
      
      // Check for hydration errors
      const hydrationErrors = await captureHydrationErrors(page);
      
      // Check client component wrapping
      const wrappingIssues = await checkClientComponentWrapping(page);
      
      // Check DOM structure consistency
      const structureIssues = await checkDOMStructure(page);
      
      // Check for safe-area initializer effects
      const safeAreaVars = await page.evaluate(() => {
        const root = document.documentElement;
        return {
          safeAreaTop: root.style.getPropertyValue('--safe-area-top'),
          safeAreaBottom: root.style.getPropertyValue('--safe-area-bottom'),
          computedSafeTop: root.style.getPropertyValue('--computed-safe-top'),
          computedSafeBottom: root.style.getPropertyValue('--computed-safe-bottom')
        };
      });
      
      // Log findings
      console.log(`\n=== ${viewport.name} Hydration Analysis ===`);
      console.log(`Safe Area Variables:`, safeAreaVars);
      
      if (differences.extraNodes.length > 0) {
        console.log(`Extra Nodes:`, differences.extraNodes);
      }
      
      if (differences.removedNodes.length > 0) {
        console.log(`Removed Nodes:`, differences.removedNodes);
      }
      
      if (differences.mismatchedAttributes.length > 0) {
        console.log(`Mismatched Attributes:`, differences.mismatchedAttributes);
      }
      
      if (hydrationErrors.length > 0) {
        console.log(`Hydration Errors:`, hydrationErrors);
      }
      
      if (wrappingIssues.length > 0) {
        console.log(`Wrapping Issues:`, wrappingIssues);
      }
      
      if (structureIssues.length > 0) {
        console.log(`Structure Issues:`, structureIssues);
      }
      
      // Take screenshot on failure
      if (differences.extraNodes.length > 0 || 
          differences.removedNodes.length > 0 || 
          differences.mismatchedAttributes.length > 0 ||
          hydrationErrors.length > 0 ||
          wrappingIssues.length > 0 ||
          structureIssues.length > 0) {
        await page.screenshot({ 
          path: `test-results/hydration-${viewport.name.toLowerCase().replace(/\s+/g, '-')}-failure.png`,
          fullPage: true 
        });
        console.log(`Screenshot saved: hydration-${viewport.name.toLowerCase().replace(/\s+/g, '-')}-failure.png`);
      }
      
      // Fail test if any issues found
      const allIssues = [
        ...differences.extraNodes,
        ...differences.removedNodes,
        ...differences.mismatchedAttributes,
        ...hydrationErrors,
        ...wrappingIssues,
        ...structureIssues
      ];
      
      expect(allIssues).toHaveLength(0);
    });
  }
  
  test('Runtime safe-area changes detection', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 412, height: 915 });
    
    // Capture initial safe-area values
    const initialSafeArea = await page.evaluate(() => {
      return {
        top: document.documentElement.style.getPropertyValue('--computed-safe-top'),
        bottom: document.documentElement.style.getPropertyValue('--computed-safe-bottom')
      };
    });
    
    // Navigate to home
    await page.goto('/home');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Capture safe-area values after hydration
    const afterHydrationSafeArea = await page.evaluate(() => {
      return {
        top: document.documentElement.style.getPropertyValue('--computed-safe-top'),
        bottom: document.documentElement.style.getPropertyValue('--computed-safe-bottom')
      };
    });
    
    // Check if safe-area values changed significantly (indicating runtime adjustment)
    const initialTop = parseFloat(initialSafeArea.top) || 0;
    const afterHydrationTop = parseFloat(afterHydrationSafeArea.top) || 0;
    
    // Small changes are acceptable, but large changes indicate potential issues
    const changeThreshold = 20; // pixels
    const topChange = Math.abs(afterHydrationTop - initialTop);
    
    if (topChange > changeThreshold) {
      console.log(`⚠️  Significant safe-area top change detected: ${initialTop}px → ${afterHydrationTop}px (Δ: ${topChange}px)`);
    }
    
    // Check for ClipDetection adjustments
    const clipAdjustments = await page.evaluate(() => {
      // This would be set by ClipDetection if it made adjustments
      return (window as any).__CLIP_DETECTION_ADJUSTED || false;
    });
    
    if (clipAdjustments) {
      console.log('⚠️  ClipDetection made runtime adjustments');
    }
  });
});