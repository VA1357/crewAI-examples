import os
from decouple import config
from dotenv import load_dotenv
from crewai import Crew, LLM
from crewai.crews.crew_output import CrewOutput
from agents import CustomAgents
from tasks import CustomTasks
from textwrap import dedent
import json
import re

# Main execution
if __name__ == "__main__":
    print("## Space Shooter AI Game Builder 🚀")
    print("-----------------------------------")

    # User customizations
    user_prompt = input(dedent("""Describe your custom space shooter features: """))

    # Initialize
    agents = CustomAgents()
    tasks = CustomTasks()

    # Create agents
    designer = agents.GameDesigner
    developer = agents.GameplayEngineer
    ui_developer = agents.UIUXIntegrator  
    reviewer = agents.QATester

    # Assign tasks
    task1 = tasks.task_generate_game_design(designer, user_prompt)
    task2 = tasks.task_generate_game_js(
        developer,
        "{task1.output}",
        "{template_js}"
    )
    task3 = tasks.task_generate_ui(
        ui_developer,
        "{task1.output}",
        "{template_html}",
        "{template_css}"
    )
    task4 = tasks.task_quality_review(
        reviewer,
        "{task3.output[html]}",
        "{task2.output[js]}",
        "{task3.output[css]}"
    )

    print("Using LLM:", type(llm))

    # Build crew
    crew = Crew(
        agents=[designer, developer, ui_developer, reviewer],
        tasks=[task1, task2, task3, task4],
        llm=llm,
        verbose=True,
        #memory=True  # <--- ENABLE MEMORY FOR ITERATIVE IMPROVEMENT
    )

    # Run crew
    result = crew.kickoff()

    # Save results
    output_dir = "output_game"
    os.makedirs(output_dir, exist_ok=True)

    print("\n🧪 Type of result:", type(result))
    print("🔍 Raw result preview:", str(result)[:300])

    try:
        # Convert result to string
        raw_str = str(result)

        # Extract the first full JSON object using regex (non-greedy match between `{` and `}`)
        match = re.search(r"\{.*\}", raw_str, re.DOTALL)
        if match:
            json_text = match.group(0)
            output_data = json.loads(json_text)
        else:
            raise ValueError("No JSON object found in CrewAI result")
    except Exception as e:
        print("\n⚠️ Failed to parse CrewAI result as JSON:")
        print(e)
        output_data = {}

    # Write files if available
    if output_data:
        with open(f"{output_dir}/output_game.html", "w", encoding="utf-8") as f:
            f.write(output_data.get("html", ""))
        with open(f"{output_dir}/output_game.js", "w", encoding="utf-8") as f:
            f.write(output_data.get("js", ""))
        with open(f"{output_dir}/output_game.css", "w", encoding="utf-8") as f:
            f.write(output_data.get("css", ""))
    else:
        print("\n⚠️ Output data is empty or malformed.")

    print("\n✅ Game build complete! Check the 'output_game' folder.")
