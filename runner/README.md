# NOB Runner — Unified Deep Scan

NOB Runner is the local execution engine for the NOB web interface. It runs a fixed, defensive/public-assessment toolchain inside Kali Linux and returns one correlated result.

## Unified engines
- **dnsrecon** — DNS records and public DNS enumeration.
- **subfinder** — passive subdomain discovery.
- **httpx-toolkit** — HTTP status, title, technologies, IP, ASN, CDN/WAF indicators and redirects.
- **whatweb** — web technology fingerprinting.
- **wafw00f** — WAF fingerprinting.
- **nmap** — service/version discovery.
- **sslscan** — TLS/cipher/certificate inspection.
- **nikto** — web-server security/information checks.

The UI presents these as one NOB Deep Scan instead of a tool list. Kali documents these packages as standard tools for information gathering, web assessment and TLS analysis. The runner uses fixed command templates, blocks private/local targets, has execution timeouts, and never accepts arbitrary shell commands.

## Run
```bash
docker build -t nob-runner ./runner
docker run --rm -p 8787:8787 nob-runner
```

Health:
```
curl http://127.0.0.1:8787/health
```

Deep scan:
```
curl -X POST http://127.0.0.1:8787/deep-scan \
  -H "content-type: application/json" \
  -d '{"target":"https://example.com","timeout":90}'
```

## Safety
Use only on systems you own or are explicitly authorized to assess. Before exposing Runner beyond the local machine, add authentication, HTTPS, authorization/allowlisting, resource limits, logging and network egress controls.
