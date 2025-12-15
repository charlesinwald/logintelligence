#!/usr/bin/env node

import { createInterface } from 'readline';
import { setApiKey, getApiKey, getConfigPath } from '../lib/config.js';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setup() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║   ⚙️  Error Intelligence Dashboard Setup                  ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const currentKey = getApiKey();

  if (currentKey) {
    console.log(`Current API key: ${currentKey.substring(0, 10)}...${currentKey.substring(currentKey.length - 4)}`);
    console.log(`Config location: ${getConfigPath()}\n`);

    const update = await question('Do you want to update your API key? (y/N): ');

    if (update.toLowerCase() !== 'y' && update.toLowerCase() !== 'yes') {
      console.log('\n✓ Setup cancelled. Current configuration unchanged.\n');
      rl.close();
      return;
    }
  }

  console.log('\n📝 To get a Gemini API key:');
  console.log('   1. Visit: https://ai.google.dev/');
  console.log('   2. Click "Get API Key"');
  console.log('   3. Create a new API key');
  console.log('   4. Copy the key (starts with "AIza...")\n');

  const apiKey = await question('Enter your Gemini API key: ');

  if (!apiKey || apiKey.trim().length === 0) {
    console.log('\n✗ No API key provided. Setup cancelled.\n');
    rl.close();
    return;
  }

  const trimmedKey = apiKey.trim();

  if (!trimmedKey.startsWith('AIza')) {
    console.log('\n⚠️  Warning: API key doesn\'t start with "AIza". This might not be a valid Gemini API key.');
    const proceed = await question('Continue anyway? (y/N): ');

    if (proceed.toLowerCase() !== 'y' && proceed.toLowerCase() !== 'yes') {
      console.log('\n✗ Setup cancelled.\n');
      rl.close();
      return;
    }
  }

  if (setApiKey(trimmedKey)) {
    console.log('\n✓ API key saved successfully!');
    console.log(`✓ Config location: ${getConfigPath()}`);
    console.log('\nYou can now run: logintelligence\n');
  } else {
    console.log('\n✗ Failed to save API key. Please check file permissions.\n');
  }

  rl.close();
}

setup().catch((error) => {
  console.error('Setup failed:', error);
  process.exit(1);
});
