from pydantic import BaseModel, Field
from typing import Literal
from ollama import Client
import json


class RouterAgentConfig(BaseModel):
    intent: Literal["analytics", "general_chat", "support"] = Field(
        description="The classified intent of the user request."
    )
    confidence: float = Field(
        description="The confidence score of the intent classification between 0.0 and 1.0."
    )
    reasoning: str = Field(
        description="The reasoning behind the intent classification."
    )
    
    
def router_agent(user_prompt: str):
    client = Client(host="http://localhost:11434")
    
    system_instruction = (
        "You are a routing agent. Analyze the user prompt and classify it into "
        "one of the allowed intents. You must respond ONLY with a JSON object matching "
        "the requested schema."
    )
    
    print(f"Analyzing prompt: '{user_prompt}'...\n")
    
    response = client.chat(
        model="gemma3:4b",
        messages=[
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": user_prompt}
        ],
        format=RouterAgentConfig.model_json_schema() # Forces the model to obey the structure
    )
    
    # Parse the raw text response into our Python object safely
    try:
        raw_content = response['message']['content']
        parsed_output = RouterAgentConfig.model_validate_json(raw_content)
        return parsed_output
    except Exception as e:
        print("Raw Output caused a crash:")
        print(response['message']['content'])
        raise e
    
    

# --- Test Runs ---
if __name__ == "__main__":
    # Test Case A: Should be analytics
    print("-" * 40)
    result_a = router_agent("What is my name?")
    print(f"Parsed JSON Result A:\n{json.dumps(result_a.model_dump(), indent=2)}\n")
    print("-" * 40)
    
    # Test Case B: Should be general_chat
    result_b = router_agent("Hey buddy! What's the capital of France?")
    print(f"Parsed JSON Result B:\n{json.dumps(result_b.model_dump(), indent=2)}\n")