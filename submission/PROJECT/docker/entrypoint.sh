#!/bin/sh
set -eu

mkdir -p \
    "${LARAVEL_STORAGE_PATH}/framework/cache" \
    "${LARAVEL_STORAGE_PATH}/framework/sessions" \
    "${LARAVEL_STORAGE_PATH}/framework/views" \
    "${LARAVEL_STORAGE_PATH}/logs"

exec "$@"
