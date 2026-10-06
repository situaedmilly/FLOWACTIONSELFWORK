#!/bin/sh
set -eu

export OURSELF_MODEL="ourself-qwen38-27b-iq2s-80k:latest"
export OLLAMA_BASE_URL="http://127.0.0.1:11434"
export OURSELF_SERVER_BIND_HOST="127.0.0.1"
export OURSELF_SERVER_PORT="3000"

exec node /Users/millysituated/OURSELF/FLOWACTIONSELFWORK/runtime/ourself-mcp-model-server.mjs
