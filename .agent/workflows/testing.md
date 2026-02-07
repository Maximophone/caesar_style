---
description: How to test changes in Caesar Style
---

# Testing Guidelines for Caesar Style

**IMPORTANT**: Do NOT use the browser_subagent tool to test this game.

## Manual Testing

Always ask the user to test changes manually. The game runs at http://localhost:8080 (via `python3 -m http.server 8080`).

When you need verification:
1. Describe what you implemented
2. Ask the user to test specific functionality
3. Wait for their feedback before proceeding

## Example Request
"Could you please test the following in the game at localhost:8080?
- Press '9' to select Farm mode
- Place a Farm near a road
- Observe if [expected behavior]

Let me know what you see!"
