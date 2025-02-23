def strip_markdown_code_blocks(response: str) -> str:
    """
    Strip markdown code block markers from the response.
    Specifically removes ```html at the start and ``` at the end.
    
    Args:
        response: The response string that may contain markdown code block markers
        
    Returns:
        str: The cleaned response without markdown code block markers
    """
    # Remove ```html from the start if it exists
    if response.startswith('```html'):
        response = response[7:]  # Length of ```html is 7
    elif response.startswith('```'):
        response = response[3:]  # Length of ``` is 3
        
    # Remove ``` from the end if it exists
    if response.endswith('```'):
        response = response[:-3]  # Remove last 3 characters
        
    # Strip any leading/trailing whitespace
    response = response.strip()
    
    return response 