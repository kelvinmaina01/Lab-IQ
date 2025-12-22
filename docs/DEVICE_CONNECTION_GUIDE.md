# 🔌 Lab-IQ Device Connection Guide
## Complete Guide to Connecting Laboratory Instruments

> **Status:** Production Ready
> **Last Updated:** December 2025

---

## 📊 Overview

Lab-IQ supports **4 connection methods** for ingesting real-time data from laboratory devices:

1. **MQTT Broker** - Industry standard for IoT devices
2. **Webhook Endpoint** - HTTP POST callbacks
3. **Device Token Auth** - API-based authentication
4. **Edge Gateway** - Coming Soon (for legacy devices)

---

## 🎯 Quick Start

### Prerequisites
1. Lab-IQ account (Free or Pro)
2. Device that can send data over network
3. Basic network connectivity

### Steps
1. Go to **Upload → Live Devices** tab
2. Click **"Connect Device"**
3. Choose connection type
4. Follow setup instructions below

---

## 1️⃣ MQTT Broker Connection

### What is MQTT?
MQTT (Message Queuing Telemetry Transport) is a lightweight messaging protocol perfect for IoT devices. Most modern lab equipment supports MQTT.

### Supported Devices:
- Mass Spectrometers (Thermo Fisher, Agilent)
- Plate Readers (Tecan, BMG Labtech)
- pH Meters (Mettler Toledo)
- Temperature Controllers
- Custom Arduino/Raspberry Pi sensors

### Setup Instructions:

#### Step 1: Get Your MQTT Credentials
```
After creating an MQTT stream in Lab-IQ, you'll receive:
- Broker URL: mqtt://broker.lab-iq.com:1883
- Topic: lab/<your-user-id>/<stream-id>/data
- Username: <generated>
- Password: <generated>
```

#### Step 2: Configure Your Device

**Example: Arduino/ESP32**
```cpp
#include <WiFi.h>
#include <PubSubClient.h>

// WiFi credentials
const char* ssid = "Your_WiFi_SSID";
const char* password = "Your_WiFi_Password";

// MQTT Broker
const char* mqtt_server = "broker.lab-iq.com";
const int mqtt_port = 1883;
const char* mqtt_user = "your_username";
const char* mqtt_pass = "your_password";
const char* mqtt_topic = "lab/user123/stream456/data";

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  connectWiFi();
  client.setServer(mqtt_server, mqtt_port);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // Send data every 10 seconds
  String payload = "{\"temperature\":25.5,\"humidity\":60,\"timestamp\":\"" + String(millis()) + "\"}";
  client.publish(mqtt_topic, payload.c_str());

  delay(10000);
}

void connectWiFi() {
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("WiFi connected");
}

void reconnect() {
  while (!client.connected()) {
    if (client.connect("ESP32Client", mqtt_user, mqtt_pass)) {
      Serial.println("MQTT connected");
    } else {
      delay(5000);
    }
  }
}
```

**Example: Python (for PC-connected devices)**
```python
import paho.mqtt.client as mqtt
import json
import time

# MQTT Configuration
broker = "broker.lab-iq.com"
port = 1883
topic = "lab/user123/stream456/data"
username = "your_username"
password = "your_password"

def on_connect(client, userdata, flags, rc):
    print(f"Connected with result code {rc}")

# Create MQTT client
client = mqtt.Client()
client.username_pw_set(username, password)
client.on_connect = on_connect

# Connect to broker
client.connect(broker, port, 60)

# Start loop
client.loop_start()

# Send data
while True:
    data = {
        "experiment_id": "EXP-001",
        "temperature": 25.5,
        "ph": 7.2,
        "timestamp": time.time()
    }

    client.publish(topic, json.dumps(data))
    print(f"Published: {data}")
    time.sleep(10)
```

#### Data Format Requirements:
```json
{
  "experiment_id": "string (optional)",
  "timestamp": "ISO 8601 or Unix timestamp",
  "measurements": {
    "temperature": 25.5,
    "pressure": 101.3,
    "ph": 7.2
    // Add your custom fields
  }
}
```

---

## 2️⃣ Webhook Endpoint

### What are Webhooks?
Webhooks allow devices to send HTTP POST requests with data whenever an event occurs.

### Supported Devices:
- Cloud-connected instruments
- LIMS systems
- Data acquisition software
- Custom applications

### Setup Instructions:

#### Step 1: Get Your Webhook URL
```
After creating a webhook stream, you'll receive:
- Endpoint: https://api.lab-iq.com/webhooks/<stream-id>
- Secret Key: <generated-secret>
```

#### Step 2: Configure Your Device/Software

**Example: cURL (testing)**
```bash
curl -X POST https://api.lab-iq.com/webhooks/abc123 \
  -H "Content-Type: application/json" \
  -H "X-Lab-IQ-Secret: your-secret-key" \
  -d '{
    "experiment_id": "EXP-001",
    "temperature": 25.5,
    "timestamp": "2025-12-08T10:30:00Z"
  }'
```

**Example: Python**
```python
import requests
import json
from datetime import datetime

webhook_url = "https://api.lab-iq.com/webhooks/abc123"
secret_key = "your-secret-key"

def send_data(data):
    headers = {
        "Content-Type": "application/json",
        "X-Lab-IQ-Secret": secret_key
    }

    response = requests.post(webhook_url, json=data, headers=headers)

    if response.status_code == 200:
        print("Data sent successfully")
    else:
        print(f"Error: {response.status_code}")

# Send data
data = {
    "experiment_id": "EXP-001",
    "measurements": {
        "temperature": 25.5,
        "ph": 7.2
    },
    "timestamp": datetime.utcnow().isoformat()
}

send_data(data)
```

**Example: JavaScript (Node.js)**
```javascript
const axios = require('axios');

const webhookURL = 'https://api.lab-iq.com/webhooks/abc123';
const secretKey = 'your-secret-key';

async function sendData(data) {
  try {
    const response = await axios.post(webhookURL, data, {
      headers: {
        'Content-Type': 'application/json',
        'X-Lab-IQ-Secret': secretKey
      }
    });

    console.log('Data sent:', response.data);
  } catch (error) {
    console.error('Error sending data:', error.message);
  }
}

// Send data
const data = {
  experiment_id: 'EXP-001',
  measurements: {
    temperature: 25.5,
    ph: 7.2
  },
  timestamp: new Date().toISOString()
};

sendData(data);
```

#### Security:
- All requests must include the `X-Lab-IQ-Secret` header
- HTTPS encryption required
- Invalid secrets are rejected with 401 Unauthorized

---

## 3️⃣ Device Token Authentication

### What is Token Auth?
For devices with API capabilities, you can use a generated token to authenticate and send data.

### Supported Devices:
- Instruments with REST API support
- Custom data acquisition systems
- Third-party software integrations

### Setup Instructions:

#### Step 1: Get Your Device Token
```
After creating a token auth stream, you'll receive:
- API Endpoint: https://api.lab-iq.com/v1/data/ingest
- Device Token: Bearer <token>
```

#### Step 2: Send Data to API

**Example: cURL**
```bash
curl -X POST https://api.lab-iq.com/v1/data/ingest \
  -H "Authorization: Bearer your-device-token" \
  -H "Content-Type: application/json" \
  -d '{
    "stream_id": "stream123",
    "data": {
      "experiment_id": "EXP-001",
      "temperature": 25.5,
      "timestamp": "2025-12-08T10:30:00Z"
    }
  }'
```

**Example: Python**
```python
import requests
import json

api_endpoint = "https://api.lab-iq.com/v1/data/ingest"
device_token = "your-device-token"

headers = {
    "Authorization": f"Bearer {device_token}",
    "Content-Type": "application/json"
}

payload = {
    "stream_id": "stream123",
    "data": {
        "experiment_id": "EXP-001",
        "temperature": 25.5,
        "ph": 7.2,
        "timestamp": "2025-12-08T10:30:00Z"
    }
}

response = requests.post(api_endpoint, json=payload, headers=headers)
print(response.json())
```

---

## 4️⃣ Edge Gateway (Coming Soon)

### What is an Edge Gateway?
An edge gateway sits between legacy lab devices (RS-232, Modbus, etc.) and the cloud, translating protocols.

### Will Support:
- RS-232/RS-485 serial devices
- Modbus RTU/TCP devices
- Proprietary protocols
- Legacy instruments

### How It Will Work:
1. Install Lab-IQ Edge Gateway (Raspberry Pi or similar)
2. Connect legacy device via serial/ethernet
3. Configure protocol translation
4. Gateway automatically sends data to Lab-IQ cloud

**Status:** In development. ETA: Q1 2026

---

## 📋 Best Practices

### 1. Data Quality
- Always include timestamps
- Use consistent units (Celsius, Molarity, etc.)
- Validate data before sending
- Handle connection failures gracefully

### 2. Security
- Never hardcode credentials in device firmware
- Use environment variables or secure storage
- Rotate tokens regularly
- Monitor for unauthorized access

### 3. Performance
- Batch data when possible (don't send every millisecond)
- Use appropriate sampling rates (1-60 seconds typical)
- Implement retry logic with exponential backoff
- Monitor connection health

### 4. Troubleshooting
- Check network connectivity first
- Verify credentials are correct
- Ensure data format matches requirements
- Check Lab-IQ status page for outages

---

## 🛠️ Common Device Examples

### Mass Spectrometer (Thermo Fisher)
**Connection:** MQTT or Webhook
**Software:** Xcalibur can export data to network folder
**Setup:** Use file watcher + webhook to send results

### Plate Reader (Tecan Infinite)
**Connection:** MQTT
**Software:** i-control software supports MQTT publish
**Setup:** Configure MQTT settings in i-control

### pH Meter (Mettler Toledo)
**Connection:** Token Auth
**Software:** LabX software has REST API
**Setup:** Use LabX API to pull readings and POST to Lab-IQ

### Arduino/ESP32 Sensors
**Connection:** MQTT (recommended)
**Setup:** Use PubSubClient library (see example above)

### Raspberry Pi Data Logger
**Connection:** MQTT or Webhook
**Language:** Python
**Setup:** Use paho-mqtt or requests library

---

## 🆘 Support & Troubleshooting

### Common Issues:

**"Connection Refused"**
- Check broker/endpoint URL is correct
- Verify network allows outbound connections on port 1883 (MQTT) or 443 (HTTPS)
- Check firewall rules

**"Authentication Failed"**
- Verify username/password or token is correct
- Ensure token hasn't expired
- Check for typos in credentials

**"Data Not Appearing"**
- Verify data format matches requirements
- Check stream status is "active"
- Look for error messages in device logs

**"Intermittent Connection"**
- Check network stability
- Implement reconnection logic
- Use QoS 1 for MQTT (guaranteed delivery)

### Get Help:
- 📧 Email: support@lab-iq.com
- 💬 In-app chat
- 📚 Documentation: https://docs.lab-iq.com
- 🐛 Report bugs: https://github.com/lab-iq/issues

---

## 🚀 Next Steps

1. ✅ Create your first device stream
2. ✅ Configure your device with credentials
3. ✅ Test connection with sample data
4. ✅ Monitor stream status in Lab-IQ dashboard
5. ✅ Set up alerts for connection failures
6. ✅ Integrate with experiments and workflows

---

**Happy connecting! 🔬📊**

*For advanced integrations, enterprise support, or custom protocols, contact our team at enterprise@lab-iq.com*
