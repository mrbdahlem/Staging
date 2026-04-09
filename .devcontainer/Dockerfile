FROM mcr.microsoft.com/devcontainers/javascript-node:1-22-bookworm

USER root

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

RUN npx --yes playwright@1.59.1 install-deps chromium \
    && mkdir -p /ms-playwright \
    && chown -R node:node /ms-playwright

USER node

RUN npx --yes playwright@1.59.1 install chromium
