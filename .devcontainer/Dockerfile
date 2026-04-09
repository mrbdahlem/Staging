FROM mcr.microsoft.com/devcontainers/javascript-node:1-22-bookworm

USER root

RUN npx --yes playwright@1.54.2 install --with-deps chromium

USER node
