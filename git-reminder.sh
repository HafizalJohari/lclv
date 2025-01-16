#!/bin/bash

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
        echo -e "${RED}❌ Not a git repository${NC}"
        exit 1
    fi
}

# Function to check git status
check_git_status() {
    local changes=$(git status --porcelain)
    local unpushed=$(git log @{u}.. 2>/dev/null)
    
    if [[ -n "$changes" ]]; then
        echo -e "${YELLOW}🚨 UNCOMMITTED CHANGES:${NC}"
        git status --short
        return 1
    elif [[ -n "$unpushed" ]]; then
        echo -e "${YELLOW}📤 UNPUSHED COMMITS:${NC}"
        git log --oneline @{u}..
        return 2
    else
        echo -e "${GREEN}✅ Repository is clean and up to date!${NC}"
        return 0
    fi
}

# Function for desktop notifications
send_notification() {
    local title="$1"
    local message="$2"
    
    # Check which notification system to use
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        osascript -e "display notification \"$message\" with title \"$title\""
    elif command -v notify-send >/dev/null; then
        # Linux with notify-send
        notify-send "$title" "$message"
    fi
}

# Function to show help
show_help() {
    echo "Git Reminder - Never forget to commit again!"
    echo
    echo "Usage: ./git-reminder.sh [option]"
    echo
    echo "Options:"
    echo "  -c, --check     Check git status only"
    echo "  -n, --notify    Send desktop notification if changes exist"
    echo "  -w, --watch     Watch mode (checks every 5 minutes)"
    echo "  -h, --help      Show this help message"
    echo
}

# Main logic
main() {
    check_git_repo
    
    case "$1" in
        -c|--check)
            check_git_status
            ;;
        -n|--notify)
            if ! check_git_status >/dev/null; then
                send_notification "Git Reminder" "You have uncommitted changes in your repository!"
            fi
            ;;
        -w|--watch)
            echo "Watching repository for changes (Ctrl+C to stop)..."
            while true; do
                check_git_status
                sleep 300 # 5 minutes
            done
            ;;
        -h|--help)
            show_help
            ;;
        *)
            check_git_status
            ;;
    esac
}

# Run main with all arguments
main "$@"