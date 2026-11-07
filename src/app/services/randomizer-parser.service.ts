import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PokemonData, RandomizerMetadata, EvolutionDetail } from '../models/pokemon.model';

@Injectable({
  providedIn: 'root'
})
export class RandomizerParserService {
  private http = inject(HttpClient);

  readonly pokemonList = signal<PokemonData[]>([]);
  readonly metadata = signal<RandomizerMetadata>({
    version: '',
    seed: '',
    settingsString: '',
    starters: []
  });
  readonly isLoading = signal<boolean>(true);

  // Diccionario de respaldo para evoluciones estándar de Gen 1-5 que no cambiaron en el log
  private readonly standardEvolutions: Record<string, string> = {
    'Bulbasaur->Ivysaur': 'Nivel 16', 'Ivysaur->Venusaur': 'Nivel 32',
    'Charmander->Charmeleon': 'Nivel 16', 'Charmeleon->Charizard': 'Nivel 36',
    'Squirtle->Wartortle': 'Nivel 16', 'Wartortle->Blastoise': 'Nivel 36',
    'Caterpie->Metapod': 'Nivel 7', 'Metapod->Butterfree': 'Nivel 10',
    'Weedle->Kakuna': 'Nivel 7', 'Kakuna->Beedrill': 'Nivel 10',
    'Pidgey->Pidgeotto': 'Nivel 18', 'Pidgeotto->Pidgeot': 'Nivel 36',
    'Rattata->Raticate': 'Nivel 20', 'Spearow->Fearow': 'Nivel 20',
    'Ekans->Arbok': 'Nivel 22', 'Pikachu->Raichu': 'Piedra Trueno',
    'Sandshrew->Sandslash': 'Nivel 22', 'Nidorina->Nidoqueen': 'Piedra Lunar',
    'Nidorino->Nidoking': 'Piedra Lunar', 'Clefairy->Clefable': 'Piedra Lunar',
    'Vulpix->Ninetales': 'Piedra Fuego', 'Jigglypuff->Wigglytuff': 'Piedra Lunar',
    'Zubat->Golbat': 'Nivel 22', 'Golbat->Crobat': 'Alta Amistad (160)',
    'Oddish->Gloom': 'Nivel 21', 'Gloom->Vileplume': 'Piedra Hoja', 'Gloom->Bellossom': 'Piedra Solar',
    'Paras->Parasect': 'Nivel 24', 'Venonat->Venomoth': 'Nivel 31',
    'Diglett->Dugtrio': 'Nivel 26', 'Meowth->Persian': 'Nivel 28',
    'Psyduck->Golduck': 'Nivel 33', 'Mankey->Primeape': 'Nivel 28',
    'Growlithe->Arcanine': 'Piedra Fuego', 'Poliwag->Poliwhirl': 'Nivel 25',
    'Poliwhirl->Poliwrath': 'Piedra Agua', 'Abra->Kadabra': 'Nivel 16',
    'Machop->Machoke': 'Nivel 28', 'Bellsprout->Weepinbell': 'Nivel 21',
    'Weepinbell->Victreebel': 'Piedra Hoja', 'Tentacool->Tentacruel': 'Nivel 30',
    'Geodude->Graveler': 'Nivel 25', 'Ponyta->Rapidash': 'Nivel 40',
    'Slowpoke->Slowbro': 'Nivel 37', 'Magnemite->Magneton': 'Nivel 30',
    'Magneton->Magnezone': 'Subir nivel en Cueva Electrorroca',
    'Doduo->Dodrio': 'Nivel 31', 'Seel->Dewgong': 'Nivel 34',
    'Grimer->Muk': 'Nivel 38', 'Shellder->Cloyster': 'Piedra Agua',
    'Gastly->Haunter': 'Nivel 25', 'Drowzee->Hypno': 'Nivel 26',
    'Krabby->Kingler': 'Nivel 28', 'Voltorb->Electrode': 'Nivel 30',
    'Exeggcute->Exeggutor': 'Piedra Hoja', 'Cubone->Marowak': 'Nivel 28',
    'Koffing->Weezing': 'Nivel 35', 'Chansey->Blissey': 'Alta Amistad (160)',
    'Goldeen->Seaking': 'Nivel 33', 'Staryu->Starmie': 'Piedra Agua',
    'Magikarp->Gyarados': 'Nivel 20', 'Eevee->Vaporeon': 'Piedra Agua',
    'Eevee->Jolteon': 'Piedra Trueno', 'Eevee->Flareon': 'Piedra Fuego',
    'Eevee->Leafeon': 'Subir nivel junto a Roca Musgo (Bosque Azulejo)',
    'Eevee->Glaceon': 'Subir nivel junto a Roca Hielo (Monte Tuerca)',
    'Omanyte->Omastar': 'Nivel 40', 'Kabuto->Kabutops': 'Nivel 40',
    'Dratini->Dragonair': 'Nivel 30', 'Chikorita->Bayleef': 'Nivel 16',
    'Bayleef->Meganium': 'Nivel 32', 'Cyndaquil->Quilava': 'Nivel 14',
    'Quilava->Typhlosion': 'Nivel 36', 'Totodile->Croconaw': 'Nivel 18',
    'Croconaw->Feraligatr': 'Nivel 30', 'Sentret->Furret': 'Nivel 15',
    'Hoothoot->Noctowl': 'Nivel 20', 'Ledyba->Ledian': 'Nivel 18',
    'Spinarak->Ariados': 'Nivel 22', 'Chinchou->Lanturn': 'Nivel 27',
    'Pichu->Pikachu': 'Alta Amistad (160)', 'Cleffa->Clefairy': 'Alta Amistad (160)',
    'Igglybuff->Jigglypuff': 'Alta Amistad (160)', 'Togepi->Togetic': 'Alta Amistad (160)',
    'Togetic->Togekiss': 'Piedra Día', 'Natu->Xatu': 'Nivel 25',
    'Mareep->Flaaffy': 'Nivel 15', 'Flaaffy->Ampharos': 'Nivel 30',
    'Marill->Azumarill': 'Nivel 18', 'Hoppip->Skiploom': 'Nivel 18',
    'Skiploom->Jumpluff': 'Nivel 27', 'Sunkern->Sunflora': 'Piedra Solar',
    'Wooper->Quagsire': 'Nivel 20', 'Murkrow->Honchkrow': 'Piedra Noche',
    'Misdreavus->Mismagius': 'Piedra Noche', 'Pineco->Forretress': 'Nivel 31',
    'Snubbull->Granbull': 'Nivel 23', 'Teddiursa->Ursaring': 'Nivel 30',
    'Slugma->Magcargo': 'Nivel 38', 'Remoraid->Octillery': 'Nivel 25',
    'Houndour->Houndoom': 'Nivel 24', 'Phanpy->Donphan': 'Nivel 25',
    'Larvitar->Pupitar': 'Nivel 30', 'Treecko->Grovyle': 'Nivel 16',
    'Grovyle->Sceptile': 'Nivel 36', 'Torchic->Combusken': 'Nivel 16',
    'Combusken->Blaziken': 'Nivel 36', 'Mudkip->Marshtomp': 'Nivel 16',
    'Marshtomp->Swampert': 'Nivel 36', 'Poochyena->Mightyena': 'Nivel 18',
    'Zigzagoon->Linoone': 'Nivel 20', 'Wurmple->Silcoon': 'Nivel 7',
    'Silcoon->Beautifly': 'Nivel 10', 'Wurmple->Cascoon': 'Nivel 7',
    'Cascoon->Dustox': 'Nivel 10', 'Lotad->Lombre': 'Nivel 14',
    'Lombre->Ludicolo': 'Piedra Agua', 'Seedot->Nuzleaf': 'Nivel 14',
    'Nuzleaf->Shiftry': 'Piedra Hoja', 'Taillow->Swellow': 'Nivel 22',
    'Wingull->Pelipper': 'Nivel 25', 'Ralts->Kirlia': 'Nivel 20',
    'Kirlia->Gardevoir': 'Nivel 30', 'Kirlia->Gallade': 'Piedra Alba (Macho)',
    'Surskit->Masquerain': 'Nivel 22', 'Shroomish->Breloom': 'Nivel 23',
    'Slakoth->Vigoroth': 'Nivel 18', 'Vigoroth->Slaking': 'Nivel 36',
    'Nincada->Ninjask': 'Nivel 20', 'Whismur->Loudred': 'Nivel 20',
    'Loudred->Exploud': 'Nivel 40', 'Makuhita->Hariyama': 'Nivel 24',
    'Azurill->Marill': 'Alta Amistad (160)', 'Nosepass->Probopass': 'Subir nivel en Cueva Electrorroca',
    'Skitty->Delcatty': 'Piedra Lunar', 'Lairon->Aggron': 'Nivel 42',
    'Meditite->Medicham': 'Nivel 37', 'Electrike->Manectric': 'Nivel 26',
    'Roselia->Roserade': 'Piedra Día', 'Gulpin->Swalot': 'Nivel 26',
    'Carvanha->Sharpedo': 'Nivel 30', 'Wailmer->Wailord': 'Nivel 40',
    'Numel->Camerupt': 'Nivel 33', 'Spoink->Grumpig': 'Nivel 32',
    'Vibrava->Flygon': 'Nivel 45', 'Cacnea->Cacturne': 'Nivel 32',
    'Swablu->Altaria': 'Nivel 35', 'Barboach->Whiscash': 'Nivel 30',
    'Corphish->Crawdaunt': 'Nivel 30', 'Baltoy->Claydol': 'Nivel 36',
    'Lileep->Cradily': 'Nivel 40', 'Anorith->Armaldo': 'Nivel 40',
    'Shuppet->Banette': 'Nivel 37', 'Wynaut->Wobbuffet': 'Nivel 15',
    'Snorunt->Glalie': 'Nivel 42', 'Snorunt->Froslass': 'Piedra Alba (Hembra)',
    'Sealeo->Walrein': 'Nivel 44', 'Bagon->Shelgon': 'Nivel 30',
    'Shelgon->Salamence': 'Nivel 50', 'Beldum->Metang': 'Nivel 20',
    'Metang->Metagross': 'Nivel 45', 'Turtwig->Grotle': 'Nivel 18',
    'Grotle->Torterra': 'Nivel 32', 'Chimchar->Monferno': 'Nivel 14',
    'Monferno->Infernape': 'Nivel 36', 'Piplup->Prinplup': 'Nivel 16',
    'Prinplup->Empoleon': 'Nivel 36', 'Starly->Staravia': 'Nivel 14',
    'Staravia->Staraptor': 'Nivel 34', 'Bidoof->Bibarel': 'Nivel 15',
    'Kricketot->Kricketune': 'Nivel 10', 'Shinx->Luxio': 'Nivel 15',
    'Luxio->Luxray': 'Nivel 30', 'Cranidos->Rampardos': 'Nivel 30',
    'Shieldon->Bastiodon': 'Nivel 30', 'Burmy->Wormadam': 'Nivel 20 (Hembra)',
    'Burmy->Mothim': 'Nivel 20 (Macho)', 'Combee->Vespiquen': 'Nivel 21 (Hembra)',
    'Buizel->Floatzel': 'Nivel 26', 'Cherubi->Cherrim': 'Nivel 25',
    'Shellos->Gastrodon': 'Nivel 30', 'Drifloon->Drifblim': 'Nivel 28',
    'Buneary->Lopunny': 'Alta Amistad (160)', 'Glameow->Purugly': 'Nivel 38',
    'Stunky->Skuntank': 'Nivel 34', 'Bronzor->Bronzong': 'Nivel 33',
    'Gible->Gabite': 'Nivel 24', 'Gabite->Garchomp': 'Nivel 48',
    'Munchlax->Snorlax': 'Alta Amistad (160)', 'Hippopotas->Hippowdon': 'Nivel 34',
    'Skorupi->Drapion': 'Nivel 40', 'Croagunk->Toxicroak': 'Nivel 37',
    'Finneon->Lumineon': 'Nivel 31', 'Snover->Abomasnow': 'Nivel 40',
    'Snivy->Servine': 'Nivel 17', 'Servine->Serperior': 'Nivel 36',
    'Tepig->Pignite': 'Nivel 17', 'Pignite->Emboar': 'Nivel 36',
    'Oshawott->Dewott': 'Nivel 17', 'Dewott->Samurott': 'Nivel 36',
    'Patrat->Watchog': 'Nivel 20', 'Lillipup->Herdier': 'Nivel 16',
    'Herdier->Stoutland': 'Nivel 32', 'Purrloin->Liepard': 'Nivel 20',
    'Pansage->Simisage': 'Piedra Hoja', 'Pansear->Simisear': 'Piedra Fuego',
    'Panpour->Simipour': 'Piedra Agua', 'Munna->Musharna': 'Piedra Lunar',
    'Pidove->Tranquill': 'Nivel 21', 'Tranquill->Unfezant': 'Nivel 32',
    'Blitzle->Zebstrika': 'Nivel 27', 'Roggenrola->Boldore': 'Nivel 25',
    'Woobat->Swoobat': 'Alta Amistad (160)', 'Drilbur->Excadrill': 'Nivel 31',
    'Timburr->Gurdurr': 'Nivel 25', 'Tympole->Palpitoad': 'Nivel 25',
    'Palpitoad->Seismitoad': 'Nivel 36', 'Sewaddle->Swadloon': 'Nivel 20',
    'Swadloon->Leavanny': 'Alta Amistad (160)', 'Venipede->Whirlipede': 'Nivel 22',
    'Whirlipede->Scolipede': 'Nivel 30', 'Cottonee->Whimsicott': 'Piedra Solar',
    'Petilil->Lilligant': 'Piedra Solar', 'Sandile->Krokorok': 'Nivel 29',
    'Krokorok->Krookodile': 'Nivel 40', 'Darumaka->Darmanitan': 'Nivel 35',
    'Dwebble->Crustle': 'Nivel 34', 'Scraggy->Scrafty': 'Nivel 39',
    'Yamask->Cofagrigus': 'Nivel 34', 'Tirtouga->Carracosta': 'Nivel 37',
    'Archen->Archeops': 'Nivel 37', 'Trubbish->Garbodor': 'Nivel 36',
    'Zorua->Zoroark': 'Nivel 30', 'Minccino->Cinccino': 'Piedra Día',
    'Gothorita->Gothitelle': 'Nivel 41', 'Duosion->Reuniclus': 'Nivel 41',
    'Ducklett->Swanna': 'Nivel 35', 'Vanillish->Vanilluxe': 'Nivel 47',
    'Deerling->Sawsbuck': 'Nivel 34', 'Foongus->Amoonguss': 'Nivel 39',
    'Frillish->Jellicent': 'Nivel 40', 'Joltik->Galvantula': 'Nivel 36',
    'Ferroseed->Ferrothorn': 'Nivel 40', 'Klang->Klinklang': 'Nivel 49',
    'Eelektrik->Eelektross': 'Piedra Trueno', 'Elgyem->Beheeyem': 'Nivel 42',
    'Lampent->Chandelure': 'Piedra Noche', 'Fraxure->Haxorus': 'Nivel 48',
    'Cubchoo->Beartic': 'Nivel 37', 'Mienfoo->Mienshao': 'Nivel 50',
    'Golett->Golurk': 'Nivel 43'
  };

  loadDefaultLog(): void {
    this.isLoading.set(true);
    this.http.get('/randomizer.log', { responseType: 'text' }).subscribe({
      next: (rawText) => {
        this.parseLogFile(rawText);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  parseLogFile(rawText: string): void {
    const rawLines = rawText.split(/\r?\n/);
    const lines = rawLines
      .map(l => l.replace(/^\[\d{2}:\d{2}:\d{2}\.\d{3}\]\s*(\[java\]\s*)?/, '').trimEnd());

    const pokemonMap = new Map<number, PokemonData>();
    const nameToNum = new Map<string, number>();
    const customEvos = new Map<string, EvolutionDetail[]>();

    const meta: RandomizerMetadata = { version: '', seed: '', settingsString: '', starters: [] };
    let currentSection = '';
    let currentMovesetMon: PokemonData | null = null;
    let readingEggMoves = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Metadatos iniciales
      if (trimmed.startsWith('Randomizer Version:')) {
        meta.version = trimmed.replace('Randomizer Version:', '').trim();
        continue;
      }
      if (trimmed.startsWith('Random Seed:')) {
        meta.seed = trimmed.replace('Random Seed:', '').trim();
        continue;
      }
      if (trimmed.startsWith('Settings String:')) {
        meta.settingsString = trimmed.replace('Settings String:', '').trim();
        continue;
      }
      if (trimmed.startsWith('Set starter')) {
        const starterMatch = trimmed.match(/Set starter \d+ to (.+)/);
        if (starterMatch) meta.starters.push(starterMatch[1].trim());
        continue;
      }

      // Cambio de sección
      if (trimmed.startsWith('--') && trimmed.endsWith('--')) {
        currentSection = trimmed;
        currentMovesetMon = null;
        readingEggMoves = false;
        continue;
      }

      // 1. Parsear Base Stats & Types
      if (currentSection === '--Pokemon Base Stats & Types--') {
        if (trimmed.startsWith('NUM|')) continue;
        const parts = trimmed.split('|').map(p => p.trim());
        if (parts.length >= 12) {
          const num = parseInt(parts[0], 10);
          if (!isNaN(num)) {
            let name = parts[1];
            if (num === 29) name = 'Nidoran♀';
            if (num === 32) name = 'Nidoran♂';

            const abilities = [parts[9], parts[10], parts[11]].filter(a => a && a !== '-');
            const mon: PokemonData = {
              num,
              name,
              types: parts[2].split('/').map(t => t.trim()),
              stats: {
                hp: parseInt(parts[3], 10),
                atk: parseInt(parts[4], 10),
                def: parseInt(parts[5], 10),
                satk: parseInt(parts[6], 10),
                sdef: parseInt(parts[7], 10),
                spd: parseInt(parts[8], 10)
              },
              abilities,
              heldItems: parts[12] || 'Ninguno',
              evolutions: [],
              levelMoves: [],
              eggMoves: []
            };
            pokemonMap.set(num, mon);
            nameToNum.set(parts[1].toLowerCase(), num);
            nameToNum.set(name.toLowerCase(), num);
          }
        }
      }

      // 2. Parsear Evoluciones Modificadas
      if (
        currentSection === '--Removing Impossible Evolutions--' ||
        currentSection === '--Removing Timed-Based Evolutions--'
      ) {
        if (trimmed.includes('(Overwritten by')) continue;
        const evoMatch = trimmed.match(/^([A-Za-z0-9.\-?'♀♂\s]+?)\s*->\s*([A-Za-z0-9.\-?'♀♂\s]+?)\s+(at level.+|by .+?|using .+)$/i);
        if (evoMatch) {
          const fromName = evoMatch[1].trim();
          const toName = evoMatch[2].trim();
          const methodRaw = this.translateEvoMethod(evoMatch[3].trim());
          const list = customEvos.get(fromName) || [];
          list.push({ targetName: toName, method: methodRaw });
          customEvos.set(fromName, list);
        }
      }

      if (currentSection === '--Making Evolutions Easier--') {
        const easyMatch = trimmed.match(/^([A-Za-z0-9.\-?'♀♂\s]+?)\s+now evolves into\s+([A-Za-z0-9.\-?'♀♂\s]+?)\s+at minimum level\s+(\d+)/i);
        if (easyMatch) {
          const fromName = easyMatch[1].trim();
          const toName = easyMatch[2].trim();
          const lvl = easyMatch[3].trim();
          const list = customEvos.get(fromName) || [];
          const existingIdx = list.findIndex(e => e.targetName === toName);
          const evoObj = { targetName: toName, method: `Nivel ${lvl} (Facilitada)` };
          if (existingIdx >= 0) list[existingIdx] = evoObj;
          else list.push(evoObj);
          customEvos.set(fromName, list);
        }
      }

      // 3. Parsear Movesets y Relaciones Evolutivas
      if (currentSection === '--Pokemon Movesets--') {
        const headerMatch = trimmed.match(/^(\d{3})\s+(.+?)\s*->\s*(.+)$/);
        if (headerMatch) {
          const num = parseInt(headerMatch[1], 10);
          const targetEvoRaw = headerMatch[3].trim();
          currentMovesetMon = pokemonMap.get(num) || null;
          readingEggMoves = false;

          if (currentMovesetMon) {
            const rawBaseName = headerMatch[2].trim();
            const customList = customEvos.get(rawBaseName) || customEvos.get(currentMovesetMon.name);

            if (customList && customList.length > 0) {
              currentMovesetMon.evolutions = [...customList];
            }

            if (!targetEvoRaw.includes('(no evolution)')) {
              const targets = targetEvoRaw.split('/').map(t => t.trim());
              for (const t of targets) {
                const alreadyAdded = currentMovesetMon.evolutions.some(e => e.targetName.toLowerCase() === t.toLowerCase());
                if (!alreadyAdded) {
                  const key = `${rawBaseName}->${t}`;
                  const fallbackMethod = this.standardEvolutions[key] || 'Método estándar';
                  currentMovesetMon.evolutions.push({ targetName: t, method: fallbackMethod });
                }
              }
            }
          }
          continue;
        }

        if (currentMovesetMon) {
          if (trimmed === 'Egg Moves:') {
            readingEggMoves = true;
            continue;
          }
          if (readingEggMoves && trimmed.startsWith('-')) {
            currentMovesetMon.eggMoves.push(trimmed.replace(/^-/, '').trim());
            continue;
          }
          const moveMatch = trimmed.match(/^Level\s+(\d+)\s*:\s*(.+)$/);
          if (moveMatch) {
            currentMovesetMon.levelMoves.push({
              level: parseInt(moveMatch[1], 10),
              name: moveMatch[2].trim()
            });
          }
        }
      }
    }

    this.metadata.set(meta);
    this.pokemonList.set(Array.from(pokemonMap.values()).sort((a, b) => a.num - b.num));
  }

  private translateEvoMethod(raw: string): string {
    return raw
      .replace(/^at level (\d+)/i, 'Nivel $1')
      .replace(/^by leveling up holding (.+)/i, 'Subir nivel equipado con $1')
      .replace(/^using a (.+)/i, 'Usar $1')
      .replace(/^by reaching high happiness/i, 'Alta Amistad (160)');
  }
}