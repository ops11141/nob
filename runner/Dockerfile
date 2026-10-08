FROM kalilinux/kali-rolling

# Pin the build to Kali's official CDN instead of the redirector.
# This avoids mirror-selection redirect loops during Docker builds.
RUN printf '%s\n' 'deb http://kali.download/kali kali-rolling main contrib non-free non-free-firmware' > /etc/apt/sources.list \
 && rm -f /etc/apt/sources.list.d/kali.sources \
 && apt-get clean \
 && apt-get update -o Acquire::Retries=5 \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      python3 python3-fastapi python3-uvicorn nmap whatweb nikto dnsrecon wafw00f sslscan subfinder httpx-toolkit ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY app.py .
EXPOSE 8787
CMD ["python3","-m","uvicorn","app:app","--host","0.0.0.0","--port","8787"]
