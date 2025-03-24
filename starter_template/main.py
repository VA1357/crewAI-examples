import os
from decouple import config
from dotenv import load_dotenv
from crewai import Crew, LLM
from agents import CustomAgents
from tasks import CustomTasks
from textwrap import dedent

# Load environment variables
load_dotenv()

# LLM setup (Gemini via LiteLLM)
llm = LLM(model=os.getenv("MODEL"))

# Load template files
def read_template_file(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

template_html = read_template_file("templates/index.html")
template_js = read_template_file("templates/game.js")
template_config = read_template_file("templates/config.js")

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
    designer = agents.game_designer_agent()
    developer = agents.frontend_dev_agent()
    reviewer = agents.qa_agent()

    # Assign tasks
    task1 = tasks.task_generate_game_design(designer, user_prompt)
    task2 = tasks.task_modify_template_code(developer, "{task1.output}", template_html, template_js, template_config)
    task3 = tasks.task_review_code(reviewer, "{task2.output[html]}", "{task2.output[js]}", "{task2.output[config]}")

    # Build crew
    crew = Crew(
        agents=[designer, developer, reviewer],
        tasks=[task1, task2, task3],
        llm=llm,
        verbose=True
    )

    # Run crew
    result = crew.kickoff()

    # Save results
    output_dir = "output_game"
    os.makedirs(output_dir, exist_ok=True)

    if isinstance(result, dict):
        with open(f"{output_dir}/output_game.html", "w", encoding="utf-8") as f:
            f.write(result.get("html", ""))
        with open(f"{output_dir}/output_game.js", "w", encoding="utf-8") as f:
            f.write(result.get("js", ""))
        with open(f"{output_dir}/output_config.js", "w", encoding="utf-8") as f:
            f.write(result.get("config", ""))
    else:
        print("\n⚠️ Unexpected output format. Raw result:\n")
        print(result)

    print("\n✅ Game build complete! Check the 'output_game' folder.")
