const { chromium } = require('playwright');

async function debugThree() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`[BROWSER ${msg.type().toUpperCase()}]:`, msg.text());
    }
  });

  console.log('Navigating...');
  await page.goto('http://localhost:3001/qwen-preview.html', { waitUntil: 'load' });
  await page.waitForTimeout(1000);

  const scrollPoints = [0, 0.25, 0.5, 0.75, 1.0];
  
  for (const sp of scrollPoints) {
    console.log(`\n--- SCROLL PROGRESS: ${sp * 100}% ---`);
    
    // Scroll to the point
    await page.evaluate((progress) => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo(0, maxScroll * progress);
    }, sp);
    await page.waitForTimeout(500);

    const stats = await page.evaluate(() => {
      if (!window.camera || !window.scene) {
        return { error: 'camera or scene not exposed!' };
      }
      
      const cam = window.camera;
      const sc = window.scene;
      
      // Count total meshes and visible ones
      let totalMeshes = 0;
      let visibleMeshes = 0;
      sc.traverse(node => {
        if (node.isMesh) {
          totalMeshes++;
          if (node.visible) visibleMeshes++;
        }
      });

      return {
        camera: {
          position: { x: cam.position.x, y: cam.position.y, z: cam.position.z },
          rotation: { x: cam.rotation.x, y: cam.rotation.y, z: cam.rotation.z }
        },
        meshes: { total: totalMeshes, visible: visibleMeshes },
        bokehFocus: window.composer.passes[1]?.uniforms?.focus?.value
      };
    });

    console.log(JSON.stringify(stats, null, 2));
  }

  await browser.close();
}

debugThree().catch(console.error);
