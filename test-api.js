require('dotenv').config();

async function testFireworksAPI() {
    console.log('Testing Fireworks AI API...');
    console.log('API Key:', process.env.FIREWORKS_API_KEY ? 'Found' : 'Missing');
    
    try {
        const response = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.FIREWORKS_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
                messages: [
                    {
                        role: 'user',
                        content: 'Say hello in one sentence.'
                    }
                ],
                max_tokens: 50
            })
        });

        console.log('Response Status:', response.status);
        console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
        
        const data = await response.json();
        console.log('Response Data:', JSON.stringify(data, null, 2));
        
        if (response.ok) {
            console.log('✅ API test successful!');
            console.log('AI Response:', data.choices[0].message.content);
        } else {
            console.log('❌ API test failed');
        }
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
}

testFireworksAPI();