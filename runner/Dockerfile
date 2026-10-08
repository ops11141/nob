FROM kalilinux/kali-rolling

RUN rm -f /etc/apt/sources.list.d/kali.sources /etc/apt/sources.list.d/*.list \
 && printf '%s\n' 'deb https://http.kali.org/kali kali-rolling main contrib non-free non-free-firmware' > /etc/apt/sources.list \
 && apt-get clean \
 && apt-get -o Acquire::https::Verify-Peer=false -o Acquire::https::Verify-Host=false update \
 && DEBIAN_FRONTEND=noninteractive apt-get -o Acquire::https::Verify-Peer=false -o Acquire::https::Verify-Host=false install -y --no-install-recommends ca-certificates \
 && update-ca-certificates \
 && apt-get update \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      python3 python3-pip nmap whatweb nikto dnsrecon wafw00f sslscan subfinder httpx-toolkit \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip3 install --break-system-packages --no-cache-dir -r requirements.txt
COPY app.py .
EXPOSE 8787
CMD ["uvicorn","app:app","--host","0.0.0.0","--port","8787"]
