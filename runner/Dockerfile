FROM kalilinux/kali-rolling
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends python3 python3-pip nmap whatweb nikto dnsrecon ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip3 install --break-system-packages --no-cache-dir -r requirements.txt
COPY app.py .
EXPOSE 8787
CMD ["uvicorn","app:app","--host","0.0.0.0","--port","8787"]
