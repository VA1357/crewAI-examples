from crewai import Agent
from textwrap import dedent
#from langchain.llms import Ollama
#from langchain_openai import ChatOpenAI
from gemini_wrapper import GeminiLLM


# This is an example of how to define custom agents.
# You can define as many agents as you want.
# You can also define custom tasks in tasks.py
class CustomAgents:
    def __init__(self):
        #self.OpenAIGPT35 = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0.7)
        #self.OpenAIGPT4 = ChatOpenAI(model_name="gpt-4", temperature=0.7)
        #self.Ollama = Ollama(model="openhermes")
        self.gemini = GeminiLLM()
        print(self.gemini)
    def agent_1_name(self):
        return Agent(
            role="Python Game Developer",
            backstory=dedent("""You are a skilled game developer using Python."""),
            goal=dedent("""Create high-quality games based on user input."""),
            allow_delegation=False,
            verbose=True,
            #llm=self.gemini,  # use Gemini here
        )

    def agent_2_name(self):
        return Agent(
            role="Game Code Reviewer",
            backstory=dedent("""You specialize in reviewing game code for bugs and improvements."""),
            goal=dedent("""Ensure that the final code is error-free and optimized."""),
            allow_delegation=False,
            verbose=True,
            #llm=self.gemini,  # and here
        )