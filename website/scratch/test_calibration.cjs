const { chromium } = require('playwright');
const path = require('path');

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });

  await page.goto('http://localhost:3001/qwen-preview.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  const calibrationResults = await page.evaluate(() => {
    const scene = window.scene;
    let laptopLid, lidPivot, laptopBase;
    
    scene.traverse(child => {
      if (child.name === 'lidPivot') lidPivot = child;
      if (child.name === 'RcexTyyhpuJYATQ') laptopLid = child;
    });

    if (!lidPivot || !laptopLid) return { error: 'Lid or Pivot not found' };

    // 1. Reset scale and position of lid inside pivot
    laptopLid.scale.set(1.0, 1.0, 1.0);
    laptopLid.position.set(0, 11.46, 0.42);

    // 2. Hide lid to calculate base bounding box
    laptopLid.visible = false;
    const parentNode = scene.getObjectByName('nIhhmAXgzOpXafM');
    const boxBase = new THREE.Box3().setFromObject(parentNode);
    const sizeBase = new THREE.Vector3();
    boxBase.getSize(sizeBase);
    laptopLid.visible = true;

    // 3. Close lid to calculate unscaled closed lid bounding box
    lidPivot.rotation.x = 1.91;
    lidPivot.updateMatrixWorld(true);

    const boxLidClosed = new THREE.Box3().setFromObject(laptopLid);
    const sizeLidClosed = new THREE.Vector3();
    boxLidClosed.getSize(sizeLidClosed);

    // 4. Compute required Y-scale to match base Z-depth
    // In closed state, Y-axis of the lid maps to world Z-axis.
    const baseDepth = sizeBase.z;
    const lidDepthClosed = sizeLidClosed.z;
    const requiredScaleY = baseDepth / lidDepthClosed;

    // Apply scale
    laptopLid.scale.set(1.0, requiredScaleY, 1.0);
    // Update position offset for Y
    laptopLid.position.set(0, 11.46 * requiredScaleY, 0.42);
    lidPivot.updateMatrixWorld(true);

    // 5. Compute Z alignment offset
    // Calculate new closed bounds
    const boxLidClosedScaled = new THREE.Box3().setFromObject(laptopLid);
    const minZDiff = boxBase.min.z - boxLidClosedScaled.min.z;
    
    // Apply Z translation offset
    laptopLid.position.z += minZDiff;
    lidPivot.updateMatrixWorld(true);

    // Verify final bounds
    const finalBoxLid = new THREE.Box3().setFromObject(laptopLid);
    const finalSizeLid = new THREE.Vector3();
    finalBoxLid.getSize(finalSizeLid);

    return {
      baseSize: sizeBase.toArray(),
      baseMinZ: boxBase.min.z,
      baseMaxZ: boxBase.max.z,
      requiredScaleY: requiredScaleY,
      addedPosZ: minZDiff,
      finalLidSizeClosed: finalSizeLid.toArray(),
      finalLidMinZ: finalBoxLid.min.z,
      finalLidMaxZ: finalBoxLid.max.z
    };
  });

  console.log('Calibration results:', JSON.stringify(calibrationResults, null, 2));

  // Take screenshot in closed state
  await page.screenshot({ path: path.join(__dirname, 'calibrated_closed.png') });
  console.log('Captured calibrated_closed.png');

  // Let's verify open state
  await page.evaluate(() => {
    const scene = window.scene;
    let lidPivot;
    scene.traverse(child => {
      if (child.name === 'lidPivot') lidPivot = child;
    });
    if (lidPivot) {
      lidPivot.rotation.x = 0.0;
      lidPivot.updateMatrixWorld(true);
    }
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(__dirname, 'calibrated_open.png') });
  console.log('Captured calibrated_open.png');

  await browser.close();
}

run().catch(console.error);
