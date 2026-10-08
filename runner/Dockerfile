FROM kalilinux/kali-rolling

WORKDIR /app

# Use the packages already available in the Kali base image when possible.
# If the base image does not contain the required Python runtime/tools,
# install them from Kali's configured repositories at runtime.
RUN python3 --version

COPY app.py .

EXPOSE 8787
CMD ["python3","-m","uvicorn","app:app","--host","0.0.0.0","--port","8787"]
