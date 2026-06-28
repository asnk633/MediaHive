const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('[CONSOLE]:', msg.text()));
  page.on('pageerror', err => console.error('[EXCEPTION]:', err.message));

  await page.goto('http://localhost:3001/qwen-preview.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000); // wait for model load

  await page.evaluate(() => {
    // We can access three.js objects since window.scene and window.camera are exposed!
    const scene = window.scene;
    if (!scene) {
      console.error('window.scene is not defined!');
      return;
    }
    
    // Find lidPivot and laptopLid
    let lidPivot, laptopLid;
    scene.traverse(child => {
      if (child.name === 'lidPivot') lidPivot = child;
      if (child.name === 'RcexTyyhpuJYATQ') laptopLid = child;
    });
    
    if (!lidPivot || !laptopLid) {
      console.error('Could not find lidPivot or laptopLid in the scene graph!');
      return;
    }
    
    console.log('Found lidPivot:', lidPivot.name, 'position:', lidPivot.position.toArray());
    console.log('Found laptopLid:', laptopLid.name, 'position:', laptopLid.position.toArray());
    
    // Let's test the world position of the hinge at various rotation angles
    // The hinge point of the lid mesh is at (0, -0.42, 11.46) relative to laptopLid's origin? No!
    // In laptopLid's local space, the hinge is at (0, 0.42, -11.46) relative to its parent nIhhmAXgzOpXafM.
    // Since laptopLid has local position (0, -0.42, 11.46) relative to lidPivot, the hinge point in laptopLid's local space
    // is (0, 0.42 - (-0.42), -11.46 - 11.46) = (0, 0.84, -22.92) relative to laptopLid's origin?
    // Wait! Let's check!
    
    const hingeLocalPt = new THREE.Vector3(0, 0.42, -11.46); // Hinge location in Node 62 space
    
    const angles = [0.0, 0.5, 1.0, 1.5, 1.91];
    angles.forEach(angle => {
      lidPivot.rotation.x = angle;
      lidPivot.updateMatrixWorld(true);
      
      // Let's compute the world position of the mesh origin
      const lidWorldPos = new THREE.Vector3();
      laptopLid.getWorldPosition(lidWorldPos);
      
      // Let's compute the world position of the pivot origin
      const pivotWorldPos = new THREE.Vector3();
      lidPivot.getWorldPosition(pivotWorldPos);
      
      console.log(`Angle ${angle}:`);
      console.log(`  pivotWorldPos: [${pivotWorldPos.x.toFixed(4)}, ${pivotWorldPos.y.toFixed(4)}, ${pivotWorldPos.z.toFixed(4)}]`);
      console.log(`  lidWorldPos:   [${lidWorldPos.x.toFixed(4)}, ${lidWorldPos.y.toFixed(4)}, ${lidWorldPos.z.toFixed(4)}]`);
    });
  });

  await browser.close();
}

run().catch(console.error);
