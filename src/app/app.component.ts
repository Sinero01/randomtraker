import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RandomizerParserService } from './services/randomizer-parser.service';
import { PokemonData } from './models/pokemon.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  readonly parserService = inject(RandomizerParserService);

  readonly searchQuery = signal<string>('');
  readonly selectedType = signal<string>('ALL');
  readonly selectedPokemon = signal<PokemonData | null>(null);
  readonly moveFilter = signal<string>('');

  readonly allTypes = [
    'ALL', 'NORMAL', 'FIRE', 'WATER', 'GRASS', 'ELECTRIC', 'ICE',
    'FIGHTING', 'POISON', 'GROUND', 'FLYING', 'PSYCHIC', 'BUG',
    'ROCK', 'GHOST', 'DRAGON', 'DARK', 'STEEL'
  ];

  readonly filteredPokemon = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const type = this.selectedType();
    const list = this.parserService.pokemonList();

    return list.filter(mon => {
      const matchesType = type === 'ALL' || mon.types.includes(type);
      if (!matchesType) return false;
      if (!query) return true;

      const matchesName = mon.name.toLowerCase().includes(query);
      const matchesNum = mon.num.toString() === query;
      const matchesAbility = mon.abilities.some(a => a.toLowerCase().includes(query));
      const matchesMove =
        mon.levelMoves.some(m => m.name.toLowerCase().includes(query)) ||
        mon.eggMoves.some(e => e.toLowerCase().includes(query));

      return matchesName || matchesNum || matchesAbility || matchesMove;
    });
  });

  readonly filteredLevelMoves = computed(() => {
    const mon = this.selectedPokemon();
    if (!mon) return [];
    const q = this.moveFilter().toLowerCase().trim();
    if (!q) return mon.levelMoves;
    return mon.levelMoves.filter(m => m.name.toLowerCase().includes(q));
  });

  // Movimientos de Nivel 1 (Recuerda-movimientos base)
  readonly reminderMoves = computed(() => {
    const mon = this.selectedPokemon();
    if (!mon) return [];
    return mon.levelMoves.filter(m => m.level === 1).map(m => m.name);
  });

  ngOnInit(): void {
    this.parserService.loadDefaultLog();
  }

  selectPokemon(mon: PokemonData): void {
    this.selectedPokemon.set(mon);
    this.moveFilter.set('');
  }

  selectByName(name: string): void {
    const found = this.parserService.pokemonList().find(
      p => p.name.toLowerCase() === name.toLowerCase()
    );
    if (found) {
      this.selectPokemon(found);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.parserService.parseLogFile(reader.result as string);
      this.selectedPokemon.set(null);
    };
    reader.readAsText(file);
  }
}