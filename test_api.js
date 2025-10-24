#!/usr/bin/env node

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Simple script to test API endpoints
const https = require('https');

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testPrescriptions() {
  try {
    console.log('🔍 Testing prescription API...');
    
    // Test if we can access prescriptions
    const result = await makeRequest('http://localhost:3000/api/prescriptions', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📋 API Response:', result);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the script
testPrescriptions();

