from crewai import Agent
#from gemini_wrapper import GeminiLLM

#llm = GeminiLLM()

class CustomAgents:
    def __init__(self):
        self.GameDesigner = Agent(
            role="Game Designer",
            goal="Design a complete game plan for a simple HTML/JS-based space shooter",
            backstory="You are a game designer focused on crafting fun and balanced mechanics for casual games.",
            verbose=True,
            allow_delegation=True,
            #llm=self.llm,
        )

        self.GameplayEngineer = Agent(
            role="Gameplay Engineer",
            goal="Implement functional game.js code including player movement, shooting, enemies, and collisions",
            backstory="You are a JavaScript game developer focused on gameplay loops and real-time mechanics using HTML canvas.",
            verbose=True,
            allow_delegation=True,
            #llm=self.llm,
        )

        self.UIUXIntegrator = Agent(
            role="UI/UX Integrator",
            goal="Create a complete HTML structure and CSS for game screens, play button, and HUD",
            backstory="You are a front-end developer who ensures the game UI is functional, clean, and responsive.",
            verbose=True,
            allow_delegation=True,
            #llm=self.llm,
        )

        self.QATester = Agent(
            role="Game QA Tester",
            goal="Review all generated code to ensure a fully runnable game with no placeholders or missing code",
            backstory="You specialize in playtesting and code auditing to confirm that the output HTML/JS/CSS forms a playable game.",
            verbose=True,
            allow_delegation=True,
            #llm=self.llm,
        )
