#!/usr/bin/env python3
"""
Simple Python server for Tweet Reply Generator
Use this if you don't have Node.js installed yet
"""

import http.server
import socketserver
import json
import urllib.request
import urllib.parse
import os
from urllib.parse import urlparse, parse_qs

PORT = 3000
API_KEY = "your_openrouter_api_key_here"  # Replace with your actual API key

class TweetReplyHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory="public", **kwargs)
    
    def do_POST(self):
        if self.path == '/api/analyze' or self.path == '/api/generate-reply':
            self.handle_api_request()
        else:
            self.send_error(404)
    
    def handle_api_request(self):
        try:
            # Read request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            if API_KEY == "your_openrouter_api_key_here":
                self.send_json_response({"error": "Please set your OpenRouter API key in simple-server.py"}, 400)
                return
            
            # Make request to OpenRouter
            if self.path == '/api/analyze':
                response = self.analyze_tweet(data['tweet'])
            else:
                response = self.generate_reply(data['tweet'], data['preferences'])
            
            self.send_json_response(response)
            
        except Exception as e:
            print(f"Error: {e}")
            self.send_json_response({"error": str(e)}, 500)
    
    def analyze_tweet(self, tweet):
        messages = [
            {
                "role": "system",
                "content": "You are an expert at analyzing social media content. Analyze tweets to understand their purpose, tone, context, and suggest appropriate response strategies."
            },
            {
                "role": "user",
                "content": f"""Analyze this tweet and provide insights about:
1. Main purpose/intent
2. Tone and sentiment
3. Key topics/themes
4. Suggested response approach
5. Any context clues

Tweet: "{tweet}" """
            }
        ]
        
        result = self.call_openrouter(messages, 300)
        return {"analysis": result}
    
    def generate_reply(self, tweet, preferences):
        length_guide = {
            "short": "1-2 sentences, concise and direct",
            "medium": "2-3 sentences, balanced detail",
            "long": "3-4 sentences, comprehensive response"
        }
        
        messages = [
            {
                "role": "system",
                "content": "You are an expert at writing engaging Twitter replies. Create replies that are authentic, relevant, and match the requested style perfectly. Always stay respectful and constructive."
            },
            {
                "role": "user",
                "content": f"""Generate a Twitter reply to this tweet with these specifications:

Original Tweet: "{tweet}"

Reply Requirements:
- Length: {length_guide.get(preferences.get('length', 'medium'))}
- Writing Style: {preferences.get('style', 'casual')}
- Tone: {preferences.get('tone', 'neutral')}
- Include Emojis: {'Yes' if preferences.get('emoji', False) else 'No'}

Make the reply engaging, relevant, and natural. Don't mention that you're following specifications - just write a great reply."""
            }
        ]
        
        result = self.call_openrouter(messages, 280)
        return {"reply": result}
    
    def call_openrouter(self, messages, max_tokens):
        url = "https://openrouter.ai/api/v1/chat/completions"
        
        payload = {
            "model": "meta-llama/llama-3.1-8b-instruct:free",
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": 0.7
        }
        
        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Tweet Reply Generator"
        }
        
        req = urllib.request.Request(
            url, 
            data=json.dumps(payload).encode('utf-8'),
            headers=headers
        )
        
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            return result['choices'][0]['message']['content']
    
    def send_json_response(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == "__main__":
    print("🐦 Tweet Reply Generator - Python Server")
    print("⚠️  This is a simple server for testing. Use Node.js server for production!")
    print("")
    
    if API_KEY == "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":
        print("❌ Please edit simple-server.py and set your OpenRouter API key")
        print("   Find the line: API_KEY = 'your_openrouter_api_key_here'")
        print("   Replace with: API_KEY = 'your_actual_api_key'")
        print("")
        print("Get your free API key from: https://openrouter.ai/")
        exit(1)
    
    with socketserver.TCPServer(("", PORT), TweetReplyHandler) as httpd:
        print(f"🚀 Server running on http://localhost:{PORT}")
        print("📱 Open http://localhost:3000 in your browser")
        print("⏹️  Press Ctrl+C to stop")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n👋 Server stopped")