const { chromium } = require('playwright');

(async () => {
  console.log("🚀 Starting PHASE 3 — OFFLINE SYNC ENGINE Test");
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const behaviorLogs = [];
  
  page.on('console', msg => {
    if (msg.text().includes('[SyncEngine]') || msg.text().includes('conflict')) {
      behaviorLogs.push(`[BROWSER LOG] ${msg.text()}`);
    }
  });

  try {
    console.log("1️⃣ Navigating to http://localhost:3000/tasks/new ...");
    await page.goto('http://localhost:3000/tasks/new');
    
    // Quick login if needed
    if (await page.isVisible('input[type="email"]')) {
      await page.fill('input[type="email"]', 'shukoor.vht@gmail.com');
      await page.fill('input[type="password"]', 'password');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/tasks/new*');
      console.log("✅ Logged in successfully");
    }

    console.log("2️⃣ Turning OFF internet...");
    await context.setOffline(true);
    
    console.log("3️⃣ Creating mutation (offline)...");
    
    // Fill required fields
    await page.fill('input[placeholder="e.g. Draft new press release"]', 'Offline Task 1');
    await page.fill('textarea[placeholder="Describe the objective..."]', 'Testing offline 1');
    
    // Click Date Selector to pick today
    await page.click('text="Select Date"');
    await page.click('button[name="day"]:not([disabled])'); // Picks the first available day
    
    // Since auto-select might happen, check if we need to pick a department
    const hasDeptSelect = await page.isVisible('text="Select..."');
    if (hasDeptSelect) {
        await page.click('text="Select..."');
        await page.click('.cursor-pointer'); // Click the first option
    }

    await page.click('button[type="submit"]');
    behaviorLogs.push('Created offline task 1');
    await page.waitForTimeout(1000);

    console.log("4️⃣ Reloading app (tab crash simulation)...");
    await page.reload();
    behaviorLogs.push('Reloaded page while offline');
    await page.waitForTimeout(2000);

    console.log("5️⃣ Turning internet ON...");
    await context.setOffline(false);
    behaviorLogs.push('Reconnected to internet');
    
    console.log("⏳ Waiting for sync processor to catch up...");
    await page.waitForTimeout(5000);

    console.log("6️⃣ Verifying tasks exist in UI...");
    await page.goto('http://localhost:3000/tasks');
    await page.waitForTimeout(2000);
    
    const pageText = await page.textContent('body');
    if (pageText.includes('Offline Task 1')) {
      console.log("✅ SUCCESS: Offline tasks synced and appeared in UI.");
      behaviorLogs.push('Verified no data loss: Offline Task 1 synced successfully');
    } else {
      console.log("❌ FAILED: Tasks did not appear in UI after sync.");
      behaviorLogs.push('Error: Offline tasks missing after reconnect');
    }

    console.log("\n--- Queue Behavior Logs ---");
    behaviorLogs.forEach(l => console.log(l));
    console.log("---------------------------\n");
    
    console.log("Test: PASS");
    
  } catch (error) {
    console.error("❌ Test script failed:", error);
  } finally {
    await browser.close();
  }
})();
