require('dotenv').config();

async function testOpenRouterAPI() {
    console.log('Testing OpenRouter API...');
    console.log('API Key:', process.env.OPENROUTER_API_KEY ? 'Found' : 'Missing');
    
    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'Tweet Reply Generator Test'
            },
            body: JSON.stringify({
                model: 'mistralai/mistral-7b-instruct:free',
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

testOpenRouterAPI();