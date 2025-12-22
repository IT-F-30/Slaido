#!/bin/bash

# Configuration
CONTAINER_NAME="db-tools"
COMMAND="manage"

function usage() {
    echo "Usage: $0 {add|delete|list|clear} [word] [group]"
    echo ""
    echo "Commands:"
    echo "  add [word] [group]      Add a word to output collection (default group: 2)"
    echo "  delete [word]           Delete a word from output collection"
    echo "  list                    List all documents in output collection"
    echo "  clear                   Clear all data from output collection"
    echo ""
    echo "Examples:"
    echo "  $0 add \"hello\""
    echo "  $0 add \"world\" 1"
    echo "  $0 delete \"hello\""
    echo "  $0 list"
    echo "  $0 clear"
    exit 1
}

if [ $# -lt 1 ]; then
    usage
fi

case $1 in
    add)
        if [ -z "$2" ]; then
            echo "Error: 'add' requires a word."
            usage
        fi
        docker compose exec -T $CONTAINER_NAME $COMMAND add "$2" "${3:-2}"
        ;;
    delete)
        if [ -z "$2" ]; then
            echo "Error: 'delete' requires a word."
            usage
        fi
        docker compose exec -T $CONTAINER_NAME $COMMAND delete "$2"
        ;;
    list)
        docker compose exec -T $CONTAINER_NAME $COMMAND list
        ;;
    clear)
        docker compose exec -T $CONTAINER_NAME $COMMAND clear
        ;;
    *)
        usage
        ;;
esac
