#!/usr/bin/env node
/**
 * Node.js wrapper for autocannon load testing
 */

const autocannon = require('autocannon');
const fs = require('fs-extra');
const path = require('path');
const minimist = require('minimist');

const argv = minimist(process.argv.slice(2));
const url = argv.url || 'http://localhost:3000/api/tasks';
const duration = parseInt(argv.duration || '10', 10);
const connections = parseInt(argv.connections || '10', 10);
const output = argv.output;

console.log(`Running autocannon load test on ${url}`);
console.log(`Duration: ${duration}s, Connections: ${connections}`);

const instance = autocannon({
  url: url,
  duration: duration,
  connections: connections,
  pipelining: 1,
  timeout: 30,
  headers: {
    'Content-Type': 'application/json'
  }
}, (err, result) => {
  if (err) {
    console.error('Autocannon error:', err);
    process.exit(1);
  }

  console.log('Load test complete');
  console.log(`Requests per second: ${result.requests.average}`);
  console.log(`Latency (ms): ${result.latency.average}`);
  console.log(`Throughput (bytes/sec): ${result.throughput.average}`);

  // Save results to file if output path provided
  if (output) {
    const outputPath = path.resolve(output);
    fs.ensureDirSync(path.dirname(outputPath));
    
    const results = {
      timestamp: new Date().toISOString(),
      url: url,
      duration: duration,
      connections: connections,
      requests: result.requests,
      latency: result.latency,
      throughput: result.throughput,
      errors: result.errors,
      timeouts: result.timeouts,
      durationMs: result.duration,
      start: result.start,
      finish: result.finish
    };
    
    fs.writeJsonSync(outputPath, results, { spaces: 2 });
    console.log(`Results saved to: ${outputPath}`);
  }
  
  process.exit(0);
});

// Track progress
instance.on('tick', () => {
  console.log('Running load test...');
});

instance.on('done', (result) => {
  console.log('Load test finished');
});

instance.on('error', (err) => {
  console.error('Load test error:', err);
  process.exit(1);
});