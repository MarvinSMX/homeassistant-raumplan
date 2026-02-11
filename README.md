# Interaktiver Raumplan – Lovelace-Karte für Home Assistant

Lovelace-Karte für einen **interaktiven Raumplan**: Du legst ein Bild (Grundriss/Skizze) als Hintergrund fest und platzierst **Entitäten per Drag & Drop** an die passenden Stellen. Ideal für Dashboards mit Raumübersicht.

## Funktionen

- **Raumplan als Bild** – Beliebiges Bild (z. B. Grundriss) als Hintergrund
- **Entitäten per Drag & Drop** – Positionierung im Konfigurations-Editor durch Ziehen der Punkte auf dem Vorschau-Bild
- **Dashboard-Integration** – Karte wie jede andere Lovelace-Karte hinzufügen
- **Live-Anzeige** – Zustand und Namen der Entitäten werden auf der Karte angezeigt

## Installation

### Option 1: Manuell (ohne HACS)

1. Kopiere `room-plan-card.js` in deinen Home-Assistant-Ordner, z. B.:
   - `config/www/room-plan-card.js`
2. Falls du keinen `www`-Ordner hast: Unter `config/` einen Ordner `www` anlegen und die Datei dort ablegen.
3. Dashboard-Ressource eintragen:
   - **Einstellungen** → **Dashboards** → **Ressourcen** → **Ressource hinzufügen**
   - **URL:** `/local/room-plan-card.js`
   - **Typ:** JavaScript-Modul
4. Optional: Home Assistant einmal neu starten, wenn `www` neu angelegt wurde.

### Option 2: Über HACS (Custom Repository)

1. HACS → **Frontend** → **⋮** → **Custom repositories**
2. Repository-URL eintragen (z. B. dein GitHub-Repo mit diesem Projekt)
3. **Repository** hinzufügen und danach die Karte unter **Frontend** installieren.

## Bild für den Raumplan

- Bild z. B. unter `config/www/` speichern, z. B. `config/www/grundriss.png`.
- In der Karte als **Bild-URL** angeben: `/local/grundriss.png`
- Externe URLs (z. B. `https://...`) funktionieren ebenfalls, wenn dein HA darauf zugreifen kann.

## Karte ins Dashboard einfügen

1. Dashboard bearbeiten (Stift-Symbol).
2. **Karte hinzufügen** → in der Liste **„Interaktiver Raumplan“** wählen (oder manuell **„Manuell“** und dann unten die Konfiguration).
3. Im Konfigurations-Dialog:
   - **Bild-URL des Raumplans** eintragen (z. B. `/local/raumplan.png`).
   - **Entität hinzufügen** klicken und die gewünschten Entitäten eintragen (z. B. `light.wohnzimmer`, `sensor.temperatur_bad`). Du kannst aus der Liste wählen oder die Entity-ID eintippen.
   - **Position setzen:** In der Vorschau die farbigen Punkte auf dem Bild per **Drag & Drop** an die richtigen Stellen ziehen.
4. **Speichern** – die Karte zeigt den Raumplan mit den Entitäten an den gesetzten Positionen.

## Konfiguration (YAML)

Falls du die Karte per YAML konfigurierst:

```yaml
type: custom:room-plan-card
title: "EG"
image: /local/grundriss.png
entities:
  - entity: light.wohnzimmer
    x: 25
    y: 30
  - entity: sensor.temperatur_bad
    x: 75
    y: 40
  - entity: light.kueche
    x: 50
    y: 70
    icon: mdi:ceiling-light   # optional, sonst wird ein Standard-Icon genutzt
```

- **image** (Pflicht): URL des Raumplan-Bildes.
- **title** (optional): Überschrift über der Karte.
- **entities**: Liste von Objekten mit:
  - **entity**: Entity-ID (z. B. `light.wohnzimmer`).
  - **x**, **y**: Position in Prozent (0–100) auf dem Bild.
  - **icon** (optional): MDI-Icon, z. B. `mdi:sofa`, `mdi:thermometer`.

## Hinweise

- Die Positionen (x, y) sind **Prozentwerte** (0–100) und bleiben bei verschiedenen Bildschirmgrößen proportional.
- Im Konfigurations-Editor kannst du Entitäten hinzufügen/entfernen und ihre Position nur durch Ziehen in der Vorschau anpassen – kein manuelles Eintippen von x/y nötig.
- Wenn eine Entität nicht gefunden wird, erscheint ein Platzhalter-Icon; die Entity-ID solltest du in den Einstellungen der Karte prüfen.

## Dateien

- `room-plan-card.js` – Karte und Konfigurations-Editor (eine Datei)
- `manifest.json` – Metadaten für die Karte
- `README.md` – diese Anleitung

## Lizenz

Frei nutzbar für den privaten Einsatz mit Home Assistant.
