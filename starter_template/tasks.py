from crewai import Task
from textwrap import dedent

class CustomTasks:

    def task_generate_game_design(self, agent, user_prompt):
        return Task(
            description=dedent("""
                Based on the following user input:
                ---
                {user_prompt}
                ---           
                Always create a comprehensive design document for a space shooter game.

                The design must describe, regardless of user input specifications:
                - Core gameplay loop (movement, shooting, enemies)
                - Player controls (keyboard/mouse)
                - Enemy types and behaviors
                - Bullet collision logic
                - UI components (Play button, HUD, Game Over)
                - Victory/Restart mechanics

                Do not include power-ups or advanced features unless requested.

                Be concise but complete. Focus on what is required for a **fully playable game**.
            """),
            expected_output=dedent("""
                A clear bullet-point list of features, mechanics, and gameplay elements.
                This will be used by developers to implement the actual game files.
            """),
            agent=agent,
        )

    def task_generate_game_js(self, agent, game_design, template_js):
        return Task(
            description=dedent(f"""
                Implement a complete `game.js` file using the following design plan:

                ---
                {game_design}
                ---

                Implement the core game functionality in `game.js` using the base template provided:
                {template_js}

                Implement:
                - Ship movement (WASD)
                - Mouse-based aiming and shooting
                - Enemy spawning and behavior
                - Bullet-enemy collisions
                - Score, health, and game-over logic
                - Game loop via requestAnimationFrame

                ✅ You must generate a **complete and runnable** game.js file.

                ⚠️ Do NOT include placeholders like "rest of logic here".
                ⚠️ Avoid powerups, towers, shields, or other optional features.

                Assume missing images or sounds will be patched later.
            """),
            expected_output=dedent("""
                A full game.js file that implements core functionality and does not crash.
            """),
            agent=agent,
        )

    def task_generate_ui(self, agent, game_design, template_html, template_css):
        return Task(
            description=dedent(f"""
                Generate `index.html` and `style.css` files for a sci-fi themed space shooter game.

                Use these base templates:
                HTML:
                {template_html}

                CSS:
                {template_css}

                Refer to this design plan:
                {game_design}

                HTML should include:
                - Play button to start the game
                - Canvas element for rendering
                - HUD for health, score, and timer
                - Optional Game Over and Instructions screens

                CSS must:
                - Style the layout, buttons, and screens for both desktop and mobile
                - Include canvas styling and hide/show screens appropriately

                Output format:
                {{
                  "html": "...complete index.html...",
                  "css": "...complete style.css..."
                }}
            """),
            expected_output="A JSON object with full HTML and CSS contents.",
            agent=agent,
        )

    def task_quality_review(self, agent, html_code, css_code, js_code):
        return Task(
            description=dedent(f"""
                Review the following files for functionality and completeness:

                HTML:
                {html_code}

                CSS:
                {css_code}

                JS:
                {js_code}

                ✅ Check that:
                - Play button starts the game
                - Canvas appears and game loop runs
                - Ship can move and shoot
                - Enemies spawn and can be destroyed
                - No TODOs, stubs, or missing logic exist

                ❌ Do not add new features. Just fix bugs or missing logic if found.

                Return the final version of all three files, ready to run.
                
                Output format:
                {{
                "html": "...",
                "js": "...",
                "css": "..."
                }}
            """),
            expected_output="Fully corrected HTML, JS, and CSS code as a JSON object.",
            agent=agent,
        )
