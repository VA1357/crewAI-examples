from crewai import Task
from textwrap import dedent

class CustomTasks:
    def task_generate_game_design(self, agent, user_prompt):
        return Task(
            description=dedent(f"""
                Based on the following user input, describe how to modify the space shooter game template:
                
                ---
                {user_prompt}
                ---

                Specify clear gameplay features such as:
                - Player ship behavior
                - Enemy types (focus on adding new enemies)
                - Power-ups
                - Scoring mechanics
                - UI changes (if any)
                - Any new levels or difficulty adjustments

                Output as a structured game design plan.
            """),
            expected_output="A structured list of game design features and changes.",
            agent=agent,
        )

    def task_modify_template_code(self, agent, game_design_plan, template_html, template_js, template_config):
        return Task(
            description=dedent(f"""
                Use the following base files of a space shooter game:

                HTML:
                {template_html}

                JavaScript:
                {template_js}

                Config:
                {template_config}

                Modify the game by applying the design plan below:
                {game_design_plan}

                You must:
                - Only output modified versions of the 3 files (if no clear additions, add a new enemy)
                - Ensure the modified files work together seamlessly
                - Inject new logic cleanly and keep existing structure where possible
            """),
            expected_output="The fully updated HTML, JS, and config files.",
            agent=agent,
        )

    def task_review_code(self, agent, html_code, js_code, config_code):
        return Task(
            description=dedent(f"""
                Review the following modified code for bugs, syntax issues, or logic flaws.

                HTML:
                {html_code}

                JavaScript:
                {js_code}

                Config:
                {config_code}

                If any issues are found, correct them in your output. Otherwise, approve the files.
            """),
            expected_output="Reviewed and corrected versions of HTML, JS, and config files.",
            agent=agent,
        )
