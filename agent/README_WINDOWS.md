# Fast Print Service - Windows Print Agent Guide

Universal local print spooler agent for Indian print shops, xerox centers, and cyber cafes.

## Supported Operating Systems
- **Windows 11** (Home, Pro, Enterprise - 64-bit & ARM64)
- **Windows 10** (Version 1809+, 32-bit & 64-bit)
- **Windows Server 2019 / 2022**

## Supported Printers & Hardware
- **USB Laser & Inkjet Printers** (HP LaserJet, Canon LBP/imageRUNNER, Epson EcoTank, Brother MFC)
- **Network / Wi-Fi Printers** (IP Spoolers, RAW 9100, WSD ports)
- **Heavy Commercial Copiers** (Xerox VersaLink, Ricoh Aficio, Konica Minolta Bizhub)

## How to Install and Run
1. Log in to your Shop Dashboard on [Fast Print Service].
2. Copy your **6-digit Agent Pairing Code** from the Windows Agent tab.
3. Extract this folder onto your shop's desktop.
4. Double-click `run_agent.bat`.
5. Enter your Shop ID and Pairing Code when prompted.
6. The agent connects to your cloud dashboard and auto-detects all installed Windows printers!

## Security & Privacy Protections
- **Zero-trust spooling**: Documents only print when explicitly clicked "Accept & Print" by the shop owner.
- **Short-lived cache**: Temp spool files in `%TEMP%\FastPrintSpooler` are immediately wiped after the print command is acknowledged.
- **No inbound open ports**: Agent connects outbound via HTTPS/WSS; your local network firewall remains 100% closed to the public internet.
