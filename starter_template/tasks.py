# To know more about the Task class, visit: https://docs.crewai.com/concepts/tasks
from crewai import Task
from textwrap import dedent


class CustomTasks:
    def __tip_section(self):
        return "If you do your BEST WORK, I'll give you a $10,000 commission!"

    def task_1_name(self, agent, var1, var2):
        return Task(
            description=dedent(
                f"""
                You are tasked with creating a simple game in Python.

                {self.__tip_section()}

                Instructions:
                - The user wants the following: {var1}
                - Additional Requirements: {var2}

                Please write clean, functional, and well-commented Python code.
                Do not explain anything, only return the full Python script.
                """
            ),
            expected_output="A full, working Python game script.",
            agent=agent,
        )

    def task_2_name(self, agent):
        return Task(
            description=dedent(
                f"""
                Review the code provided in Task 1.

                {self.__tip_section()}

                Your job is to:
                - Check for syntax or logical errors.
                - Ensure the code works as intended.
                - Make improvements if needed.

                Return the revised code only — no explanations.
                """
            ),
            expected_output="An improved, error-free version of the Python game script.",
            agent=agent,
        )