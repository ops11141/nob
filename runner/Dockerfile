FROM kalilinux/kali-rolling

# Docker's current network path has a TLS certificate-validation problem
# reaching Kali's Cloudflare CDN. Keep APT package signature verification
# enabled, but disable only HTTPS peer/host verification for this bootstrap.
RUN rm -f /etc/apt/sources.list.d/* /etc/apt/sources.list \
 && printf '%s\n' 'deb https://kali.download/kali kali-rolling main contrib non-free non-free-firmware' > /etc/apt/sources.list \
 && printf '%s\n' 'Acquire::https::Verify-Peer "false";' 'Acquire::https::Verify-Host "false";' > /etc/apt/apt.conf.d/99nob-kali-tls \
 && apt-get clean \
 && apt-get update -o Acquire::Retries=5 \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      python3 python3-fastapi python3-uvicorn nmap whatweb nikto dnsrecon wafw00f sslscan subfinder httpx-toolkit ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY app.py .
EXPOSE 8787
CMD ["python3","-m","uvicorn","app:app","--host","0.0.0.0","--port","8787"]
