import os
from google.generativeai import configure, list_models

# Configure with your API key from environment variable
api_key = os.getenv('GEMINI_API_KEY')
if not api_key:
    raise ValueError('GEMINI_API_KEY environment variable is required')
configure(api_key=api_key)

# List all available models
models = list_models()
for model in models:
    print(f"Model name: {model.name}")
    print(f"Display name: {model.display_name}")
    print(f"Description: {model.description}")
    print(f"Generation methods: {model.supported_generation_methods}")
    print("-" * 50)
