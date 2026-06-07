#!/usr/bin/env bash
set -euo pipefail

ARGENT_VERSION="${ARGENT_VERSION:-latest}"
ARGENT_INSTALL_DIR="${ARGENT_INSTALL_DIR:-$HOME/.argent/bin}"
ARGENT_REPO="DNDED/argent"

BOLD="\033[1m"
DIM="\033[2m"
AURORA="\033[38;5;51m"
PURPLE="\033[38;5;99m"
WHITE="\033[97m"
RESET="\033[0m"
GREEN="\033[32m"
RED="\033[31m"
GRAY="\033[90m"

echo -e "${BOLD}${AURORA}"
echo "╔══════════════════════════════════════╗"
echo "║                                      ║"
echo "║  ⬡  A  R  G  E  N  T               ║"
echo "║                                      ║"
echo "║  ${WHITE}The Universal AI Coding Harness${AURORA}    ║"
echo "║                                      ║"
echo "╚══════════════════════════════════════╝"
echo -e "${RESET}"

# Detect OS
OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
  Linux)  OS="linux" ;;
  Darwin) OS="darwin" ;;
  MINGW*|MSYS*|CYGWIN*) OS="windows" ;;
  *)      echo -e "${RED}Unsupported OS: $OS${RESET}"; exit 1 ;;
esac

case "$ARCH" in
  x86_64|amd64) ARCH="x64" ;;
  aarch64|arm64) ARCH="arm64" ;;
  *)            echo -e "${RED}Unsupported architecture: $ARCH${RESET}"; exit 1 ;;
esac

echo -e "${DIM}Detected: ${OS}/${ARCH}${RESET}"

# Create install directory
mkdir -p "$ARGENT_INSTALL_DIR"

# Determine binary name
BINARY_NAME="argent-${OS}-${ARCH}"
if [ "$OS" = "windows" ]; then
  BINARY_NAME="${BINARY_NAME}.exe"
fi

# Download binary
if [ "$ARGENT_VERSION" = "latest" ]; then
  DOWNLOAD_URL="https://github.com/${ARGENT_REPO}/releases/latest/download/${BINARY_NAME}"
else
  DOWNLOAD_URL="https://github.com/${ARGENT_REPO}/releases/download/v${ARGENT_VERSION}/${BINARY_NAME}"
fi

echo -e "${DIM}Downloading ARGENT v${ARGENT_VERSION}...${RESET}"

if command -v curl &> /dev/null; then
  curl -fsSL "$DOWNLOAD_URL" -o "$ARGENT_INSTALL_DIR/argent"
elif command -v wget &> /dev/null; then
  wget -q "$DOWNLOAD_URL" -O "$ARGENT_INSTALL_DIR/argent"
else
  echo -e "${RED}Error: curl or wget is required${RESET}"
  exit 1
fi

# Make executable
if [ "$OS" != "windows" ]; then
  chmod +x "$ARGENT_INSTALL_DIR/argent"
fi

# Add to PATH
if echo "$PATH" | grep -q "$ARGENT_INSTALL_DIR"; then
  echo -e "${GREEN}✓ Already in PATH${RESET}"
else
  SHELL_CONFIG=""
  case "$SHELL" in
    */zsh)  SHELL_CONFIG="$HOME/.zshrc" ;;
    */bash) SHELL_CONFIG="$HOME/.bashrc" ;;
    */fish) SHELL_CONFIG="$HOME/.config/fish/config.fish" ;;
  esac

  if [ -n "$SHELL_CONFIG" ]; then
    if [ ! -f "$SHELL_CONFIG" ] || ! grep -q "ARGENT" "$SHELL_CONFIG" 2>/dev/null; then
      echo "" >> "$SHELL_CONFIG"
      echo "# ARGENT - Universal AI Coding Harness" >> "$SHELL_CONFIG"
      case "$SHELL" in
        */fish) echo "set -gx PATH $ARGENT_INSTALL_DIR \$PATH" >> "$SHELL_CONFIG" ;;
        *)      echo "export PATH=\"$ARGENT_INSTALL_DIR:\$PATH\"" >> "$SHELL_CONFIG" ;;
      esac
      echo -e "${GREEN}✓ Added to PATH in $SHELL_CONFIG${RESET}"
    fi
  else
    echo -e "${GRAY}Add this to your shell config:${RESET}"
    echo -e "  export PATH=\"$ARGENT_INSTALL_DIR:\$PATH\""
  fi
fi

echo ""
echo -e "${GREEN}${BOLD}✓ ARGENT installed successfully!${RESET}"
echo ""
echo -e "  ${AURORA}argent${RESET} ${GRAY}# Start the coding harness${RESET}"
echo ""
echo -e "${DIM}Quick setup:${RESET}"
echo -e "  ${AURORA}export ANTHROPIC_API_KEY=your-key${RESET}"
echo -e "  ${AURORA}export OPENAI_API_KEY=your-key${RESET}"
echo -e "  ${AURORA}argent${RESET}"
echo ""
echo -e "${DIM}Or use OAuth (no API key needed):${RESET}"
echo -e "  ${AURORA}argent${RESET}"
echo -e "  ${GRAY}> Choose [3] Codex OAuth for free browser login${RESET}"
echo ""
