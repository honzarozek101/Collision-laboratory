# Kolizní laboratoř (three.js)

Malý statický web: porovnání kolizních systémů pro hry v three.js.

## Nasazení na web

Nahraj celý obsah složky `kolizni-laborator` na server (FTP, hosting, Apache, nginx…).
Žádná databáze ani PHP nejsou potřeba. Web může běžet v kořeni domény i v podsložce,
všechny cesty jsou relativní.

Lokálně stačí ve složce spustit:

    python -m http.server 8000

a otevřít http://localhost:8000
(Přímé otevření souborů dvojklikem nefunguje, ES moduly vyžadují server.)

## Struktura

    index.html                 úvod a rozcestník
    hriste/index.html          interaktivní hřiště
    srovnani/index.html        srovnávací tabulka a průvodce výběrem
    dema/index.html            odkazy na dema
    assets/css/style.css       společné styly
    assets/js/hriste.js        scéna, ovládání, hlavní smyčka
    assets/js/static-world.js  statická scéna sdílená všemi systémy
    assets/js/engines/         jednotlivé kolizní systémy
        rapier.js  cannon.js  octree.js  custom.js
        sphere-sim.js          integrátor koulí pro Octree a Vlastní
        index.js               seznam systémů (sem přidáš nový)
    assets/vendor/             přibalené knihovny (three.js 0.170, Rapier 0.14, cannon-es 0.20)

Knihovny jsou uložené lokálně, web tedy nepotřebuje CDN. Z internetu se načítají
jen písma z Google Fonts; když nejsou dostupná, použije se systémové písmo.

## Nový kolizní systém

Vytvoř soubor v `assets/js/engines/`, který exportuje objekt s `name`, `kind`, `color`,
`boxes`, `info` a async `create()`. `create()` vrací objekt s metodami
`add(kind, pos, vel, size, fast)`, `step(dt)`, `read(id, pos, quat)` a `dispose()`.
Pak ho zapiš do `engines/index.js`.

## Ovládání hřiště

- tah myší: otáčení kamery, kolečko: zoom
- F nebo tlačítko Výstřel: vystřelí kouli ze směru kamery
- Zátěžový test: 400 koulí se stejným seedem pro férové srovnání

Licence přibalených knihoven jsou u nich ve složkách `assets/vendor/*/LICENSE`.
