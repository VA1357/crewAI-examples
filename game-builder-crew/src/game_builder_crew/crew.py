from typing import List
from crewai import Agent, Crew, Process, Task, LLM
from crewai.project import CrewBase, agent, crew, task
import os

llm = LLM(model=os.getenv("MODEL"))

@CrewBase
class GameBuilderCrew:
    """GameBuilder crew"""
    agents_config = 'config/agents.yaml'
    tasks_config = 'config/tasks.yaml'

    @agent
    def game_logic_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['game_logic_agent'],
            allow_delegation=False,
            verbose=True
        )

    @agent
    def ui_ux_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['ui_ux_agent'],
            allow_delegation=False,
            verbose=True
        )

    @agent
    def user_input_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['user_input_agent'],
            allow_delegation=False,
            verbose=True
        )

    @agent
    def code_integration_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['code_integration_agent'],
            allow_delegation=True,
            verbose=True
        )

    @agent
    def testing_debugging_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['testing_debugging_agent'],
            allow_delegation=False,
            verbose=True
        )

    @task
    def generate_game_logic_task(self) -> Task:
        return Task(
            config=self.tasks_config['generate_game_logic_task'],
            agent=self.game_logic_agent()
        )

    @task
    def design_ui_task(self) -> Task:
        return Task(
            config=self.tasks_config['design_ui_task'],
            agent=self.ui_ux_agent()
        )

    @task
    def handle_user_input_task(self) -> Task:
        return Task(
            config=self.tasks_config['handle_user_input_task'],
            agent=self.user_input_agent()
        )

    @task
    def integrate_code_task(self) -> Task:
        return Task(
            config=self.tasks_config['integrate_code_task'],
            agent=self.code_integration_agent()
        )

    @task
    def test_and_debug_task(self) -> Task:
        return Task(
            config=self.tasks_config['test_and_debug_task'],
            agent=self.testing_debugging_agent()
        )

    @crew
    def crew(self) -> Crew:
        """Creates the GameBuilderCrew"""
        return Crew(
            agents=self.agents,  # Automatically created by the @agent decorator
            tasks=self.tasks,  # Automatically created by the @task decorator
            process=Process.sequential,
            verbose=True, 
            llm=llm
        )