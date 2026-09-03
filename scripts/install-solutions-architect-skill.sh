#!/usr/bin/env bash
set -euo pipefail

TARGET_DIR="${1:-.}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KIT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

mkdir -p "${TARGET_DIR}/.agents/skills/solutions-architect"
mkdir -p "${TARGET_DIR}/docs"

cp -R "${KIT_DIR}/.agents/skills/solutions-architect" "${TARGET_DIR}/.agents/skills/"
cp "${KIT_DIR}/docs/solution-architect-prompt.md" "${TARGET_DIR}/docs/solution-architect-prompt.md"
cp "${KIT_DIR}/AGENTS.md" "${TARGET_DIR}/AGENTS.md"

echo "Installed solutions-architect skill into ${TARGET_DIR}"
echo "Use: /solutions-architect <project story>"
echo "Or: Use the solutions-architect skill for this project story: <project story>"
