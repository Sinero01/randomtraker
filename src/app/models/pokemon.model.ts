export interface MoveLearn {
  level: number;
  name: string;
}

export interface EvolutionDetail {
  targetName: string;
  method: string;
}

export interface PokemonData {
  num: number;
  name: string;
  types: string[];
  stats: {
    hp: number;
    atk: number;
    def: number;
    satk: number;
    sdef: number;
    spd: number;
  };
  abilities: string[];
  heldItems: string;
  evolutions: EvolutionDetail[];
  levelMoves: MoveLearn[];
  eggMoves: string[];
}

export interface RandomizerMetadata {
  version: string;
  seed: string;
  settingsString: string;
  starters: string[];
}