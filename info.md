# Interaktiver Raumplan

Lovelace-Karte für einen interaktiven Raumplan: Bild als Grundriss, Entitäten per Drag & Drop positionieren.

## Installation (HACS)

Dieses Repository als Custom Repository in HACS unter **Frontend** hinzufügen, dann die Karte installieren.

## Nutzung

1. Bild des Raumplans unter `config/www/` ablegen (z. B. `grundriss.png`).
2. Karte „Interaktiver Raumplan“ zum Dashboard hinzufügen.
3. Bild-URL eintragen (z. B. `/local/grundriss.png`).
4. Entitäten hinzufügen und in der Vorschau per Drag & Drop auf die richtigen Stellen ziehen.
5. Speichern.

**Hinweis SVGs:** Nutzt dein Raumplan eine SVG mit eigener Schrift, kann die Schrift auf Mobilgeräten fehlen. In der SVG am besten `font-family="sans-serif"` verwenden oder Text in Pfade umwandeln. Details siehe [README.md](README.md).
