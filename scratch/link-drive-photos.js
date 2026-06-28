const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Supabase credentials
const supabaseUrl = 'https://fcctcorycpvebupluzpe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjY3Rjb3J5Y3B2ZWJ1cGx1enBlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI2NDU0MSwiZXhwIjoyMDg3ODQwNTQxfQ.zDaxBjE6yUAa44PeTTSrNDDcIdrgG_PFS35C1DBjSX4';
const supabase = createClient(supabaseUrl, supabaseKey);

// Google Drive configuration
const FOLDER_ID = '1nPv67BFL0XdPw7vZ4tPBfShByCOMBfHb';
const KEY_FILE = '../serviceAccountKey.json';

// Manual mapping for currently uploaded files that don't follow the asset ID naming yet
const manualMappings = {
    '1T1Y2NFCitjsQRnM0-fkmjuIK596qNiSP': 'TGMD227', // SanDisk 128GB -> TGMD227
    '1HWEUMUu9M0ZoRzwaG0Fc1VlQVpvkfL7s': 'TGMD193', // ATEM Mini Pro -> TGMD193
    '1QU9qI_EMtFW4x4JG-xc8u2tRVp-5YzzP': 'TGMD193', // ATEM Mini Pro -> TGMD193
};

async function run() {
    try {
        console.log('Loading Google Service Account credentials...');
        const keyData = JSON.parse(fs.readFileSync(KEY_FILE, 'utf8'));
        
        const authClient = new google.auth.GoogleAuth({
            credentials: {
                client_email: keyData.client_email,
                private_key: keyData.private_key,
            },
            scopes: ['https://www.googleapis.com/auth/drive'],
        });

        const drive = google.drive({ version: 'v3', auth: authClient });

        console.log(`Fetching photos from Google Drive folder: ${FOLDER_ID}...`);
        
        let allFiles = [];
        let pageToken = null;
        
        do {
            const res = await drive.files.list({
                q: `'${FOLDER_ID}' in parents and trashed = false`,
                fields: 'nextPageToken, files(id, name, webViewLink, thumbnailLink)',
                pageToken: pageToken,
                supportsAllDrives: true,
                includeItemsFromAllDrives: true,
            });
            allFiles = allFiles.concat(res.data.files);
            pageToken = res.data.nextPageToken;
        } while (pageToken);

        console.log(`Found ${allFiles.length} files in the Google Drive folder.`);

        console.log('Fetching inventory items from Supabase...');
        const { data: inventoryItems, error: fetchError } = await supabase
            .from('inventory_items')
            .select('id, asset_id, item_name');

        if (fetchError) {
            console.error('Error fetching inventory items:', fetchError);
            return;
        }
        
        console.log(`Found ${inventoryItems.length} inventory items in the database.`);

        let updateCount = 0;

        for (const file of allFiles) {
            let matchedAssetId = null;

            // 1. Check if the file ID has a manual mapping
            if (manualMappings[file.id]) {
                matchedAssetId = manualMappings[file.id];
                console.log(`Fuzzy/Manual match found for: ${file.name} -> ${matchedAssetId}`);
            } else {
                // 2. Check if the filename contains the asset ID (e.g., TGMD100.jpg or TGMD100_photo.jpg)
                const assetIdPattern = /TGMD\d+/i;
                const match = file.name.match(assetIdPattern);
                if (match) {
                    matchedAssetId = match[0].toUpperCase();
                    console.log(`Filename pattern match found for: ${file.name} -> ${matchedAssetId}`);
                }
            }

            if (matchedAssetId) {
                const matchingItem = inventoryItems.find(item => item.asset_id === matchedAssetId);
                
                if (matchingItem) {
                    const imageUrl = file.webViewLink;
                    
                    const { error: updateError } = await supabase
                        .from('inventory_items')
                        .update({ 
                            image_url: imageUrl,
                            drive_file_id: file.id
                        })
                        .eq('id', matchingItem.id);
                        
                    if (updateError) {
                        console.error(`Failed to update ${matchedAssetId}:`, updateError);
                    } else {
                        updateCount++;
                        console.log(`✅ Successfully linked ${matchedAssetId} to photo: ${file.name}`);
                    }
                } else {
                    console.log(`⚠️ Matched asset ID ${matchedAssetId} but it doesn't exist in Supabase inventory_items.`);
                }
            } else {
                console.log(`ℹ️ File skipped (no match criteria met): ${file.name}`);
            }
        }
        
        console.log(`\nFinished mapping! Successfully updated ${updateCount} items in the database.`);

    } catch (err) {
        console.error('Error:', err);
    }
}

run();
