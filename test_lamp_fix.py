import json
with open('test_vaddict_data.json', 'r', encoding='utf-8') as f:
    scores = json.load(f)

for item in scores:
    # Fix the lamps based on the new logic
    # Vaddict HTML classes: comp_max -> MXV, comp_ex -> COMP (HARD), comp -> CLEAR, play -> PLAY
    if item['lamp'] == 'MXV':
        # wait, in my previous parser:
        # elif 'comp_max' in medal_class or 'comp_ex' in medal_class: lamp = 'MXV'
        # elif 'comp' in medal_class: lamp = 'COMP'
        pass # The test_vaddict_data.json already has wrong lamps because of fetch_all_vaddict.py!
