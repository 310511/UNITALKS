# Coturn STUN/TURN Server Docker Image
FROM coturn/coturn:latest
USER root

# Install additional utilities for monitoring
RUN apt-get update && apt-get install -y \
    curl \
    netcat-openbsd \
    net-tools \
    && rm -rf /var/lib/apt/lists/*

# Create configuration directory
RUN mkdir -p /etc/coturn

# Copy configuration file
COPY turnserver.conf /etc/coturn/turnserver.conf

# Create log directory
RUN mkdir -p /var/log/turnserver

# Set permissions
RUN chmod 644 /etc/coturn/turnserver.conf
RUN chmod 755 /var/log/turnserver

# Expose ports
EXPOSE 3478/udp 3478/tcp 5349/tcp 49152-65535/udp

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD nc -z -v -w 2 localhost 3478 || exit 1

# Run coturn with configuration
CMD ["turnserver", "-c", "/etc/coturn/turnserver.conf", "--verbose"]
