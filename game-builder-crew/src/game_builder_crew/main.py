# src/game_builder_crew/main.py
import sys
import yaml
# Adjust path if necessary
sys.path.insert(0, './src')
from game_builder_crew.crew import GameBuilderCrew # Assuming crew file is in this path

# Load .env file if main is run directly
from dotenv import load_dotenv
load_dotenv()

def run():
    print("## Welcome to the Game Crew - Asset Generation")
    print('-------------------------------')

    # Assuming gamedesign.yaml just contains the game name or theme for context
    # If it contains detailed descriptions, load them here instead of hardcoding below
    game_name = "SpaceScape" # Example game name

    with open('src/game_builder_crew/config/gamedesign.yaml', 'r', encoding='utf-8') as file:
        examples = yaml.safe_load(file)

    inputs = {
        'game' :  examples['spacegame'],
        'gameDesc': game_name,

        # Background
        'background_description': "A stunning panoramic view of deep outer space, featuring distant swirling galaxies, nebulae in vibrant blues and purples, and scattered bright stars. Dark, atmospheric.",
        'background_filename': "background", # Base name, no extension

        # Spaceship (Player)
        'spaceship_description': "A player spaceship, medium-sized, sleek silver design with glowing blue engine trails. Slightly weathered look. Front-facing 3/4 view. 3D render style.",
        'spaceship_filename': "player",

        # Void Mine Layer
        'void_mine_layer_description': "An enemy ship designed to deploy mines. Dark metallic hull, perhaps angular or menacing shape, with visible hatches or mechanisms for mine deployment. Subtle red running lights. Space background.",
        'void_mine_layer_filename': "voidMineLayer",

        # ZephyrScout (Enemy)
        'zephyrscout_description': "A small, fast enemy scout ship. Agile design, possibly with prominent engine pods or sharp wings. Minimalistic markings. Appears nimble and quick. Rendered in a style consistent with the player spaceship.",
        'zephyrscout_filename': "enemy", # As requested: ZephyrScout -> enemy.png

        # Nebula Stalker
        'nebula_stalker_description': "A larger, stealthy enemy ship designed for ambushes. Dark, perhaps partially phased or cloaked appearance, maybe with jagged edges blending into a nebula background. Ominous green or purple glow. ",
        'nebula_stalker_filename': "nebula_stalker",

        # Asteroid
        'asteroid_description': "A single, medium-sized asteroid. Irregular shape, cratered surface, shades of grey and brown rock. Floating in space. Realistic texture.",
        'asteroid_filename': "asteroid",

        # Tower
        'tower_description': "A stationary enemy defensive structure resembling a large, metallic ring floating in space. Sections of the ring might have turrets or energy emitters. Central opening is clear. Industrial, slightly menacing space-station aesthetic.",
        'tower_filename': "tower",

    }

    print("Starting Crew kickoff with inputs:")
    # Optionally print inputs for verification, excluding sensitive ones if any
    # for key, value in inputs.items():
    #    print(f"  {key}: {str(value)[:100]}...") # Print snippet

    crew_result = GameBuilderCrew().crew().kickoff(inputs=inputs)

    print("\n\n########################")
    print("## Crew Run Result (Output of last task)")
    print("########################\n")
    # The result here will be the output of the *last* task in the sequence
    print(crew_result)

# Example of how to run (assuming you are in the project root)
if __name__ == "__main__":
    print("--- Starting Run ---")
    run()
    print("--- Run Finished ---")
