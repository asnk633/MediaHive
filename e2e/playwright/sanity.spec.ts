import { test, expect } from '@playwright/test';
import fs from 'fs';

test('sanity check', async ({ page }) => {
    console.log("Sanity test running");
    fs.writeFileSync('sanity.log', 'Sanity passed');
    expect(1).toBe(1);
});
