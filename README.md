# Interaktiver Raumplan

Lovelace-Karte für einen **Raumplan als Bild** mit per **Koordinaten (x, y)** positionierten Entitäten. Entitäten werden als **Kreise mit Icons** dargestellt. Position per X/Y-Felder im Editor.

**Technisch:** Die Karte ist mit **React (Preact)** und **Tailwind CSS** umgesetzt; der Konfigurations-Editor nutzt weiterhin Lit.

## Installation

### Über HACS

1. HACS → **Frontend** → **Custom repositories** → `https://github.com/MarvinSMX/homeassistant-raumplan`
2. Karte „Interaktiver Raumplan“ installieren

### Manuell

1. `dist/homeassistant-raumplan.js` nach `config/www/` kopieren
2. Dashboard-Ressource: URL `/local/homeassistant-raumplan.js`, Typ **JavaScript-Modul**

## Konfiguration

### YAML

```yaml
type: custom:room-plan-card
image: /local/Cafe.png
rotation: 0
entities:
  - entity: light.wohnzimmer
    x: 25
    y: 30
    scale: 1
    color: "#ffc107"
  - entity: sensor.temperatur_bad
    x: 75
    y: 40
    scale: 1.2
  - entity: light.kueche
    x: 50
    y: 70
    icon: mdi:ceiling-light
    scale: 0.8
    color: "#4caf50"
```

### Parameter

| Parameter    | Beschreibung                                           |
|-------------|--------------------------------------------------------|
| `image`     | URL des Raumplan-Bildes (PNG, JPG, SVG)               |
| `rotation`  | Optional: Drehung des Bildes in Grad (0, 90, 180, 270)|
| `entities`  | Liste mit `entity`, `x`, `y` (Prozent 0–100)           |
| `icon`      | Optional: MDI-Icon (z.B. `mdi:ceiling-light`)         |
| `scale`     | Optional: Skalierung pro Entität (0.3–2, Standard: 1)|
| `color`     | Optional: Farbe pro Entität (Hex, z.B. `#ffc107`)    |
| `title`     | Optional: Überschrift über der Karte                  |

### Transparenz / Styling (optional)

Die Karte nutzt die Standard-`ha-card`-Komponente. Für transparenten Hintergrund oder angepasstes Styling kannst du **card-mod** verwenden:

```yaml
type: custom:room-plan-card
# ... deine config ...
card_mod:
  style: |
    ha-card { background: transparent !important; border: none !important; box-shadow: none !important; padding: 0 !important; }
```

## Koordinaten

- **x** und **y** sind Prozentwerte (0–100)
- **In Räumen mit Boundary:** x/y beziehen sich auf das **Koordinatensystem des Raums**: 0–100 innerhalb der Raumbegrenzung (z. B. 0 = linke Raumecke, 100 = rechte Raumecke). So bleiben Positionen beim Ändern der Raumgröße sinnvoll. **Tipp:** Zuerst die Raumbegrenzung (Rechteck/Polygon) zeichnen, dann Entitäten hinzufügen – dann erscheint die Standardposition (50, 50) in der Mitte des Raums.
- **Ohne Raum oder ohne Raumboundary:** x/y sind relativ zur gesamten Bildbreite/-höhe; 50, 50 = Bildmitte.
- **x: 0** = links, **x: 100** = rechts | **y: 0** = oben, **y: 100** = unten
- Im Konfigurations-Editor: X/Y pro Entität eintragen oder per „Position“ auf dem Plan setzen (speichert raum-relativ, wenn der Raum eine Boundary hat).

## SVG-Schriften auf Mobilgeräten

Wenn dein Raumplan eine **SVG-Datei** mit eigenen Schriften ist, können die Schriften auf **Mobilgeräten** fehlen (Desktop zeigt sie oft trotzdem). Das liegt daran, dass das SVG als Bild geladen wird und auf dem Handy keine externen Fonts nachgeladen werden.

**Lösungen:**

1. **System-Schrift in der SVG verwenden** (am zuverlässigsten):  
   In der SVG z. B. `font-family="sans-serif"` oder `font-family="Arial, sans-serif"` setzen statt einer eigenen Schrift. Dann wird überall die System-Schrift genutzt.

2. **Text in Pfade umwandeln**:  
   In Inkscape/Illustrator: Text markieren → „Objekt → Objekt in Pfad umwandeln“ (bzw. „Create Outlines“). Danach ist kein Font mehr nötig, die „Buchstaben“ sind nur noch Formen.

3. **Schrift in der SVG einbetten**:  
   Die Font-Datei als Base64 in die SVG einbinden (z. B. per `<style>` mit `@font-face` und `url(data:font/woff2;base64,...)`). Erfordert etwas Aufwand, funktioniert dann aber auch auf Mobilgeräten.

## Nutzung

1. Bild des Raumplans unter `config/www/` ablegen (z.B. `raumplan.png`)
2. Karte „Interaktiver Raumplan“ zum Dashboard hinzufügen
3. Bild-URL eintragen (z.B. `/local/raumplan.png`)
4. Entitäten hinzufügen und X/Y-Koordinaten für die Position setzen
5. Speichern – Klick auf einen Kreis öffnet die Entity-Details

## Lokale Test-UI

Frontend ohne Home Assistant testen:

```bash
cd homeassistant-raumplan
python -m http.server 8080
```

Dann **http://localhost:8080/test/** im Browser öffnen. Siehe `test/README.md`.

## React/Preact-Demo-Card (optional)

In **derselben** Datei `homeassistant-raumplan.js` ist eine **zweite Card** enthalten, die zeigt, wie sich **React/Preact in einer HA-Custom-Card** nutzen lässt (Web-Component-Wrapper, Preact).

- **Typ:** `custom:react-demo-card` (keine zweite Ressource nötig – funktioniert mit HACS)
- **Beispiel:** `type: custom:react-demo-card` mit optional `title` und `entity` (z. B. `sensor.date`)

## Lizenz

Frei nutzbar für den privaten Einsatz mit Home Assistant.
