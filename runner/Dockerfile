FROM kalilinux/kali-rolling

RUN rm -f /etc/apt/sources.list.d/kali.sources /etc/apt/sources.list.d/*.list \
 && printf '%s\n' 'deb https://http.kali.org/kali kali-rolling main contrib non-free non-free-firmware' > /etc/apt/sources.list \
 && apt-get clean \
 && apt-get update -o Acquire::Retries=5 \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      python3 python3-fastapi python3-uvicorn nmap whatweb nikto dnsrecon wafw00f sslscan subfinder httpx-toolkit ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY app.py .
EXPOSE 8787
CMD ["python3","-m","uvicorn","app:app","--host","0.0.0.0","--port","8787"]
