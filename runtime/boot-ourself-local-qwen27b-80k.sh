#!/bin/sh
set -eu

export OURSELF_MODEL="ourself-qwen38-27b-iq2s-80k:latest"
export OURSELF_LLAMA_BASE_URL="http://127.0.0.1:8080"
export OURSELF_SERVER_BIND_HOST="127.0.0.1"
export OURSELF_SERVER_PORT="3000"

MODEL_PATH="${OURSELF_QWEN_GGUF:?Set OURSELF_QWEN_GGUF to the local Qwen 27B GGUF path}"

if ! command -v llama-server >/dev/null 2>&1; then
  echo "LLAMA_SERVER_MISSING: install/build llama.cpp before boot" >&2
  exit 1
fi

echo "OURSELF_COGNITION_SUBSTRATE=LLAMA_CPP"
echo "OURSELF_MODEL=${OURSELF_MODEL}"
echo "OURSELF_CONTEXT=80000"
echo "LLAMA_MODEL=${MODEL_PATH}"
echo "LLAMA_ENDPOINT=${OURSELF_LLAMA_BASE_URL}"

llama-server \
  -m "${MODEL_PATH}" \
  --alias "${OURSELF_MODEL}" \
  --ctx-size 80000 \
  --jinja \
  --host 127.0.0.1 \
  --port 8080 \
  > /tmp/ourself-llama-server.log 2>&1 &

LLAMA_PID=$!
trap 'kill "$LLAMA_PID" 2>/dev/null || true' EXIT

READY=0
for _ in $(seq 1 120); do
  if curl -fsS http://127.0.0.1:8080/health >/dev/null 2>&1; then
    READY=1
    break
  fi
  sleep 1
done

if [ "$READY" -ne 1 ]; then
  echo "LLAMA_SERVER_NOT_READY: see /tmp/ourself-llama-server.log" >&2
  exit 1
fi

echo "LLAMA_SERVER_READY=1"
exec node /Users/millysituated/OURSELF/FLOWACTIONSELFWORK/runtime/ourself-mcp-model-server.mjs
