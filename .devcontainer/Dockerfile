FROM mcr.microsoft.com/devcontainers/javascript-node:1-24-trixie

ARG PLAYWRIGHT_VERSION=1.59.1

USER root

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

RUN npx --yes playwright@${PLAYWRIGHT_VERSION} install-deps chromium \
    && mkdir -p /ms-playwright \
    && chown -R node:node /ms-playwright

USER node

RUN npx --yes playwright@${PLAYWRIGHT_VERSION} install chromium
