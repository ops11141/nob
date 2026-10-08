FROM kalilinux/kali-rolling

RUN printf '%s\n' 'deb https://http.kali.org/kali kali-rolling main contrib non-free non-free-firmware' > /etc/apt/sources.list \
 && rm -f /etc/apt/sources.list.d/*.list \
 && apt-get clean \
 && apt-get update -o Acquire::Retries=3 \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      python3 python3-pip nmap whatweb nikto dnsrecon wafw00f sslscan subfinder httpx-toolkit ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip3 install --break-system-packages --no-cache-dir -r requirements.txt
COPY app.py .
EXPOSE 8787
CMD ["uvicorn","app:app","--host","0.0.0.0","--port","8787"]
