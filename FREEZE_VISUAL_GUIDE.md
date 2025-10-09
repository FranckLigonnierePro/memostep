# 🎨 Guide Visuel - Système de Givre

## 📐 Architecture du système

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUX DU POUVOIR GIVRE                     │
└─────────────────────────────────────────────────────────────┘

Joueur A                          Joueur B (adversaire)
   │                                     │
   │ 1. Appuie sur ESPACE               │
   │    (pendant le jeu)                 │
   ├──────────────────────────────────> │
   │                                     │
   │ 2. usePower() appelé                │
   │    → apply_freeze_power()           │
   │    → pending_freeze = true          │
   ├──────────────────────────────────> │
   │                                     │
   │                                     │ 3. Détecte pending_freeze
   │                                     │    (via realtime)
   │                                     │
   │                                     │ 4. applyPendingFreeze()
   │                                     │    → frozen_clicks = 8
   │                                     │    → showSnowstorm = true
   │                                     │
   │                                     │ 5. TEMPÊTE DE NEIGE ❄️
   │                                     │    (2 secondes)
   │                                     │
   │                                     │ 6. GRILLE GELÉE 🧊
   │                                     │    Compteur: 8
   │                                     │
   │                                     │ 7. Clique pour briser
   │                                     │    8 → 7 → 6 → 5
   │                                     │
   │                                     │ 8. FISSURES APPARAISSENT
   │                                     │    4 → 3 → 2 → 1
   │                                     │
   │                                     │ 9. LIBÉRATION ✨
   │                                     │    frozen_clicks = 0
   │                                     │    frozenGrid = false
   │                                     │
   │                                     │ 10. Jeu reprend
   │                                     │
```

---

## 🎬 Séquence d'animation

### Phase 1 : Tempête de neige (0-2 secondes)

```
┌────────────────────────────────────────┐
│  ❄️  ❄️     ❄️      ❄️    ❄️  ❄️      │  ← 50 flocons
│     ❄️   ❄️     ❄️      ❄️     ❄️     │    tombent du haut
│  ❄️     ❄️   ❄️    ❄️  ❄️    ❄️      │
│    ❄️      ❄️    ❄️       ❄️    ❄️   │
│ ❄️    ❄️      ❄️     ❄️      ❄️      │
│    ❄️    ❄️      ❄️    ❄️   ❄️       │
│                                        │
│  ┌──────────────────────────────┐     │
│  │  ░░░░  ░░░░  ░░░░  ░░░░      │     │  ← Grille commence
│  │  ░░░░  ░░░░  ░░░░  ░░░░      │     │    à geler
│  │  ░░░░  ░░░░  ░░░░  ░░░░      │     │
│  │  ░░░░  ░░░░  ░░░░  ░░░░      │     │
│  └──────────────────────────────┘     │
│                                        │
└────────────────────────────────────────┘
```

### Phase 2 : Grille gelée - Compteur 8 à 5 (pas de fissures)

```
┌────────────────────────────────────────┐
│                                        │
│  ┌──────────────────────────────┐     │
│  │  ████  ████  ████  ████      │     │
│  │  ████  ████  ████  ████      │     │  ← Glace opaque
│  │  ████  ████  ████  ████      │     │    (85% opacité)
│  │  ████  ████  ████  ████      │     │
│  │  ████  ████  ████  ████      │     │
│  │  ████  ████  ████  ████      │     │
│  │          ❄️                   │     │
│  │          8                    │     │  ← Compteur géant
│  │  ████  ████  ████  ████      │     │    (pulse)
│  │  ████  ████  ████  ████      │     │
│  │  ████  ████  ████  ████      │     │
│  │  ████  ████  ████  ████      │     │
│  └──────────────────────────────┘     │
│                                        │
└────────────────────────────────────────┘

Clic 1 → Compteur: 7
Clic 2 → Compteur: 6
Clic 3 → Compteur: 5
Clic 4 → Compteur: 4 ⚠️ Fissures commencent !
```

### Phase 3 : Fissures progressives - Compteur 4 à 1

```
Compteur: 4 (1ère fissure)
┌────────────────────────────────────────┐
│  ┌──────────────────────────────┐     │
│  │  ▓▓▓▓  ▓▓▓▓  ▓▓▓▓  ▓▓▓▓      │     │
│  │  ▓▓▓▓──────────▓▓▓  ▓▓▓▓      │     │  ← Fissure 1
│  │  ▓▓▓▓  ▓▓▓▓  ▓▓▓▓  ▓▓▓▓      │     │    (diagonale)
│  │  ▓▓▓▓  ▓▓▓▓  ▓▓▓▓  ▓▓▓▓      │     │
│  │          ❄️                   │     │
│  │          4                    │     │
│  └──────────────────────────────┘     │
└────────────────────────────────────────┘

Compteur: 3 (2ème fissure)
┌────────────────────────────────────────┐
│  ┌──────────────────────────────┐     │
│  │  ▓▓▓▓  ▓▓▓▓  ▓▓▓▓  ▓▓▓▓      │     │
│  │  ▓▓▓▓──────────▓▓▓  ▓▓▓▓      │     │  ← Fissure 1
│  │  ▓▓▓▓  ▓▓▓▓  ▓▓▓▓  ▓▓▓▓      │     │
│  │  ────────────────────────    │     │  ← Fissure 2
│  │  ▓▓▓▓  ▓▓▓▓  ▓▓▓▓  ▓▓▓▓      │     │    (horizontale)
│  │          ❄️                   │     │
│  │          3                    │     │
│  └──────────────────────────────┘     │
└────────────────────────────────────────┘

Compteur: 2 (3ème fissure)
┌────────────────────────────────────────┐
│  ┌──────────────────────────────┐     │
│  │  ▒▒▒▒  ▒▒▒▒  ▒▒▒▒  ▒▒▒▒      │     │  ← Glace plus
│  │  ▒▒▒▒──────────▒▒▒  ▒▒▒▒      │     │    transparente
│  │  ▒▒▒▒  ▒▒▒▒  ▒▒▒▒  ▒▒▒▒      │     │    (60% opacité)
│  │  ────────────────────────    │     │
│  │  ▒▒▒▒  ▒▒▒▒  ▒▒▒▒  ▒▒▒▒      │     │
│  │  ▒▒▒▒  ▒▒▒▒──────▒▒▒▒  ▒▒▒▒  │     │  ← Fissure 3
│  │          ❄️                   │     │
│  │          2                    │     │
│  └──────────────────────────────┘     │
└────────────────────────────────────────┘

Compteur: 1 (4ème fissure)
┌────────────────────────────────────────┐
│  ┌──────────────────────────────┐     │
│  │  ░░░░  ░░░░  ░░░░  ░░░░      │     │  ← Glace très
│  │  ░░░░──────────░░░  ░░░░      │     │    transparente
│  │  ░░░░  ░░░░  ░░░░  ░░░░      │     │    (50% opacité)
│  │  ────────────────────────    │     │
│  │  ░░░░  ░░░░  ░░░░  ░░░░      │     │
│  │  ░░░░  ░░░░──────░░░░  ░░░░  │     │
│  │  ░░░░  ────────────░░░░      │     │  ← Fissure 4
│  │          ❄️                   │     │
│  │          1                    │     │
│  └──────────────────────────────┘     │
└────────────────────────────────────────┘
```

### Phase 4 : Libération (compteur → 0)

```
┌────────────────────────────────────────┐
│                                        │
│  ┌──────────────────────────────┐     │
│  │  ████  ████  ████  ████      │     │
│  │  ████  ████  ████  ████      │     │  ← Grille normale
│  │  ████  ████  ████  ████      │     │    Glace disparue
│  │  ████  ████  ████  ████      │     │    ✨ Animation
│  │  ████  ████  ████  ████      │     │
│  │  ████  ████  ████  ████      │     │
│  │  ████  ████  ████  ████      │     │
│  │  ████  ████  ████  ████      │     │
│  │  ████  ████  ████  ████      │     │
│  │  ████  ████  ████  ████      │     │
│  └──────────────────────────────┘     │
│                                        │
└────────────────────────────────────────┘
```

---

## 🎨 Palette de couleurs

### Glace (dégradé)
```css
Début:   rgba(173, 216, 230, 0.85)  /* Bleu clair */
Milieu:  rgba(135, 206, 250, 0.75)  /* Bleu ciel */
Fin:     rgba(173, 216, 230, 0.85)  /* Bleu clair */
```

### Glace fissurée (plus transparent)
```css
Début:   rgba(173, 216, 230, 0.6)   /* 60% opacité */
Milieu:  rgba(135, 206, 250, 0.5)   /* 50% opacité */
Fin:     rgba(173, 216, 230, 0.6)   /* 60% opacité */
```

### Fissures
```css
Couleur: rgba(255, 255, 255, 0.9)   /* Blanc presque opaque */
Ombre:   0 0 2px rgba(0, 0, 0, 0.3) /* Légère ombre */
```

### Compteur
```css
Couleur:     #0a4d6e                /* Bleu foncé */
Text-shadow: 0 0 10px rgba(255, 255, 255, 0.9),
             0 0 20px rgba(173, 216, 230, 0.8)
```

### Flocons
```css
Couleur:     white
Opacité:     0.8
Box-shadow:  0 0 10px rgba(255, 255, 255, 0.8)
```

---

## 📏 Dimensions et positions

### Grille
```
Taille:     10 lignes × 4 colonnes = 40 cellules
Cellule:    Variable (responsive)
Gap:        8px entre cellules
Padding:    8px autour de la grille
```

### Compteur central
```
Position:   absolute
Top:        50%
Left:       50%
Transform:  translate(-50%, -50%)
Z-index:    20 (au-dessus de la glace)
```

### Overlay de glace
```
Position:   absolute
Inset:      0 (couvre toute la cellule)
Z-index:    10
Border-radius: 10px (même que la cellule)
```

### Flocons
```
Nombre:     50
Taille:     4-12px (aléatoire)
Position:   top: -10px (hors écran)
Left:       0-100% (aléatoire)
```

---

## ⚡ Timings des animations

```
┌─────────────────────────────────────────────────────────┐
│                    TIMELINE                              │
└─────────────────────────────────────────────────────────┘

0s        1s        2s        3s        4s        5s
│─────────│─────────│─────────│─────────│─────────│
│                                                   
│ ESPACE appuyé
│
├─ Tempête de neige ────────────┤
│  (2 secondes)                 │
│                               │
│  Flocons: 2-5s par flocon     │
│  (durée variable)             │
│                               │
├───────────────────────────────┤
│                               │
│ Grille gelée                  │
│ Compteur pulse: 1.5s/cycle    │
│                               │
│ Clic 1 (t=2.5s) → 7           │
│ Clic 2 (t=3.0s) → 6           │
│ Clic 3 (t=3.5s) → 5           │
│ Clic 4 (t=4.0s) → 4 ⚠️        │
│   └─ Fissure 1 (0.3s anim)    │
│                               │
│ Clic 5 (t=4.5s) → 3           │
│   └─ Fissure 2 (0.3s anim)    │
│                               │
│ Clic 6 (t=5.0s) → 2           │
│   └─ Fissure 3 (0.3s anim)    │
│                               │
│ Clic 7 (t=5.5s) → 1           │
│   └─ Fissure 4 (0.3s anim)    │
│                               │
│ Clic 8 (t=6.0s) → 0 ✨        │
│   └─ Libération               │
│                               │
└───────────────────────────────┘

Durée totale: ~6 secondes (si clics rapides)
Perte de temps: ~4 secondes (vs jeu normal)
```

---

## 🔢 États du système

### État initial (avant activation)
```javascript
{
  frozenGrid: false,
  frozenClicksLeft: 0,
  showSnowstorm: false,
  powerUsed: false
}
```

### État pendant la tempête (0-2s)
```javascript
{
  frozenGrid: true,
  frozenClicksLeft: 8,
  showSnowstorm: true,  // ← Animation active
  powerUsed: true
}
```

### État gelé sans fissures (clics 8-5)
```javascript
{
  frozenGrid: true,
  frozenClicksLeft: 8 → 7 → 6 → 5,
  showSnowstorm: false,
  powerUsed: true
}
```

### État gelé avec fissures (clics 4-1)
```javascript
{
  frozenGrid: true,
  frozenClicksLeft: 4 → 3 → 2 → 1,  // ← Fissures visibles
  showSnowstorm: false,
  powerUsed: true
}
```

### État libéré
```javascript
{
  frozenGrid: false,  // ← Libéré
  frozenClicksLeft: 0,
  showSnowstorm: false,
  powerUsed: true     // ← Reste true (1 usage/round)
}
```

---

## 🎮 Interface utilisateur

### Icône du pouvoir (barre latérale)

```
État disponible:
┌─────────┐
│   ❄️    │  ← Couleur vive
│         │     Cursor: pointer
│ Espace  │     Hover: effet
└─────────┘

État utilisé:
┌─────────┐
│   ❄️    │  ← Grisé
│         │     Opacity: 0.5
│ Utilisé │     Cursor: not-allowed
└─────────┘

État pendant mémorisation:
┌─────────┐
│   ❄️    │  ← Grisé
│         │     Opacity: 0.5
│ Attente │     Tooltip: "Attendez..."
└─────────┘
```

### Compteur sur la grille

```
Grande taille:
    ❄️
    8
    
Taille: 48px (chiffre)
        32px (icône)
Police: 900 (extra-bold)
Couleur: #0a4d6e
Animation: pulse (1.5s)
```

---

## 📱 Responsive

### Desktop (> 768px)
```
┌────────────────────────────────────────────┐
│  Logo                                      │
│                                            │
│  ┌──────────────┐  ┌─┐  ┌──────────┐      │
│  │              │  │ │  │  Score   │      │
│  │    Grille    │  │P│  │  Timer   │      │
│  │   10 × 4     │  │r│  │  Home    │      │
│  │              │  │o│  │  ❤️❤️❤️  │      │
│  │              │  │g│  │   ❄️     │      │
│  └──────────────┘  │r│  └──────────┘      │
│                    │e│                     │
│                    │s│                     │
│                    │s│                     │
│                    └─┘                     │
└────────────────────────────────────────────┘
```

### Mobile (< 768px)
```
┌──────────────────┐
│      Logo        │
│                  │
│  ┌────────────┐  │
│  │            │  │
│  │   Grille   │  │
│  │   10 × 4   │  │
│  │            │  │
│  └────────────┘  │
│                  │
│  [Progress bar]  │
│                  │
│  Score | Timer   │
│  Home  | ❤️❤️❤️  │
│         ❄️       │
└──────────────────┘
```

---

## 🎯 Points d'attention

### Performance
- ✅ 50 flocons = OK (CSS animations)
- ✅ Backdrop-filter = OK (GPU accelerated)
- ⚠️ Trop de flocons (>100) = lag possible

### Accessibilité
- ✅ Compteur visible (contraste élevé)
- ✅ Tooltip sur l'icône pouvoir
- ⚠️ Pas de son (à ajouter ?)
- ⚠️ Pas d'alternative textuelle pour les animations

### Compatibilité
- ✅ Chrome/Edge: Parfait
- ✅ Firefox: Parfait
- ✅ Safari: OK (backdrop-filter supporté)
- ⚠️ IE11: Non supporté (mais obsolète)

---

## 🎨 Variantes possibles (futures)

### Variante 1 : Givre coloré
```css
/* Givre bleu (actuel) */
background: rgba(173, 216, 230, 0.85);

/* Givre violet (variante) */
background: rgba(186, 85, 211, 0.85);

/* Givre vert (variante) */
background: rgba(144, 238, 144, 0.85);
```

### Variante 2 : Plus de flocons
```javascript
// Actuel: 50 flocons
<div v-for="i in 50" :key="i" class="snowflake">

// Variante: 100 flocons (plus dense)
<div v-for="i in 100" :key="i" class="snowflake">
```

### Variante 3 : Fissures aléatoires
```javascript
// Actuel: 8 patterns fixes
const patterns = [ /* 8 patterns */ ];

// Variante: patterns générés aléatoirement
function randomCrackPattern() {
  return {
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    width: `${50 + Math.random() * 50}%`,
    height: '2px',
    transform: `rotate(${Math.random() * 360}deg)`
  };
}
```

---

## 📸 Captures d'écran recommandées

Pour la documentation :
1. **Avant activation** : Grille normale, icône active
2. **Tempête de neige** : Flocons qui tombent
3. **Grille gelée (8)** : Compteur 8, pas de fissures
4. **Première fissure (4)** : Compteur 4, 1 fissure
5. **Multiples fissures (2)** : Compteur 2, 6 fissures
6. **Libération** : Animation de disparition
7. **Vue mobile** : Responsive
8. **Deux joueurs** : Split screen

---

Bon développement ! 🎮❄️
