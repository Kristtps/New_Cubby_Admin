# Raspberry Pi Integration Guide

## Overview
This guide will help you connect your CoinCubby Admin Panel to a Raspberry Pi that controls the physical locker hardware.

## Architecture

```
┌─────────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  Admin Panel (Web)  │ ←──────→│    Supabase      │←───────→│  Raspberry Pi   │
│  (Your Computer)    │  HTTPS  │   (Database)     │  HTTPS  │  (Hardware)     │
└─────────────────────┘         └──────────────────┘         └─────────────────┘
                                                                      │
                                                                      ↓
                                                              ┌─────────────────┐
                                                              │ Locker Hardware │
                                                              │  (Relays/Locks) │
                                                              └─────────────────┘
```

## Prerequisites

### On Raspberry Pi:
- Raspberry Pi 3/4/5 (recommended)
- Raspbian OS (or Raspberry Pi OS)
- Python 3.7+ installed
- Internet connection (WiFi or Ethernet)
- GPIO pins connected to locker hardware

### On Your Computer:
- CoinCubby Admin Panel (current setup)
- Supabase project credentials
- SSH access to Raspberry Pi

## Step 1: Raspberry Pi Setup

### 1.1 Install Required Software

SSH into your Raspberry Pi:
```bash
ssh pi@<raspberry-pi-ip-address>
```

Update system:
```bash
sudo apt update
sudo apt upgrade -y
```

Install Python dependencies:
```bash
sudo apt install python3-pip python3-dev -y
pip3 install --upgrade pip

# Install required libraries
pip3 install supabase-py python-dotenv gpiozero
```

### 1.2 Enable GPIO
```bash
# Enable GPIO (usually enabled by default)
sudo raspi-config
# Navigate to: Interface Options → GPIO → Enable
```

## Step 2: Create Raspberry Pi Controller Script

Create project directory:
```bash
mkdir -p ~/coincubby-controller
cd ~/coincubby-controller
```

Create the main controller script:
```bash
nano locker_controller.py
```

Paste the controller code (see next section).

## Step 3: Raspberry Pi Controller Code

Create a `.env` file for configuration:
```bash
nano .env
```

Add your Supabase credentials:
```
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-anon-key
DEVICE_ID=DEV-01
MODULE_ID=your-module-id
POLL_INTERVAL=2
```

## Step 4: Testing the Connection

### Test Supabase Connection:
```bash
python3 test_connection.py
```

### Test GPIO (LED blink test):
```bash
python3 test_gpio.py
```

### Run the controller:
```bash
python3 locker_controller.py
```

## Step 5: Admin Panel Configuration

The admin panel is already configured to work with Supabase. The Raspberry Pi will:
1. Monitor the `lockers` table for status changes
2. Control physical locks via GPIO
3. Update locker status in real-time

## Hardware Connection

### GPIO Pin Mapping Example:
```
Raspberry Pi GPIO    →    Locker Hardware
─────────────────────────────────────────
GPIO 17 (Pin 11)     →    Lock 1 Relay
GPIO 18 (Pin 12)     →    Lock 2 Relay
GPIO 27 (Pin 13)     →    Lock 3 Relay
GPIO 22 (Pin 15)     →    Lock 4 Relay
...
Ground (Pin 6)       →    Common Ground
5V (Pin 2)          →    Relay VCC
```

## Security Recommendations

1. **Use environment variables** for credentials (never hardcode)
2. **Enable firewall** on Raspberry Pi
3. **Use SSH keys** instead of passwords
4. **Keep system updated** regularly
5. **Use Supabase RLS** (Row Level Security) policies

## Troubleshooting

### Raspberry Pi Can't Connect to Supabase
```bash
# Check internet connection
ping google.com

# Check Python dependencies
pip3 list | grep supabase

# Check credentials
cat .env
```

### GPIO Not Working
```bash
# Check GPIO status
gpio readall

# Test with a simple LED
python3 -c "from gpiozero import LED; led = LED(17); led.on()"
```

### Admin Panel Not Updating
1. Check Supabase credentials in `js/supabase-client.js`
2. Open browser console for errors
3. Verify network connectivity
4. Check Supabase dashboard for real-time subscriptions

## Running as a Service

Create systemd service for auto-start:
```bash
sudo nano /etc/systemd/system/coincubby.service
```

Add service configuration (see next section).

Enable and start service:
```bash
sudo systemctl enable coincubby.service
sudo systemctl start coincubby.service
sudo systemctl status coincubby.service
```

## Monitoring

### View logs:
```bash
# Real-time logs
sudo journalctl -u coincubby.service -f

# Last 100 lines
sudo journalctl -u coincubby.service -n 100
```

### Check status:
```bash
sudo systemctl status coincubby.service
```

## Next Steps

1. ✅ Set up Raspberry Pi hardware
2. ✅ Install software dependencies
3. ✅ Configure environment variables
4. ✅ Test connection
5. ✅ Deploy controller script
6. ✅ Set up systemd service
7. ✅ Test with admin panel

## Support

For issues:
1. Check logs first
2. Verify network connectivity
3. Test Supabase connection independently
4. Check GPIO hardware connections
5. Review admin panel browser console

## API Endpoints (Future Enhancement)

If you want direct Raspberry Pi API:
- `GET /lockers` - Get all locker statuses
- `POST /lockers/:id/unlock` - Unlock specific locker
- `POST /lockers/:id/lock` - Lock specific locker
- `GET /health` - Check system health

This would require setting up a Flask/FastAPI server on the Pi.
