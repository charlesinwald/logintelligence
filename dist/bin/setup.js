#!/usr/bin/env node
import * as readline from 'readline/promises';
import { setApiKey, getApiKey, getConfigPath, getLLMProvider, setLLMProvider, getOllamaBaseURL, setOllamaBaseURL, getOllamaModel, setOllamaModel } from '../lib/config.js';
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
async function question(prompt) {
    return await rl.question(prompt);
}
async function setupGemini() {
    console.log('\n📝 To get a Gemini API key:');
    console.log('   1. Visit: https://ai.google.dev/');
    console.log('   2. Click "Get API Key"');
    console.log('   3. Create a new API key');
    console.log('   4. Copy the key (starts with "AIza...")\n');
    const apiKey = await question('Enter your Gemini API key: ');
    if (!apiKey || apiKey.trim().length === 0) {
        console.log('\n✗ No API key provided.\n');
        return false;
    }
    const trimmedKey = apiKey.trim();
    if (!trimmedKey.startsWith('AIza')) {
        console.log('\n⚠️  Warning: API key doesn\'t start with "AIza". This might not be a valid Gemini API key.');
        const proceed = await question('Continue anyway? (y/N): ');
        if (proceed.toLowerCase() !== 'y' && proceed.toLowerCase() !== 'yes') {
            console.log('\n✗ Setup cancelled.\n');
            return false;
        }
    }
    if (setApiKey(trimmedKey)) {
        console.log('\n✓ Gemini API key saved successfully!');
        return true;
    }
    else {
        console.log('\n✗ Failed to save API key. Please check file permissions.\n');
        return false;
    }
}
async function setupOllama() {
    console.log('\n📝 Ollama Local LLM Setup:');
    console.log('   Ollama runs AI models locally on your machine.');
    console.log('   Install from: https://ollama.ai\n');
    const currentBaseUrl = getOllamaBaseURL();
    const currentModel = getOllamaModel();
    console.log(`Current Ollama URL: ${currentBaseUrl}`);
    console.log(`Current Model: ${currentModel}\n`);
    const changeUrl = await question(`Keep Ollama URL as ${currentBaseUrl}? (Y/n): `);
    let baseUrl = currentBaseUrl;
    if (changeUrl.toLowerCase() === 'n' || changeUrl.toLowerCase() === 'no') {
        const newUrl = await question('Enter Ollama base URL: ');
        baseUrl = newUrl.trim() || currentBaseUrl;
    }
    console.log('\nCommon models:');
    console.log('   - llama3.1 (recommended, ~4.7GB)');
    console.log('   - llama3.2 (~2GB)');
    console.log('   - mistral (~4.1GB)');
    console.log('   - codellama (~3.8GB)');
    console.log('\nTo install a model, run: ollama pull <model-name>\n');
    const model = await question('Enter Ollama model name (or press Enter for llama3.1): ');
    const selectedModel = model.trim() || 'llama3.1';
    if (setOllamaBaseURL(baseUrl) && setOllamaModel(selectedModel)) {
        console.log('\n✓ Ollama configuration saved!');
        console.log(`✓ Base URL: ${baseUrl}`);
        console.log(`✓ Model: ${selectedModel}`);
        console.log('\nMake sure Ollama is running and the model is installed:');
        console.log(`   ollama pull ${selectedModel}`);
        console.log('   ollama serve\n');
        return true;
    }
    else {
        console.log('\n✗ Failed to save Ollama configuration.\n');
        return false;
    }
}
export async function setup() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                                                            ║');
    console.log('║   ⚙️  LogIntelligence Dashboard Setup                  ║');
    console.log('║                                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    const currentProvider = getLLMProvider();
    const currentKey = getApiKey();
    if (currentProvider === 'gemini' && currentKey) {
        console.log(`Current provider: Gemini`);
        console.log(`Current API key: ${currentKey.substring(0, 10)}...${currentKey.substring(currentKey.length - 4)}`);
    }
    else if (currentProvider === 'ollama') {
        console.log(`Current provider: Ollama (Local LLM)`);
        console.log(`URL: ${getOllamaBaseURL()}`);
        console.log(`Model: ${getOllamaModel()}`);
    }
    console.log(`Config location: ${getConfigPath()}\n`);
    console.log('Choose your LLM provider:');
    console.log('   1. Gemini (Cloud-based, requires API key)');
    console.log('   2. Ollama (Local LLM, runs on your machine)\n');
    const choice = await question('Enter choice (1 or 2): ');
    let success = false;
    if (choice.trim() === '2') {
        setLLMProvider('ollama');
        success = await setupOllama();
    }
    else {
        setLLMProvider('gemini');
        success = await setupGemini();
    }
    if (success) {
        console.log(`✓ Config location: ${getConfigPath()}`);
        console.log('\nYou can now run: logintelligence\n');
    }
    rl.close();
}
// Only run setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    setup().catch((error) => {
        console.error('Setup failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=setup.js.map