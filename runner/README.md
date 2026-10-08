# NOB Runner

NOB Runner is the execution layer for the NOB web interface. It is intended for a Linux/Kali host controlled by the project owner.

## Current tools
- nmap
- whatweb
- nikto
- dnsrecon

The first release uses fixed command templates, blocks local/private targets, does not accept arbitrary shell commands, and enforces execution timeouts. Only targets the operator is authorized to assess should be submitted.

## Run
```bash
docker build -t nob-runner ./runner
docker run --rm -p 8787:8787 nob-runner
```

Health:
```
GET /health
```

Run:
```
POST /run
{"tool":"nmap","target":"example.com"}
```

## Production hardening
Put the Runner behind authentication, HTTPS, an allowlist/authorization layer, resource limits, logging, and network egress controls before exposing it to the public internet.
