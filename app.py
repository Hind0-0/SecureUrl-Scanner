import requests
import time
from flask import Flask, render_template, request, jsonify, session
from datetime import datetime
import os
import secrets

app = Flask(__name__)
app.secret_key = secrets.token_hex(16)

# Configuration
API_KEY = '09308f3e339dee6433a1a511ee8c0a410d89ff5893432a9629db5e3b6950ba92'
VT_URL = 'https://www.virustotal.com/api/v3/urls'

@app.route('/')
def index():
    # Initialize scan history if it doesn't exist
    if 'scan_history' not in session:
        session['scan_history'] = []
    
    return render_template('index.html', scan_history=session['scan_history'])

@app.route('/scan', methods=['POST'])
def scan_url():
    url = request.form.get('url', '').strip()
    
    if not url:
        return jsonify({'error': 'No URL provided'}), 400
    
    # Basic URL validation (could be enhanced)
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url

    try:
        # Submit URL for scanning
        response = requests.post(
            VT_URL,
            headers={'x-apikey': API_KEY},
            data={'url': url}
        )
        
        if response.status_code != 200:
            return jsonify({'error': f"Error submitting URL: {response.status_code}"}), 500

        analysis_id = response.json()['data']['id']
        
        # Get initial results
        analysis_url = f'https://www.virustotal.com/api/v3/analyses/{analysis_id}'
        result = requests.get(analysis_url, headers={'x-apikey': API_KEY})
        
        if result.status_code != 200:
            return jsonify({'error': 'Error fetching analysis'}), 500
        
        # Process results
        data = result.json()['data']
        stats = data['attributes']['stats']
        
        # Calculate threat level
        malicious = stats['malicious']
        suspicious = stats['suspicious']
        threat_level = "Safe"
        
        if malicious > 0:
            threat_level = "High Risk" if malicious > 5 else "Moderate Risk"
        elif suspicious > 0:
            threat_level = "Low Risk"
        
        # Format timestamp
        scan_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Save to history (most recent first)
        scan_result = {
            'url': url,
            'time': scan_time,
            'stats': stats,
            'threat_level': threat_level
        }
        
        history = session.get('scan_history', [])
        history.insert(0, scan_result)  # Add to beginning
        # Keep only the 10 most recent scans
        session['scan_history'] = history[:10]
        session.modified = True
        
        return jsonify({
            'success': True,
            'url': url,
            'time': scan_time,
            'stats': stats,
            'threat_level': threat_level
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/clear_history', methods=['POST'])
def clear_history():
    session['scan_history'] = []
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(debug=True)