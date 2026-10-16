"""GENERATOR DRZEW 3D — styl „Wild Rift": masywne, uproszczone korony, miękkie światło.

Od 2026-10-05 (`OI-164`, pilot zaakceptowany przez autora): zamiast billboardów
pixel-artu w widoku 3D stoją modele — siedem gatunków stempli lasu. Jeden plik `public/assets/trees/trees.glb`, jeden OBIEKT na wariant
(`swierk_duzy`, `buk_sredni`…) — `WorldView3D` instancjonuje je po nazwie.

Uruchomienie (Blender bez okna, `blender` nie jest w PATH — `tools/CLAUDE.md`):
    "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b -P tools/tree3d.py
    ... -- --zapisz      (zapis .glb; domyślnie tylko raport)

Konwencje jak u stworzeń (`quad3d.py`): kolor w KOLORACH WIERZCHOŁKÓW (sRGB → lin),
jeden materiał bez tekstur, podstawa pnia w (0, 0, 0), jednostki POSTACI
(12,80 j. = wzrost gracza), scena budowana od zera.

⭐ **Dwie rzeczy robią styl, nie geometria:**
1. NORMALNE KORONY są wspólne dla całej bryły (gradient elipsoidy korony
   zmieszany z normalną kępy). Kępy cieniują się wtedy jak JEDNA miękka masa,
   a nie jak worek kul — to jest różnica między „Wild Rift" a „low-poly".
2. Kolor niesie ALBEDO + zapieczone zacienienie (wnętrze, spód), nigdy kierunek
   światła — światło daje scena (`WorldView3D`), więc drzewo nie może mieć
   słońca namalowanego z innej strony niż dzik obok.
"""
import math
import os
import random
import sys

import bmesh
import bpy
from mathutils import Vector, noise

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
ZAPISZ = "--zapisz" in argv
CEL = os.path.join(ROOT, "public", "assets", "trees", "trees.glb")

WZROST_POSTACI = 12.8
#: Budżet trójkątów na drzewo — w kadrze telefonu stoi ich ~150 naraz.
MAX_TROJKATOW = 3200


def _lin(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def _mix(a, b, t):
    t = max(0.0, min(1.0, t))
    return tuple(x + (y - x) * t for x, y in zip(a, b))


def _mul(c, k):
    return tuple(max(0.0, min(255.0, x * k)) for x in c)


# ── gatunki: DANE, nie kod ───────────────────────────────────────────────────
# Kolory w sRGB 0–255. `dol/srod/gora` — gradient korony od spodu do szczytu.
# Referencją sylwetki i barwy są stemple pixel-artu (`public/assets/tree_stamps.png`):
# dąb szeroki na grubych konarach, brzoza biała w czarne plamy i rzadka, grab
# gęsty ciemny owal, olcha oliwkowa i krzywa, wierzba w zwisających kurtynach.
#   mn       — mnożnik wysokości względem klasy rozmiaru (28/20/13 j.)
#   szum     — amplituda nieregularności kęp
#   pochyl   — przechył pnia (ułamek wysokości, kierunek losowy)
#   plamy    — kolor plam kory (brzoza)
#   zwis     — rozciągnięcie spodu kęp w dół (wierzba: kurtyny); brak = spłaszczenie
#   pasma    — liczba pionowych pasm witek w kolorze (wierzba)
#   zwis_min — najniższy punkt kurtyny (× wysokość) — niżej chowała pień, drzewo czytało się jak stóg
#   galaz_r  — grubość konarów (× promień pnia)
#   owoce    — kolor owoców (jabłoń, śliwa, grusza — wieś); `owoce_n` sztuk na koronie
#   uklad    — jak stoją kępy: `kopula` (buk), `rozlozysty` (dąb: szeroki pierścień
#              osobnych kęp), `kolumna` (olcha: słup ze szpicem), `luzny` (brzoza:
#              kępy z przerwami); `ring_z`/`ring_r` stroją pierścień kopuły (grab: owal)
# ⚠ Do 2026-10-05 wszystkie liściaste szły JEDNYM przepisem (kopuła) i różniły się
#   tylko proporcjami — autor z gry: „drzewa wyglądają bardzo podobnie". Gatunek
#   ma się rozpoznawać po SYLWETCE i barwie, nie po szczególe.
GATUNKI = {
    "buk": dict(
        typ="lisciaste", mn=1.0,
        kora=(118, 108, 96), kora_dol=(74, 66, 58),
        dol=(36, 86, 50), srod=(76, 136, 56), gora=(160, 194, 74),
        pien_r=0.040, pien_wys=0.52, galezie=3, galaz_r=0.55,
        srodek=0.66, szer=0.40, wys=0.27, kepy=6, gorne=2, kepa_r=(0.46, 0.60), szum=0.16,
        uklad="kopula",
    ),
    "dab": dict(
        typ="lisciaste", mn=0.95,
        kora=(104, 78, 54), kora_dol=(62, 46, 34),
        dol=(24, 50, 28), srod=(52, 86, 36), gora=(118, 140, 52),
        pien_r=0.064, pien_wys=0.44, galezie=6, galaz_r=0.72, pochyl=0.03,
        srodek=0.62, szer=0.50, wys=0.22, kepy=6, gorne=2, kepa_r=(0.30, 0.40), szum=0.26,
        uklad="rozlozysty",
    ),
    "grab": dict(
        typ="lisciaste", mn=1.0,
        kora=(120, 116, 104), kora_dol=(78, 74, 66),
        dol=(18, 60, 48), srod=(38, 100, 66), gora=(94, 152, 92),
        pien_r=0.036, pien_wys=0.36, galezie=2, galaz_r=0.5,
        srodek=0.61, szer=0.27, wys=0.37, kepy=6, gorne=2, kepa_r=(0.46, 0.56), szum=0.08,
        uklad="kopula", ring_z=(-0.60, 0.30), ring_r=(0.38, 0.50),
    ),
    "olcha": dict(
        typ="lisciaste", mn=1.0,
        kora=(92, 80, 66), kora_dol=(58, 50, 42),
        dol=(26, 60, 46), srod=(52, 100, 66), gora=(112, 150, 90),
        pien_r=0.034, pien_wys=0.40, galezie=2, galaz_r=0.5, pochyl=0.07,
        srodek=0.56, szer=0.27, wys=0.40, kepy=6, gorne=3, kepa_r=(0.48, 0.62), szum=0.18,
        uklad="kolumna",
    ),
    "brzoza": dict(
        typ="lisciaste", mn=1.05,
        kora=(226, 222, 208), kora_dol=(150, 146, 136), plamy=(44, 40, 38),
        dol=(64, 108, 48), srod=(118, 162, 62), gora=(198, 216, 100),
        pien_r=0.026, pien_wys=0.70, galezie=3, galaz_r=0.45, pochyl=0.04,
        srodek=0.68, szer=0.29, wys=0.30, kepy=7, gorne=1, kepa_r=(0.26, 0.36), szum=0.26,
        uklad="luzny",
    ),
    "wierzba": dict(
        typ="lisciaste", mn=0.85,
        kora=(112, 82, 56), kora_dol=(68, 48, 34),
        dol=(52, 96, 40), srod=(92, 142, 52), gora=(170, 198, 84),
        pien_r=0.065, pien_wys=0.50, galezie=4, galaz_r=0.65, pochyl=0.06,
        srodek=0.66, szer=0.46, wys=0.24, kepy=7, gorne=1, kepa_r=(0.38, 0.48), szum=0.12,
        zwis=1.9, pasma=14, zwis_min=0.30,
    ),
    "swierk": dict(
        typ="iglaste", mn=1.0,
        kora=(96, 64, 46), kora_dol=(60, 40, 30),
        dol=(16, 48, 42), srod=(32, 84, 58), gora=(78, 128, 72),
        pien_r=0.030, start=0.12, szer=0.22, pietra=7,
    ),
    # Drzewa owocowe Zagajów — niższe i szersze, korona okrągła, owoce jako
    # osobne kulki (plamy w kolorach wierzchołków czytały się jak choroba liści).
    "jablon": dict(
        typ="lisciaste", mn=0.72,
        kora=(98, 76, 58), kora_dol=(62, 48, 38),
        dol=(34, 76, 40), srod=(66, 120, 50), gora=(140, 176, 70),
        pien_r=0.045, pien_wys=0.40, galezie=3, galaz_r=0.6, pochyl=0.05,
        srodek=0.62, szer=0.42, wys=0.27, kepy=5, gorne=1, kepa_r=(0.50, 0.62), szum=0.18,
        owoce=(200, 48, 36), owoce_n=14,
    ),
    "sliwa": dict(
        typ="lisciaste", mn=0.72,
        kora=(86, 66, 56), kora_dol=(54, 42, 36),
        dol=(30, 68, 42), srod=(58, 110, 50), gora=(124, 164, 66),
        pien_r=0.040, pien_wys=0.42, galezie=3, galaz_r=0.55, pochyl=0.06,
        srodek=0.63, szer=0.38, wys=0.28, kepy=5, gorne=1, kepa_r=(0.50, 0.62), szum=0.18,
        owoce=(92, 52, 128), owoce_n=16,
    ),
    "grusza": dict(
        typ="lisciaste", mn=0.80,
        kora=(96, 80, 64), kora_dol=(60, 50, 40),
        dol=(32, 72, 42), srod=(62, 116, 52), gora=(134, 172, 70),
        pien_r=0.042, pien_wys=0.46, galezie=3, galaz_r=0.55,
        srodek=0.66, szer=0.34, wys=0.31, kepy=5, gorne=2, kepa_r=(0.50, 0.62), szum=0.16,
        owoce=(214, 186, 64), owoce_n=14,
    ),
}

ROZMIARY = [("duzy", 28.0), ("sredni", 20.0), ("maly", 13.0)]
#: Kształtów na gatunek × rozmiar: `buk_duzy`, `buk_duzy_2`… — `Trees3D` wybiera
#: po położeniu drzewa. Jeden kształt + obrót dawał las klonów.
KSZTALTY = 2
WARIANTY = [
    (f"{gat}_{roz}" + ("" if v == 0 else f"_{v + 1}"), gat, H * g["mn"], 1000 * i + 10 * k + v)
    for i, (gat, g) in enumerate(GATUNKI.items())
    for k, (roz, H) in enumerate(ROZMIARY)
    for v in range(KSZTALTY)
]


class Siatka:
    """Wierzchołki + ściany + kolor (sRGB) + normalna dla każdego wierzchołka."""

    def __init__(self):
        self.v, self.f, self.kol, self.n = [], [], [], []

    def w(self, p, kol, n):
        self.v.append(Vector(p))
        self.kol.append(kol)
        nn = Vector(n)
        self.n.append(nn.normalized() if nn.length > 1e-9 else Vector((0, 0, 1)))
        return len(self.v) - 1

    def trojkaty(self):
        return sum(len(f) - 2 for f in self.f)


def _rura(s, a, b, ra, rb, seg, kol_a, kol_b, pierscienie=3, rng=None, falowanie=0.0):
    """Walec stożkowy od `a` do `b` (bez denek — końce siedzą w ziemi/koronie)."""
    os_ = (b - a)
    dl = os_.length
    d = os_.normalized()
    pom = Vector((1, 0, 0)) if abs(d.x) < 0.9 else Vector((0, 1, 0))
    u = d.cross(pom).normalized()
    v = d.cross(u).normalized()
    idx = []
    for k in range(pierscienie + 1):
        t = k / pierscienie
        c = a + os_ * t
        if rng is not None and falowanie:
            c = c + (u * rng.uniform(-1, 1) + v * rng.uniform(-1, 1)) * falowanie * math.sin(math.pi * t)
        r = ra + (rb - ra) * t
        kol = _mix(kol_a, kol_b, t)
        wiersz = []
        for j in range(seg):
            al = 2 * math.pi * j / seg
            n = u * math.cos(al) + v * math.sin(al)
            wiersz.append(s.w(c + n * r, kol, n))
        idx.append(wiersz)
    for k in range(pierscienie):
        for j in range(seg):
            j2 = (j + 1) % seg
            s.f.append((idx[k][j], idx[k][j2], idx[k + 1][j2], idx[k + 1][j]))
    return dl


def pien(s, rng, H, g, wys, L):
    """Pień z rozszerzeniem korzeniowym; wygięty szumem i przechylony o `L`."""
    r0 = g["pien_r"] * H
    plamy = g.get("plamy")
    seg, rings = (10, 12) if plamy else (8, 7)
    off = Vector((rng.uniform(0, 50), rng.uniform(0, 50), rng.uniform(0, 50)))
    idx = []
    for k in range(rings + 1):
        t = k / rings
        z = t * wys
        r = r0 * (1 - 0.45 * t)
        if t < 0.2:
            r *= 1 + 0.9 * (0.2 - t) / 0.2      # rozszerzenie u nasady
        c = Vector((noise.noise(off + Vector((0, 0, t * 2))) * 0.25 * r0 * t * 3,
                    noise.noise(off + Vector((7, 0, t * 2))) * 0.25 * r0 * t * 3, z)) + L * t ** 1.6
        kol0 = _mix(g["kora_dol"], g["kora"], min(1.0, t * 3.0))
        wiersz = []
        for j in range(seg):
            al = 2 * math.pi * j / seg + 0.3 * k
            n = Vector((math.cos(al), math.sin(al), 0.0))
            rr = r
            if t < 0.15:   # korzenie: co drugi promień grubszy
                rr *= 1.0 + (0.35 if j % 2 == 0 else -0.05) * (0.15 - t) / 0.15
            kol = kol0
            # brzoza: czarne plamy (szum gęsty w pionie, rzadki w obwodzie)
            if plamy and t > 0.06 and noise.noise(off + Vector((math.cos(al) * 1.2, math.sin(al) * 1.2, z * 0.9))) > 0.28:
                kol = plamy
            wiersz.append(s.w(c + n * rr, kol, n))
        idx.append(wiersz)
    for k in range(rings):
        for j in range(seg):
            j2 = (j + 1) % seg
            s.f.append((idx[k][j], idx[k][j2], idx[k + 1][j2], idx[k + 1][j]))
    return idx[-1]


def _kula(promien, podzial):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=podzial, radius=promien)
    pts = [v.co.copy() for v in bm.verts]
    faces = [tuple(v.index for v in f.verts) for f in bm.faces]
    bm.free()
    return pts, faces


def korona_lisciasta(s, rng, H, g, L):
    c0 = Vector((0, 0, g["srodek"] * H)) + L
    ex, ez = g["szer"] * H, g["wys"] * H
    n = g["kepy"]
    faza = rng.uniform(0, math.tau)
    uklad = g.get("uklad", "kopula")
    gorne = g["gorne"]
    if uklad == "kolumna":
        # słup kęp malejących ku szczytowi, lekko rozchwiany; boczne kępy niżej
        kepy = []
        for i in range(n):
            t = i / (n - 1)
            a = faza + i * 2.3
            o = ex * 0.18 * (1 - t) * rng.uniform(0.6, 1.0)
            kepy.append((Vector((c0.x + math.cos(a) * o, c0.y + math.sin(a) * o, c0.z - 0.80 * ez + t * 1.75 * ez)),
                         ex * (0.80 - 0.55 * t) * rng.uniform(0.92, 1.06)))
        for i in range(gorne):
            a = faza + math.tau * (i + 0.5) / gorne + rng.uniform(-0.3, 0.3)
            t = rng.uniform(0.10, 0.50)
            kepy.append((Vector((c0.x + math.cos(a) * ex * 0.46 * (1 - t), c0.y + math.sin(a) * ex * 0.46 * (1 - t),
                                 c0.z - 0.80 * ez + t * 1.75 * ez)), ex * 0.44 * (1 - 0.4 * t)))
        gorne = 0
    elif uklad == "luzny":
        # kępy porozrzucane w elipsoidzie korony, z przerwami między nimi
        kepy = [(c0 + Vector((0, 0, 0.50 * ez)), 0.38 * ex)]
        for _ in range(600):
            if len(kepy) >= n + 1:
                break
            d = Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-1, 1)))
            if d.length > 1:
                continue
            pk = c0 + Vector((d.x * ex * 0.78, d.y * ex * 0.78, d.z * ez * 0.90))
            rk = ex * rng.uniform(*g["kepa_r"])
            if all((pk - ck).length > (rk + rc) * 0.70 for ck, rc in kepy):
                kepy.append((pk, rk))
    elif uklad == "rozlozysty":
        # szeroki, płaski pierścień OSOBNYCH kęp — prześwity pokazują konary
        kepy = [(c0 + Vector((0, 0, 0.40 * ez)), 0.50 * ex)]
        for i in range(n):
            a = faza + math.tau * i / n + rng.uniform(-0.30, 0.30)
            rr = ex * rng.uniform(0.62, 0.82)
            z = rng.uniform(-0.35, 0.25) * ez
            kepy.append((c0 + Vector((math.cos(a) * rr, math.sin(a) * rr, z)), ex * rng.uniform(*g["kepa_r"])))
    else:
        kepy = [(c0 + Vector((0, 0, 0.30 * ez)), 0.66 * ex)]
        rz, rrr = g.get("ring_z", (-0.40, 0.05)), g.get("ring_r", (0.48, 0.62))
        for i in range(n):
            a = faza + math.tau * i / n + rng.uniform(-0.25, 0.25)
            rr = ex * rng.uniform(*rrr)
            z = rng.uniform(*rz) * ez
            kepy.append((c0 + Vector((math.cos(a) * rr, math.sin(a) * rr, z)), ex * rng.uniform(*g["kepa_r"])))
    for i in range(gorne):
        a = faza + math.tau * (i + 0.5) / max(1, gorne) + rng.uniform(-0.4, 0.4)
        rr = ex * rng.uniform(0.18, 0.32)
        kepy.append((c0 + Vector((math.cos(a) * rr, math.sin(a) * rr, ez * rng.uniform(0.45, 0.62))),
                     ex * rng.uniform(0.40, 0.50)))
    podzial = 3 if H >= 16 else 2   # ⚠ w Blenderze 5 `subdivisions=2` to 80 ścian — obrys kanciasty na zbliżeniu
    baza, sciany = _kula(1.0, podzial)
    off = Vector((rng.uniform(0, 99), rng.uniform(0, 99), rng.uniform(0, 99)))
    ex2, ez2 = ex * 1.05, ez * 1.25    # elipsoida „całej korony" dla normalnych
    zwis = g.get("zwis")
    pasma = g.get("pasma")
    for (c, r) in kepy:
        jitter = rng.uniform(0.93, 1.07)
        start = len(s.v)
        for d in baza:
            amp = 1.0 + g["szum"] * noise.noise(off + d * 1.7 + c * 0.05)
            p = c + d * r * amp
            if d.z < -0.15:
                if zwis:                     # wierzba: spód kępy opada kurtyną
                    p.z = max(g["zwis_min"] * H, c.z + (p.z - c.z) * zwis)
                    p.x, p.y = c.x + (p.x - c.x) * 0.92, c.y + (p.y - c.y) * 0.92
                else:                        # spłaszczony spód kępy
                    p.z = c.z + (p.z - c.z) * 0.72
            q = p - c0
            gl = Vector((q.x / ex2 ** 2, q.y / ex2 ** 2, q.z / ez2 ** 2)).normalized()
            nrm = (d * 0.32 + gl * 0.68).normalized()
            t = max(0.0, (p.z - (c0.z - ez)) / (2.2 * ez))
            kol = _mix(g["dol"], g["srod"], t * 1.6) if t < 0.62 else _mix(g["srod"], g["gora"], (t - 0.62) / 0.38)
            wn = Vector((q.x / ex2, q.y / ex2, q.z / ez2)).length   # ~1 na skórze korony
            ao = 0.50 + 0.50 * min(1.0, wn ** 1.6)
            if nrm.z < 0:
                ao *= 1.0 + (0.15 if zwis else 0.40) * nrm.z
            if pasma:                        # pionowe pasma witek
                ao *= 0.72 + 0.42 * (0.5 + 0.5 * math.sin(math.atan2(q.y, q.x) * pasma + noise.noise(p * 0.3) * 2))
            s.w(p, _mul(kol, ao * jitter), nrm)
        for f in sciany:
            s.f.append(tuple(start + i for i in f))
    return kepy, c0


def owoce(s, rng, H, g, kepy):
    """Owoce: małe kulki NA skórze kęp, tylko od boku i z góry (spód i tak w cieniu)."""
    baza, sciany = _kula(1.0, 1)
    jasny = _mul(g["owoce"], 1.25)
    for _ in range(g["owoce_n"]):
        c, r = kepy[rng.randrange(len(kepy))]
        while True:
            d = Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-0.35, 1)))
            if 0.2 < d.length <= 1:
                break
        d.normalize()
        sr = c + d * r * 0.97
        rf = g.get("owoc_r", 0.032 * H)   # krzewy: jagody w j. wprost (0,032·H dałoby 0,8 px)
        start = len(s.v)
        for v in baza:
            s.w(sr + v * rf, _mix(g["owoce"], jasny, max(0.0, v.z)), v)
        for f in sciany:
            s.f.append(tuple(start + i for i in f))


def galezie(s, rng, H, g, kepy, L):
    """Kilka konarów od pnia do kęp — widać je pod koroną (Wild Rift je pokazuje)."""
    r0 = g["pien_r"] * H
    zrodlo = Vector((0, 0, g["pien_wys"] * H * 0.62)) + L * 0.62 ** 1.6
    for (c, r) in sorted(kepy[1:], key=lambda k: -k[1])[: g["galezie"]]:
        cel = c + (zrodlo - c).normalized() * r * 0.35
        gr = g["galaz_r"]
        _rura(s, zrodlo, cel, r0 * gr, r0 * gr * 0.4, 6, g["kora"], g["kora"], 2, rng, r0 * 0.6)


def korona_iglasta(s, rng, H, g):
    n = g["pietra"]
    R = g["szer"] * H
    z0 = g["start"] * H
    krok = (H * 0.80 - z0) / n
    for i in range(n):
        t = i / (n - 1)
        zb = z0 + i * krok
        szczyt = H if i == n - 1 else zb + krok * 2.0
        r = R * (1.0 - 0.80 * t) * rng.uniform(0.94, 1.04)
        opad = 0.06 * H * (r / R)
        M = 14
        faza = rng.uniform(0, math.tau)
        jasn = 0.82 + 0.26 * t
        dol_r, srod_r, wew = [], [], []
        for j in range(M):
            a = faza + math.tau * j / M + rng.uniform(-0.08, 0.08)
            ca, sa = math.cos(a), math.sin(a)
            zew = j % 2 == 0
            rr = r * (1.0 if zew else 0.80) * rng.uniform(0.92, 1.05)
            z = zb - opad * (1.0 if zew else 0.35)
            n_bok = Vector((ca, sa, 0.65))
            dol_r.append(s.w((ca * rr, sa * rr, z), _mul(g["srod"], jasn * (1.0 if zew else 0.86)), n_bok))
            zm = zb + 0.45 * (szczyt - zb)
            srod_r.append(s.w((ca * rr * 0.50, sa * rr * 0.50, zm), _mul(_mix(g["srod"], g["gora"], 0.6), jasn), n_bok))
            wew.append(s.w((ca * r * 0.32, sa * r * 0.32, zb + 0.05 * H), _mul(g["dol"], 0.9), Vector((ca * 0.3, sa * 0.3, -1))))
        wierz = s.w((rng.uniform(-0.02, 0.02) * R, rng.uniform(-0.02, 0.02) * R, szczyt),
                    _mul(g["gora"], jasn), Vector((0, 0, 1)))
        spod = s.w((0, 0, zb + 0.11 * H), _mul(g["dol"], 0.8), Vector((0, 0, -1)))
        for j in range(M):
            j2 = (j + 1) % M
            s.f.append((dol_r[j], dol_r[j2], srod_r[j2], srod_r[j]))
            s.f.append((srod_r[j], srod_r[j2], wierz))
            s.f.append((dol_r[j2], dol_r[j], wew[j], wew[j2]))
            s.f.append((wew[j2], wew[j], spod))


def zbuduj(nazwa, gat, H, ziarno):
    g = GATUNKI[gat]
    rng = random.Random(ziarno)
    s = Siatka()
    a = rng.uniform(0, math.tau)
    L = Vector((math.cos(a), math.sin(a), 0)) * g.get("pochyl", 0.0) * H
    if g["typ"] == "lisciaste":
        pien(s, rng, H, g, g["pien_wys"] * H, L)
        kepy, _ = korona_lisciasta(s, rng, H, g, L)
        galezie(s, rng, H, g, kepy, L)
        if g.get("owoce"):
            owoce(s, rng, H, g, kepy)
    else:
        pien(s, rng, H, g, H * 0.75, Vector((0, 0, 0)))
        korona_iglasta(s, rng, H, g)
    return s


def do_blendera(nazwa, s, mat):
    me = bpy.data.meshes.new(nazwa)
    me.from_pydata([tuple(v) for v in s.v], [], s.f)
    me.update(calc_edges=True)
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new(nazwa, me)
    bpy.context.scene.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    for o in bpy.context.scene.objects:
        o.select_set(o == ob)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    # ⚠ Siatka z OSOBNYCH ścian (kamienie pieca: płaski kolor na kamień) —
    #   każda ściana to wyspa, a dla wyspy z jednej ściany „na zewnątrz" jest
    #   niejednoznaczne: Blender odwracał co drugą i przez dziury widać było
    #   trawę. Taka siatka ma kolejność wierzchołków poprawną z budowy.
    if not getattr(s, "bez_wyrownania", False):
        bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode="OBJECT")
    me.normals_split_custom_set_from_vertices([tuple(n) for n in s.n])
    kol = me.color_attributes.new("Col", "FLOAT_COLOR", "POINT")
    for i, c in enumerate(s.kol):
        kol.data[i].color = (*[_lin(x) for x in c], 1.0)
    me.color_attributes.active_color = kol
    me.materials.append(mat)
    return ob


def material():
    mat = bpy.data.materials.new("drzewo")
    mat.use_nodes = True
    tree = mat.node_tree
    bsdf = next(n for n in tree.nodes if n.type == "BSDF_PRINCIPLED")
    vc = tree.nodes.new("ShaderNodeVertexColor")
    vc.layer_name = "Col"
    tree.links.new(vc.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.95
    bsdf.inputs["Metallic"].default_value = 0.0
    return mat


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    mat = material()
    bledy = []
    obiekty = []
    print(f"{'wariant':18} {'wys j':>6} {'x postaci':>9} {'szer j':>6} {'trójk.':>6}")
    for nazwa, gat, H, ziarno in WARIANTY:
        s = zbuduj(nazwa, gat, H, ziarno)
        zs = [v.z for v in s.v]
        xs = [math.hypot(v.x, v.y) for v in s.v]
        wys, szer = max(zs), 2 * max(xs)
        tr = s.trojkaty()
        print(f"{nazwa:18} {wys:6.1f} {wys / WZROST_POSTACI:9.2f} {szer:6.1f} {tr:6d}")
        if min(zs) < -0.5:
            bledy.append(f"{nazwa}: bryła schodzi {min(zs):.2f} j. pod grunt")
        if not (0.9 * H <= wys <= 1.12 * H):
            bledy.append(f"{nazwa}: wysokość {wys:.1f} j. poza ±10% celu {H}")
        if tr > MAX_TROJKATOW:
            bledy.append(f"{nazwa}: {tr} trójkątów > budżet {MAX_TROJKATOW}")
        if any(any(math.isnan(c) for c in v) for v in s.v):
            bledy.append(f"{nazwa}: NaN w wierzchołkach")
        obiekty.append(do_blendera(nazwa, s, mat))
    for b in bledy:
        print("BŁĄD", b)
    print("bramka:", "CZERWONA" if bledy else "zielona")
    if ZAPISZ:
        if bledy:
            raise SystemExit("[zapis] ODMOWA — bramka czerwona")
        os.makedirs(os.path.dirname(CEL), exist_ok=True)
        for o in bpy.context.scene.objects:
            o.select_set(o in obiekty)
        bpy.ops.export_scene.gltf(
            filepath=CEL, export_format="GLB", use_selection=True, export_yup=True,
            export_animations=False, export_skins=False, export_morph=False,
            export_vertex_color="ACTIVE", export_all_vertex_colors=False, export_apply=False,
            # ⚠ meshopt (EXT_meshopt_compression): `Trees3D` MUSI dać GLTFLoaderowi
            # `MeshoptDecoder`, inaczej plik się nie wczyta (i zostaną billboardy).
            export_meshopt_compression_enable=True)
        print(f"[zapis] {CEL} {os.path.getsize(CEL)} bajtów")
    else:
        print("[przymiar] NIC nie zapisano. Zapis: -- --zapisz")


if __name__ == "__main__":   # `tools/props3d.py` importuje stąd klocki
    main()
