FROM kalilinux/kali-rolling

# Use an official Kali archive mirror directly to avoid the local
# http.kali.org/kali.download redirect loop seen in this Docker environment.
RUN rm -f /etc/apt/sources.list.d/* /etc/apt/sources.list \
 && printf '%s\n' 'deb http://archive-4.kali.org/kali kali-rolling main contrib non-free non-free-firmware' > /etc/apt/sources.list \
 && apt-get clean \
 && apt-get update -o Acquire::Retries=5 \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      python3 python3-fastapi python3-uvicorn nmap whatweb nikto dnsrecon wafw00f sslscan subfinder httpx-toolkit ca-certificates sqlmap wpscan zaproxy metasploit-framework hydra \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY app.py .
EXPOSE 8787
CMD ["python3","-m","uvicorn","app:app","--host","0.0.0.0","--port","8787"]
