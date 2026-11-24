#!/usr/bin/env bash
# Usage: ./render.sh configs/example-dark-glow.json [--preview]
BLENDER="${BLENDER:-blender}"
exec "$BLENDER" -b --factory-startup -P "$(dirname "$0")/render_poster.py" -- --config "$@"
