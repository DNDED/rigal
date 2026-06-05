#!/usr/bin/env bash
set -euo pipefail

RIGAL_VERSION="${RIGAL_VERSION:-latest}"
RIGAL_INSTALL_DIR="${RIGAL_INSTALL_DIR:-$HOME/.rigal/bin}"
RIGAL_REPO="rigal-ai/rigal"

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
echo "║  ⬡  R  I  G  A  L                   ║"
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
mkdir -p "$RIGAL_INSTALL_DIR"

# Determine binary name
BINARY_NAME="rigal-${OS}-${ARCH}"
if [ "$OS" = "windows" ]; then
  BINARY_NAME="${BINARY_NAME}.exe"
fi

# Download binary
if [ "$RIGAL_VERSION" = "latest" ]; then
  DOWNLOAD_URL="https://github.com/${RIGAL_REPO}/releases/latest/download/${BINARY_NAME}"
else
  DOWNLOAD_URL="https://github.com/${RIGAL_REPO}/releases/download/v${RIGAL_VERSION}/${BINARY_NAME}"
fi

echo -e "${DIM}Downloading RIGAL v${RIGAL_VERSION}...${RESET}"

if command -v curl &> /dev/null; then
  curl -fsSL "$DOWNLOAD_URL" -o "$RIGAL_INSTALL_DIR/rigal"
elif command -v wget &> /dev/null; then
  wget -q "$DOWNLOAD_URL" -O "$RIGAL_INSTALL_DIR/rigal"
else
  echo -e "${RED}Error: curl or wget is required${RESET}"
  exit 1
fi

# Make executable
if [ "$OS" != "windows" ]; then
  chmod +x "$RIGAL_INSTALL_DIR/rigal"
fi

# Add to PATH
if echo "$PATH" | grep -q "$RIGAL_INSTALL_DIR"; then
  echo -e "${GREEN}✓ Already in PATH${RESET}"
else
  SHELL_CONFIG=""
  case "$SHELL" in
    */zsh)  SHELL_CONFIG="$HOME/.zshrc" ;;
    */bash) SHELL_CONFIG="$HOME/.bashrc" ;;
    */fish) SHELL_CONFIG="$HOME/.config/fish/config.fish" ;;
  esac

  if [ -n "$SHELL_CONFIG" ]; then
    if [ ! -f "$SHELL_CONFIG" ] || ! grep -q "RIGAL" "$SHELL_CONFIG" 2>/dev/null; then
      echo "" >> "$SHELL_CONFIG"
      echo "# RIGAL - Universal AI Coding Harness" >> "$SHELL_CONFIG"
      echo "export PATH=\"$RIGAL_INSTALL_DIR:\$PATH\"" >> "$SHELL_CONFIG"
      echo -e "${GREEN}✓ Added to PATH in $SHELL_CONFIG${RESET}"
    fi
  else
    echo -e "${GRAY}Add this to your shell config:${RESET}"
    echo -e "  export PATH=\"$RIGAL_INSTALL_DIR:\$PATH\""
  fi
fi

echo ""
echo -e "${GREEN}${BOLD}✓ RIGAL installed successfully!${RESET}"
echo ""
echo -e "  ${AURORA}rigal${RESET} ${GRAY}# Start the coding harness${RESET}"
echo ""
echo -e "${DIM}Quick setup:${RESET}"
echo -e "  ${AURORA}export ANTHROPIC_API_KEY=your-key${RESET}"
echo -e "  ${AURORA}export OPENAI_API_KEY=your-key${RESET}"
echo -e "  ${AURORA}rigal${RESET}"
echo ""
echo -e "${DIM}Or use OAuth (no API key needed):${RESET}"
echo -e "  ${AURORA}rigal${RESET}"
echo -e "  ${GRAY}> Choose [3] Codex OAuth for free browser login${RESET}"
echo ""
