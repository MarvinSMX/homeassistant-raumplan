# Interaktiver Raumplan – ha-floorplan Style

Lovelace-Karte für einen **SVG-basierten Raumplan** im Stil von [ha-floorplan](https://github.com/ExperienceLovelace/ha-floorplan): Entities werden auf SVG-Elemente gemappt, Zustände steuern das Styling, Klicks lösen Aktionen aus.

## Konzept (wie ha-floorplan)

1. **SVG-Datei** mit Element-IDs erstellen (z.B. in Inkscape)
2. **CSS-Stylesheet** für Zustandsdarstellung (optional)
3. **Rules** definieren: Entity → SVG-Element-Mapping

## Installation

### Über HACS

1. HACS → **Frontend** → **Custom repositories** → `https://github.com/MarvinSMX/homeassistant-raumplan`
2. Karte „Interaktiver Raumplan“ installieren

### Manuell

1. `dist/homeassistant-raumplan.js` nach `config/www/` kopieren
2. Dashboard-Ressource: URL `/local/homeassistant-raumplan.js`, Typ **JavaScript-Modul**

## SVG erstellen

1. Grundriss in [Floorplanner](https://floorplanner.com/) oder ähnlich erstellen und als Bild exportieren
2. In [Inkscape](https://inkscape.org/) öffnen und Bereiche als Formen zeichnen (Rechteck, Polygon)
3. **Wichtig:** Jeder interaktive Bereich braucht eine **ID** (z.B. `area.wohnzimmer`, `area.kueche`)
4. Als SVG speichern und unter `config/www/floorplan/` ablegen

## Konfiguration

### YAML

```yaml
type: custom:room-plan-card
image: /local/floorplan/grundriss.svg
stylesheet: /local/floorplan/grundriss.css
rules:
  - entity: light.wohnzimmer
    element: area.wohnzimmer
    tap_action: toggle
  - entity: light.kueche
    element: area.kueche
    tap_action: toggle
  - entity: sensor.temperatur_bad
    element: text.temp_bad
```

### Parameter

| Parameter    | Beschreibung                                           |
|-------------|--------------------------------------------------------|
| `image`     | URL der SVG-Datei (z.B. `/local/floorplan.svg`)        |
| `stylesheet`| URL der CSS-Datei (optional)                           |
| `rules`     | Liste von Rules mit `entity` und `element`             |
| `tap_action`| `toggle`, `more-info`, oder Service wie `light.toggle` |

## CSS-Styling

Das SVG erhält automatisch Klassen:

- `ha-entity` – alle gemappten Elemente
- `ha-entity-{entity-id}` – z.B. `ha-entity-light-wohnzimmer`
- `state-{state}` – z.B. `state-on`, `state-off`, `state-22.5`

Beispiel-CSS:

```css
/* Lampen: Ein = hell, Aus = dunkel */
.ha-entity-light-wohnzimmer.state-on { fill: #ffeb3b !important; }
.ha-entity-light-wohnzimmer.state-off { fill: #37474f !important; }

/* Hover */
.ha-entity:hover { stroke: #03A9F4 !important; stroke-width: 2px !important; }
```

## Unterschied zu ha-floorplan

Diese Karte orientiert sich an ha-floorplan, ist aber deutlich schlanker:

- **ha-floorplan**: Umfangreiche Features (state_action, floorplan-Dienste, JS-Templates, etc.)
- **Diese Karte**: Einfaches Entity-Element-Mapping, Toggle/More-Info, automatische State-Klassen

Für maximale Flexibilität → [ha-floorplan](https://github.com/ExperienceLovelace/ha-floorplan) nutzen.  
Für einen schnellen SVG-Raumplan mit Basis-Features → diese Karte.

## Lizenz

Frei nutzbar für den privaten Einsatz mit Home Assistant.
