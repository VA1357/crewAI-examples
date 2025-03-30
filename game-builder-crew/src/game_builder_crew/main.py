import sys
import yaml
from game_builder_crew.crew import GameBuilderCrew


def run():
    # Replace with your inputs, it will automatically interpolate any tasks and agents information
    print("## Welcome to the Game Crew")
    print('-------------------------------')

    with open('src/game_builder_crew/config/gamedesign.yaml', 'r', encoding='utf-8') as file:
        examples = yaml.safe_load(file)

    inputs = {
        'game' :  examples['spacegame']
    }
    game= GameBuilderCrew().crew().kickoff(inputs=inputs)

    print("\n\n########################")
    print("## Here is the result")
    print("########################\n")
    print("final code for the game:")
    #write to output file
    with open(f"output_game/output_game.html", "w", encoding="utf-8") as f:
            f.write(str(game))
    

def train():
    """
    Train the crew for a given number of iterations.
    """

    with open('src/game_builder_crew/config/gamedesign.yaml', 'r', encoding='utf-8') as file:
        examples = yaml.safe_load(file)

    inputs = {
        'game' : examples['spacegame']
    }
    try:
        GameBuilderCrew().crew().train(n_iterations=int(sys.argv[1]), filename=sys.argv[2], inputs=inputs)

    except Exception as e:
        raise Exception(f"An error occurred while training the crew: {e}")
