#!/bin/bash

echo "🔍 Vision Analysis Setup Script"
echo "=============================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << EOF
# Vision Analysis Configuration
VISION_PROVIDER=moondream_local
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=moondream:latest
MOONDREAM_LOCAL_URL=http://localhost:2020/v1
# MOONDREAM_API_KEY=your_api_key_here
MOONDREAM_BASE_URL=https://api.moondream.ai/v1
ENABLE_FALLBACK=true
EOF
    echo "✅ Created .env.local with default configuration"
else
    echo "⚠️  .env.local already exists. Skipping creation."
fi

echo ""
echo "🤖 Choose your setup:"
echo "1) Ollama (Local - Free, Private)"
echo "2) Moondream Local Station (Local - Free, Fast)"
echo "3) Moondream Cloud API (Cloud - Easy Setup)"
echo "4) Multiple providers (Recommended - with fallback)"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "🦙 Setting up Ollama..."
        echo "Install: brew install ollama (macOS) or curl -fsSL https://ollama.ai/install.sh | sh (Linux)"
        echo "Pull model: ollama pull moondream:latest"
        echo "Start: ollama serve"
        sed -i.bak 's/VISION_PROVIDER=moondream_local/VISION_PROVIDER=ollama/' .env.local
        rm .env.local.bak 2>/dev/null
        ;;
    2)
        echo ""
        echo "🌙 Setting up Moondream Local Station..."
        echo "Your Moondream Station is already configured for localhost:2020"
        echo "Make sure it's running and accessible at http://localhost:2020/v1"
        echo "✅ Configuration already set for Moondream Local Station"
        ;;
    3)
        echo ""
        echo "☁️ Setting up Moondream Cloud API..."
        echo "Get API key from: https://console.moondream.ai"
        read -p "Enter your API key: " api_key
        if [ ! -z "$api_key" ]; then
            sed -i.bak 's/VISION_PROVIDER=moondream_local/VISION_PROVIDER=moondream/' .env.local
            sed -i.bak "s/# MOONDREAM_API_KEY=.*/MOONDREAM_API_KEY=$api_key/" .env.local
            rm .env.local.bak 2>/dev/null
            echo "✅ Updated configuration for cloud API"
        fi
        ;;
    4)
        echo ""
        echo "🔄 Setting up multiple providers..."
        echo "Current primary: Moondream Local Station"
        read -p "Enter Moondream Cloud API key (optional): " api_key
        if [ ! -z "$api_key" ]; then
            sed -i.bak "s/# MOONDREAM_API_KEY=.*/MOONDREAM_API_KEY=$api_key/" .env.local
            rm .env.local.bak 2>/dev/null
            echo "✅ Added cloud API as fallback"
        fi
        echo "You can also install Ollama as another fallback option"
        ;;
esac

echo ""
echo "🎉 Setup complete! Run: npm run dev" 