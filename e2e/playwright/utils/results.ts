import fs from 'fs';
import path from 'path';

const RESULTS_DIR = path.join(process.cwd(), 'test-results');
const RESULTS_FILE = path.join(RESULTS_DIR, 'unified-summary.json');

/**
 * Merge test results for a specific group into the unified results file
 * @param groupKey The group name (e.g., 'fabVisibility', 'safeAreaCorrectness')
 * @param resultObject The results object for this group
 */
export async function mergeTestResults(groupKey: string, resultObject: any): Promise<void> {
  // Ensure test-results directory exists
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }

  let mergedResults = {};

  // Read existing results if file exists
  if (fs.existsSync(RESULTS_FILE)) {
    try {
      const existingData = fs.readFileSync(RESULTS_FILE, 'utf8');
      mergedResults = JSON.parse(existingData);
    } catch (error) {
      // If JSON is corrupt, backup the file and start fresh
      console.warn(`Warning: Corrupt JSON in ${RESULTS_FILE}. Backing up as .bak`);
      try {
        fs.renameSync(RESULTS_FILE, `${RESULTS_FILE}.bak`);
      } catch (backupError) {
        console.error('Failed to backup corrupt file:', backupError);
      }
      mergedResults = {};
    }
  }

  // Merge the new results under the group key
  mergedResults[groupKey] = resultObject;

  // Write merged results back to file
  try {
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(mergedResults, null, 2));
    console.log(`Successfully merged results for group '${groupKey}' into ${RESULTS_FILE}`);
  } catch (writeError) {
    console.error(`Failed to write merged results to ${RESULTS_FILE}:`, writeError);
    throw writeError;
  }
}

/**
 * Read the current unified results
 */
export function readUnifiedResults(): any {
  if (!fs.existsSync(RESULTS_FILE)) {
    return {};
  }

  try {
    const data = fs.readFileSync(RESULTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.warn(`Warning: Could not read ${RESULTS_FILE}:`, error);
    return {};
  }
}