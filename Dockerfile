# Small NGINX image configured to run as an unprivileged user on port 8080.
# Dockerfile.baseline is for isolated before-scan evidence only; never deploy it.
FROM nginxinc/nginx-unprivileged:stable-alpine

USER 0
# Patch the critical Brotli package flagged by the initial Trivy run.
RUN apk update \
 && apk upgrade brotli-libs \
 && rm -rf /var/cache/apk/*

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --chown=101:101 index.html security.html styles.css app.js map.js traffic-dashboard.js favicon.svg /usr/share/nginx/html/
COPY --chown=101:101 data/ /usr/share/nginx/html/data/
COPY --chown=101:101 .well-known/security.txt /usr/share/nginx/html/.well-known/security.txt
RUN chmod 0444 /usr/share/nginx/html/index.html /usr/share/nginx/html/security.html /usr/share/nginx/html/styles.css /usr/share/nginx/html/app.js /usr/share/nginx/html/map.js /usr/share/nginx/html/traffic-dashboard.js /usr/share/nginx/html/favicon.svg /usr/share/nginx/html/data/traffic.json /usr/share/nginx/html/.well-known/security.txt \
 && chmod 0444 /etc/nginx/conf.d/default.conf
USER 101:101
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
