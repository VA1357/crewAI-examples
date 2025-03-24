from crewai import Agent
from textwrap import dedent
from gemini_wrapper import GeminiLLM

class CustomAgents:
    def __init__(self):
        self.gemini = GeminiLLM()

    def game_designer_agent(self):
        return Agent(
            role="Game Designer",
            goal="Plan improvements and new features for a space shooter game based on user input. Focus on adding new enemies to make the game more interesting if no extra additions are specified.",
            backstory=dedent("""
                You are a creative game designer with a deep understanding of game mechanics, pacing, and user engagement.
                You work specifically on HTML5-based arcade games and have experience balancing fun with technical constraints.
            """),
            allow_delegation=False,
            verbose=True,
            #llm=self.gemini,
        )

    def frontend_dev_agent(self):
        return Agent(
            role="Frontend Game Developer",
            goal="Implement new game features and improvements in the HTML/CSS/JS template based on design instructions. Specifically add front end components for new features like new enemies (including images) if no specifications specified.",
            backstory=dedent("""
                You are a skilled frontend developer who specializes in building and modifying HTML5 browser games.
                Your task is to inject the designed features cleanly into the existing space shooter game code.
            """),
            allow_delegation=False,
            verbose=True,
            #llm=self.gemini,
        )

    def qa_agent(self):
        return Agent(
            role="Game Quality Analyst",
            goal="Review the generated game code for bugs, inconsistencies, and integration issues.",
            backstory=dedent("""
                You are an expert in spotting issues in JavaScript and HTML game code.
                You run quality control by analyzing logic flaws, rendering bugs, and gameplay inconsistencies.
            """),
            allow_delegation=False,
            verbose=True,
            #llm=self.gemini,
        )
