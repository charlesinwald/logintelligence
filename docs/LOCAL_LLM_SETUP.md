# Local LLM Setup Guide

LogIntelligence now supports running local Large Language Models (LLMs) for error analysis, giving you complete control over your data and removing dependency on cloud-based AI services.

## Overview

LogIntelligence supports two LLM providers:

1. **Google Gemini** (Cloud-based) - Requires API key, fast, easy setup
2. **Ollama** (Local) - Runs on your machine, private, no API key needed

## Why Use Local LLMs?

- **Privacy**: All error analysis happens locally - your data never leaves your machine
- **Cost**: No API usage costs after initial setup
- **Offline**: Works without internet connection
- **Control**: Full control over the AI model and its behavior
- **Data Sovereignty**: Important for compliance with data regulations

## Quick Start with Ollama

### Step 1: Install Ollama

Visit [https://ollama.ai](https://ollama.ai) and download Ollama for your platform:

**macOS:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**Windows:**
Download the installer from [https://ollama.ai/download](https://ollama.ai/download)

### Step 2: Pull a Model

Ollama supports many open-source models. We recommend starting with Llama 3.1:

```bash
ollama pull llama3.1
```

**Other recommended models:**

```bash
# Llama 3.2 (smaller, faster, 2GB)
ollama pull llama3.2

# Mistral (excellent quality, 4.1GB)
ollama pull mistral

# CodeLlama (optimized for code, 3.8GB)
ollama pull codellama

# Llama 3.1:70b (highest quality, requires 40GB+ RAM)
ollama pull llama3.1:70b
```

### Step 3: Start Ollama Server

```bash
ollama serve
```

Leave this running in a terminal. Ollama will listen on `http://localhost:11434` by default.

### Step 4: Configure LogIntelligence

Run the setup wizard:

```bash
logintelligence setup
```

When prompted, choose:
- **LLM Provider**: Select `2` for Ollama
- **Ollama URL**: Press Enter to use default `http://localhost:11434`
- **Model**: Enter your model name (e.g., `llama3.1`) or press Enter for default

### Step 5: Start LogIntelligence

```bash
logintelligence
```

That's it! LogIntelligence will now use your local LLM for all error analysis.

## Configuration Details

### Environment Variables

You can configure the LLM provider using environment variables instead of the setup wizard:

```bash
# .env file or shell environment

# Choose provider: 'gemini' or 'ollama'
LLM_PROVIDER=ollama

# Ollama configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1
```

### Configuration File

The setup wizard stores configuration in `~/.logintelligence/config.json`:

```json
{
  "LLM_PROVIDER": "ollama",
  "OLLAMA_BASE_URL": "http://localhost:11434",
  "OLLAMA_MODEL": "llama3.1"
}
```

You can manually edit this file if needed.

## Model Selection Guide

### Llama 3.1 (Recommended)
- **Size**: ~4.7GB
- **RAM**: 8GB minimum
- **Quality**: Excellent
- **Speed**: Fast
- **Best for**: General use, balanced performance

### Llama 3.2
- **Size**: ~2GB
- **RAM**: 4GB minimum
- **Quality**: Good
- **Speed**: Very fast
- **Best for**: Low-resource systems, quick responses

### Mistral
- **Size**: ~4.1GB
- **RAM**: 8GB minimum
- **Quality**: Excellent
- **Speed**: Fast
- **Best for**: High-quality analysis, comparable to GPT-3.5

### CodeLlama
- **Size**: ~3.8GB
- **RAM**: 8GB minimum
- **Quality**: Excellent for code
- **Speed**: Fast
- **Best for**: Stack trace analysis, code-heavy errors

### Llama 3.1:70b
- **Size**: ~40GB
- **RAM**: 64GB minimum
- **Quality**: Outstanding
- **Speed**: Slower
- **Best for**: High-end workstations, maximum quality

## Performance Tuning

### Ollama GPU Acceleration

Ollama automatically uses GPU acceleration if available:

**NVIDIA GPUs:**
- Ollama uses CUDA automatically
- Ensure you have the latest NVIDIA drivers

**Apple Silicon (M1/M2/M3):**
- Ollama uses Metal acceleration automatically
- Significantly faster than CPU

**AMD GPUs:**
- Ollama uses ROCm on Linux
- Check [Ollama documentation](https://github.com/ollama/ollama) for compatibility

### Concurrency

Ollama supports concurrent requests. Adjust in your Ollama configuration:

```bash
# Increase concurrent requests (default: 1)
export OLLAMA_NUM_PARALLEL=4
ollama serve
```

### Memory Management

If you experience out-of-memory errors:

1. Use a smaller model (e.g., llama3.2 instead of llama3.1)
2. Reduce context size in Ollama config
3. Ensure no other memory-intensive applications are running

## Switching Between Providers

You can switch between Gemini and Ollama at any time:

```bash
# Run setup again
logintelligence setup

# Choose a different provider
# Your previous configuration is preserved
```

## Troubleshooting

### "Connection refused" Error

**Problem**: LogIntelligence can't connect to Ollama

**Solutions**:
1. Ensure Ollama is running: `ollama serve`
2. Check Ollama is listening: `curl http://localhost:11434/api/tags`
3. Verify OLLAMA_BASE_URL matches your Ollama server URL

### "Model not found" Error

**Problem**: The specified model isn't available

**Solutions**:
1. Pull the model: `ollama pull llama3.1`
2. List available models: `ollama list`
3. Update your configuration to use an available model

### Slow Response Times

**Problem**: AI analysis is taking too long

**Solutions**:
1. Use a smaller/faster model (llama3.2)
2. Enable GPU acceleration (check Ollama logs)
3. Ensure sufficient RAM is available
4. Close other applications to free up resources

### Model Crashes or OOM

**Problem**: Ollama crashes with out-of-memory errors

**Solutions**:
1. Use a smaller model
2. Increase system RAM or swap space
3. Close other applications
4. Use a quantized model (e.g., `llama3.1:7b-q4` instead of `llama3.1:7b`)

## Advanced Configuration

### Custom Ollama Installation

If Ollama is running on a different machine or port:

```bash
# Configure custom Ollama URL
export OLLAMA_BASE_URL=http://192.168.1.100:11434
logintelligence
```

### Using Multiple Models

You can switch models without reconfiguring:

```bash
# Pull multiple models
ollama pull llama3.1
ollama pull mistral

# Update config to use different model
logintelligence setup
```

### Remote Ollama Server

Run Ollama on a more powerful machine and connect remotely:

**On the Ollama server:**
```bash
# Allow remote connections
export OLLAMA_HOST=0.0.0.0:11434
ollama serve
```

**On the LogIntelligence machine:**
```bash
# Point to remote Ollama
export OLLAMA_BASE_URL=http://remote-server:11434
logintelligence
```

## Comparison: Gemini vs Ollama

| Feature | Gemini | Ollama |
|---------|--------|--------|
| **Setup** | Easy (API key only) | Moderate (install + model) |
| **Cost** | Pay per request | Free (after setup) |
| **Privacy** | Data sent to Google | 100% local |
| **Speed** | Very fast | Depends on hardware |
| **Quality** | Excellent | Excellent (larger models) |
| **Offline** | No | Yes |
| **RAM Required** | None | 4-64GB (model dependent) |
| **Disk Space** | None | 2-40GB (model dependent) |

## Best Practices

1. **Start with Llama 3.1**: Good balance of quality and performance
2. **Keep Ollama Updated**: `ollama update` for latest improvements
3. **Monitor Resource Usage**: Use `htop` or Activity Monitor
4. **Pull Models in Advance**: Avoid delays during setup
5. **Use GPU When Available**: Dramatically faster inference

## Getting Help

- **Ollama Documentation**: [https://github.com/ollama/ollama](https://github.com/ollama/ollama)
- **Ollama Discord**: [https://discord.gg/ollama](https://discord.gg/ollama)
- **LogIntelligence Issues**: [https://github.com/charlesinwald/logintelligence/issues](https://github.com/charlesinwald/logintelligence/issues)

## Next Steps

Once you have local LLM running:

1. Test with sample errors: `logintelligence simulate`
2. Monitor model performance in Ollama logs
3. Experiment with different models to find your preference
4. Consider running Ollama on a dedicated server for team use

---

**Note**: Local LLMs require significant computational resources. For low-end hardware or quick testing, consider starting with Gemini and switching to Ollama later.
