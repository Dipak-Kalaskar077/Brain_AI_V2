import os
import google.generativeai as genai

# Configure with your API key from environment variable
api_key = os.getenv('GEMINI_API_KEY')
if not api_key:
    raise ValueError('GEMINI_API_KEY environment variable is required')
genai.configure(api_key=api_key)

# List available models
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        print(f"Model name: {m.name}")
        print(f"Supported generation methods: {m.supported_generation_methods}")
        print("-" * 50)

# Test the model
model = genai.GenerativeModel('gemini-pro')
try:
    response = model.generate_content('Say hello!')
    print("\nTest response:", response.text)
except Exception as e:
    print("\nError:", str(e))
