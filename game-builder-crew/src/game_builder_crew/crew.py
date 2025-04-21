# src/game_builder_crew/crew.py
from typing import List
from crewai import Agent, Crew, Process, Task, LLM
from crewai.project import CrewBase, agent, crew, task
import os

# --- Ensure the correct tool is imported from its location ---
# Assuming the tool file is in ./tools/gemini_image_tool.py relative to crew.py
try:
    from .gemini import GeminiImageTool
except ImportError:
    # Fallback if running script directly might change relative path needs
    try:
        from gemini import GeminiImageTool
    except ImportError:
       raise ImportError("Could not import GeminiImageTool. Ensure tools/gemini_image_tool.py exists relative to crew.py")
# -----------------------------------------------------------

# Load environment variables (ensure API key and MODEL are loaded from .env)
from dotenv import load_dotenv
load_dotenv()

# Define the text LLM based on environment variable
# Ensure MODEL env var is set for the text model (e.g., gemini-1.5-flash)
# Use a default if the environment variable is not set
text_llm_model_name = os.getenv("MODEL", "gemini-1.5-flash")
# Note: CrewAI's LLM class might implicitly handle the API key via LiteLLM
# based on the model name prefix if using standard models.
llm = LLM(model=text_llm_model_name)
print(f"Using text LLM for Agents: {text_llm_model_name}") # Add print for confirmation

# Instantiate the image generation tool (which handles its own API key internally)
gemini_image_tool = GeminiImageTool()
print(f"Image Generation Tool Instantiated: {gemini_image_tool.name}")


@CrewBase
class GameBuilderCrew:
    """GameBuilder crew for coding and asset generation"""
    agents_config = 'config/agents.yaml'
    tasks_config = 'config/tasks.yaml'

    # --- Agent Definitions ---
    @agent
    def senior_engineer_agent(self) -> Agent:
        """Agent responsible for writing the game code."""
        return Agent(
            config=self.agents_config['senior_engineer_agent'],
            allow_delegation=False,
            verbose=True,
            llm=llm # Use the configured text LLM
        )

    @agent
    def qa_engineer_agent(self) -> Agent:
        """Agent responsible for reviewing the game code."""
        return Agent(
            config=self.agents_config['qa_engineer_agent'],
            allow_delegation=False,
            verbose=True,
            llm=llm # Use the configured text LLM
        )

    @agent
    def chief_qa_engineer_agent(self) -> Agent:
        """Agent responsible for final code evaluation."""
        return Agent(
            config=self.agents_config['chief_qa_engineer_agent'],
            allow_delegation=True, # Might delegate specific tests
            verbose=True,
            llm=llm # Use the configured text LLM
        )

    @agent
    def concept_artist_agent(self) -> Agent:
        """Agent responsible for generating game assets using image tools."""
        return Agent(
            config=self.agents_config['concept_artist'],
            tools=[gemini_image_tool], # Assign the specific image tool instance
            allow_delegation=False,
            verbose=True,
            llm=llm # Agent still needs an LLM for reasoning and tool usage planning
        )
    
    @agent
    def audio_artist_agent(self) -> Agent:
        """Agent responsible for generating game assets using audio tools."""
        return Agent(
            config=self.agents_config['concept_artist'],
            allow_delegation=False,
            verbose=True,
            llm=llm # Agent still needs an LLM for reasoning and tool usage planning
        )
    # --- End Agent Definitions ---

    # --- Task Definitions ---
    # Code Development Tasks
    @task
    def code_task(self) -> Task:
        """Task for the Senior Engineer to write the game code."""
        return Task(
            config=self.tasks_config['code_task'],
            agent=self.senior_engineer_agent()
            # Add context=[] if this task depends on prior task outputs
        )

    @task
    def review_task(self) -> Task:
        """Task for the QA Engineer to review the code."""
        return Task(
            config=self.tasks_config['review_task'],
            agent=self.qa_engineer_agent(),
            context=[self.code_task()] # Depends on the code being written
        )

    @task
    def evaluate_task(self) -> Task:
        """Task for the Chief QA Engineer to evaluate the code and review."""
        return Task(
            config=self.tasks_config['evaluate_task'],
            agent=self.chief_qa_engineer_agent(),
            context=[self.code_task(), self.review_task()] # Depends on code and review
        )

    # Asset Generation Tasks (assigned to Concept Artist)
    @task
    def generate_background_task(self) -> Task:
        """Task to generate the outer space background asset."""
        return Task(
            config=self.tasks_config['generate_background_task'],
            agent=self.concept_artist_agent()
            # Add context=[] if description depends on previous tasks
        )

    @task
    def generate_spaceship_task(self) -> Task:
        """Task to generate the player spaceship asset."""
        return Task(
            config=self.tasks_config['generate_spaceship_task'],
            agent=self.concept_artist_agent()
        )

    @task
    def generate_void_mine_layer_task(self) -> Task:
        """Task to generate the void mine layer asset."""
        return Task(
            config=self.tasks_config['generate_void_mine_layer_task'],
            agent=self.concept_artist_agent()
        )

    @task
    def generate_zephyrscout_task(self) -> Task:
        """Task to generate the ZephyrScout (enemy) asset."""
        return Task(
            config=self.tasks_config['generate_zephyrscout_task'],
            agent=self.concept_artist_agent()
        )

    @task
    def generate_nebula_stalker_task(self) -> Task:
        """Task to generate the Nebula Stalker asset."""
        return Task(
            config=self.tasks_config['generate_nebula_stalker_task'],
            agent=self.concept_artist_agent()
        )

    @task
    def generate_asteroid_task(self) -> Task:
        """Task to generate the asteroid asset."""
        return Task(
            config=self.tasks_config['generate_asteroid_task'],
            agent=self.concept_artist_agent()
        )

    @task
    def generate_tower_task(self) -> Task:
        """Task to generate the tower asset."""
        return Task(
            config=self.tasks_config['generate_tower_task'],
            agent=self.concept_artist_agent()
        )
    
    @task
    def generate_audio_task(self) -> Task:
        """Generate audio for game sounds"""
        return Task(
            config=self.tasks_config['generate_audio_task'],
            agent=self.audio_artist_agent()
        )
    # --- End Task Definitions ---

    @crew
    def crew(self) -> Crew:
        """Creates the GameBuilder Crew"""
        # The self.tasks list automatically includes all methods decorated with @task.
        # The order they execute depends on the Process type and any context dependencies.
        return Crew(
            agents=self.agents, # Automatically includes all @agent methods
            tasks=self.tasks,   # Automatically includes all @task methods
            process=Process.sequential, # Runs tasks one after another in definition order (unless context forces otherwise)
            verbose=True,
            # memory=True # Enable memory if tasks need to build on each other's detailed outputs
            # llm=llm # Can define a default LLM for the crew/orchestration itself
        )