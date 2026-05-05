#!/bin/bash

echo "🏘️  Town Life Simulator - Development Server"
echo "==========================================="
echo ""
echo "Starting server on http://localhost:8000"
echo ""
echo "Available versions:"
echo "  • Original: http://localhost:8000/index.html"
echo "  • Modular:  http://localhost:8000/index-modular.html"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python3 -m http.server 8000
