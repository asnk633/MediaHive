const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('CRITICAL ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function determineCategory(itemName, oldCategory) {
  if (oldCategory && String(oldCategory).trim() !== '') {
    return String(oldCategory).trim();
  }
  
  const name = itemName.toLowerCase();
  
  const camerasKeywords = ['camera', 'sony', 'gopro', 'lens'];
  const networkingKeywords = ['hdmi', 'usb', 'rj45', 'crimping', 'cable', 'switch', 'router', 'cpe', 'extender', 'dongle', 'power strip', 'connector', 'hub', 'dock'];
  const audioKeywords = ['speaker', 'headphones', 'mic', 'sound', 'audio', 'edifier', 'sennheiser', 'wireless'];
  const officeKeywords = ['keyboard', 'mouse', 'mouse pad', 'monitor', 'stand', 'holder', 'organizer', 'screen protector', 'box', 'pouch', 'case', 'screen', 'umbrella', 'bracket', 'strap', 'ties', 'tape'];
  
  if (camerasKeywords.some(keyword => name.includes(keyword))) {
    return 'Cameras & Accessories';
  }
  if (networkingKeywords.some(keyword => name.includes(keyword))) {
    return 'Networking & Power Cables';
  }
  if (audioKeywords.some(keyword => name.includes(keyword))) {
    return 'Audio & Sound Systems';
  }
  if (officeKeywords.some(keyword => name.includes(keyword))) {
    return 'Office & Studio Gear';
  }
  
  return 'General Asset';
}

function cleanPurchaseAmount(amount) {
  if (amount === undefined || amount === null) {
    return null;
  }
  if (typeof amount === 'number') {
    return amount;
  }
  const cleanStr = String(amount).replace(/,/g, '').trim();
  if (cleanStr === '' || cleanStr.toLowerCase() === 'null') {
    return null;
  }
  const parsed = parseFloat(cleanStr);
  return isNaN(parsed) ? null : parsed;
}

function cleanPurchaseDate(dateStr) {
  if (!dateStr) return null;
  const cleaned = String(dateStr).trim();
  if (cleaned === '' || cleaned.toLowerCase() === 'null') return null;
  
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (regex.test(cleaned)) {
    return cleaned;
  }
  
  const d = new Date(cleaned);
  if (isNaN(d.getTime())) {
    return null;
  }
  return d.toISOString().split('T')[0];
}

function cleanCondition(cond) {
  if (!cond) return 'Good';
  const cleaned = String(cond).trim();
  if (['Good', 'Need Repair', 'Damaged'].includes(cleaned)) {
    return cleaned;
  }
  const lower = cleaned.toLowerCase();
  if (lower.includes('repair')) return 'Need Repair';
  if (lower.includes('damage')) return 'Damaged';
  return 'Good';
}

function cleanQuantity(qty) {
  if (qty === undefined || qty === null) {
    return 1;
  }
  if (typeof qty === 'number') {
    return Math.max(1, Math.floor(qty));
  }
  const parsed = parseInt(String(qty).replace(/,/g, '').trim(), 10);
  return isNaN(parsed) ? 1 : Math.max(1, parsed);
}

async function startImport() {
  const filePath = path.join(__dirname, '../asset data for bulk entry.json');
  if (!fs.existsSync(filePath)) {
    console.error(`CRITICAL ERROR: Asset data file not found at ${filePath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(filePath, 'utf8');
  let assets;
  try {
    assets = JSON.parse(rawData);
  } catch (err) {
    console.error('CRITICAL ERROR: Failed to parse asset JSON:', err.message);
    process.exit(1);
  }

  console.log(`Starting bulk import of ${assets.length} items...`);

  let successCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  const failures = [];

  for (let i = 0; i < assets.length; i++) {
    const asset = assets[i];
    const assetId = String(asset.asset_no || '').trim();
    const itemName = String(asset.asset_name || '').trim();
    
    if (!assetId || !itemName) {
      console.warn(`[Warning] Skipping row ${i + 1} due to missing asset_no or asset_name`);
      failedCount++;
      failures.push({ row: i + 1, error: 'Missing asset_no or asset_name' });
      continue;
    }

    const qty = cleanQuantity(asset.quantity);
    const itemData = {
      asset_id: assetId,
      item_name: itemName,
      category: determineCategory(itemName, asset.category),
      condition: cleanCondition(asset.condition),
      status: 'Available',
      serial_number: asset.serial_number ? String(asset.serial_number).trim() : null,
      quantity: qty,
      available_quantity: qty,
      location: asset.location ? String(asset.location).trim() : null,
      description: asset.description ? String(asset.description).trim() : null,
      purchase_amount: cleanPurchaseAmount(asset.purchase_amount),
      purchase_date: cleanPurchaseDate(asset.purchase_date),
      image_url: asset.image_url ? String(asset.image_url).trim() : null
    };

    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .insert([itemData]);

      if (error) {
        if (error.code === '23505') {
          // Unique key constraint violation: Skip duplicate asset_id
          skippedCount++;
          console.log(`[Skipped] Duplicate asset_id detected for: ${assetId} ("${itemName}")`);
        } else {
          failedCount++;
          console.error(`[Error] Failed to insert asset ${assetId}:`, error.message);
          failures.push({ asset_id: assetId, error: error.message });
        }
      } else {
        successCount++;
        console.log(`[Success] Inserted ${assetId}: "${itemName}" as "${itemData.category}"`);
      }
    } catch (err) {
      failedCount++;
      console.error(`[Exception] Unexpected error inserting asset ${assetId}:`, err.message);
      failures.push({ asset_id: assetId, error: err.message });
    }
  }

  console.log('\n======================================');
  console.log('         IMPORT SUMMARY REPORT        ');
  console.log('======================================');
  console.log(`Successfully Inserted : ${successCount}`);
  console.log(`Skipped (Duplicates)  : ${skippedCount}`);
  console.log(`Failed Entries        : ${failedCount}`);
  console.log('======================================\n');

  if (failures.length > 0) {
    console.log('Failure details:');
    failures.forEach(f => {
      console.log(`- Row/Asset: ${f.row || f.asset_id} | Error: ${f.error}`);
    });
  }
}

startImport();
