const axios = require('axios');

async function testSearchPage() {
  try {
    console.log('Testing if search page loads...');
    
    // Test if the search page loads
    const response = await axios.get('http://localhost:3001/search');
    
    console.log('Search page status:', response.status);
    console.log('Search page headers:', response.headers);
    
    // Check if the response contains the search input
    if (response.data.includes('Search...')) {
      console.log('Search input found in page');
    } else {
      console.log('Search input NOT found in page');
    }
    
    // Show first 500 characters of the response
    console.log('Page content (first 500 chars):', response.data.substring(0, 500));
  } catch (error) {
    if (error.response) {
      console.log('Search page status:', error.response.status);
      console.log('Search page headers:', error.response.headers);
      console.log('Search page data (first 500 chars):', error.response.data.substring(0, 500));
    } else {
      console.log('Error:', error.message);
    }
  }
}

testSearchPage();