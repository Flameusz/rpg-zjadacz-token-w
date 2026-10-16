"""GENERATOR DOMÓW 3D — budynki jako OBIEKTY Tiled (warstwa `budynki`).

2026-10-09 (`OI-164`, audyt `docs/audyt_zagaje_swiat_2026-10-09.md` §B.4):
budynek przestał być plamą kafli elewacji — jest PROSTOKĄTEM w warstwie
obiektów `budynki` (nazwa `budynek`), z typem, obrotem i detalami jako
właściwościami. Generator robi JEDEN MODEL NA OBIEKT, nazwany
`dom-<prefiks3d>-<id obiektu>` (`prefiks3d` — właściwość MAPY); silnik stawia
go z obrotem, a kolizję liczy z prostokąta (`src/world/Buildings.ts`).

Uruchomienie (Blender bez okna):
    "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b -P tools/houses3d.py
    ... -- --zapisz      (zapis .glb; domyślnie tylko raport)

⭐ Właściwości obiektu `budynek` (Tiled, prostokąt w pikselach, na siatce kafli):
    typ          chalupa | gospodarczy | stodola | kurnik | wiata | karczma  (`RODZAJ`)
                 woz | stragan | kozel | snopki | pranie | gnojownik — sprzęt zagród (K5/K6, bez drzwi)
                 plot | zerdzie | wrota | palisada | brama | kladka  (`OGRODZENIA` — bez
                 detali domu). ⭐ Wieś grodzi się PŁOTEM (plecionka z wikliny
                 albo żerdzie), palisada jest szczeblem GRODU (2026-10-09,
                 owalnica Zagajów) — nie stawiaj jej we wsi.
    kolizja      false → bez kolizji (brama nad drogą); domyślnie prostokąt lity
    skroc_l, skroc_p  (kafle, np. 0.5) — `plot`: koniec płotu cofnięty od LEWEJ / PRAWEJ
                 krawędzi (lewo = lewa strona frontu oglądanego z zewnątrz). Na NAROŻNIKU
                 oba płoty obejmują kafel narożny i cofają się o 0,5 — spotykają się w jego
                 środku jednym palem. Bez tego pal płotu stał na krawędzi kafla, a płot
                 prostopadły w jego osi: pół kafla szczeliny w każdym rogu (zrzut autora).
    dach         szczyt (szczyt we froncie) | kalenica (okap we froncie)
    sciany       bale | deski
    obrot        0 | 90 | 180 | 270 — w którą stronę patrzy FRONT (0 = na
                 południe, do kamery; 90 = wschód; 180 = północ; 270 = zachód)
    drzwi        "3:drzwi,7:wrota" — przesunięcie w kaflach od LEWEJ krawędzi
                 frontu (patrząc na front z zewnątrz) : drzwi | drzwi_pol | wrota
    okna         "1,4" — okna we froncie, te same przesunięcia
    komin        przesunięcie komina (kolumna frontu)
    klapa        "3" — klapa kurnika z trapem
    okno_szczyt, otwor  (bool) — okienko w szczycie / otwór na siano
Dwa nakładające się obiekty = rzut L/T/U: dachy przenikają się w 3D same.

⚠ Obiekt i jego model wiąże ID — usunięcie i ponowne narysowanie obiektu
w Tiled daje NOWE id, więc trzeba przepuścić generator (`--zapisz`). Obiekt
bez modelu w pliku stoi w grze bez bryły 3D (kolizja zostaje) — silnik
ostrzega o tym w konsoli.

Front (ściana z drzwiami) modelu patrzy na −Y (do kamery); obrót robi silnik.
"""
import json
import math
import os
import random
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from tree3d import Siatka, _mix, _mul, do_blendera, material  # noqa: E402
from props3d import czworokat, kloda, kulka, skrzynka, skrzynka_wzdluz  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
ZAPISZ = "--zapisz" in argv
CEL = os.path.join(ROOT, "public", "assets", "props", "houses3d.glb")
MAPY = ["village-zagaje.tmj", "forrest.tmj"]
PX = 4.955                       # px świata na jednostkę modelu (skala gracza)
TW = 32
MAX_TROJKATOW = 8000      # na MODEL

# ── barwy ─────────────────────────────────────────────────────────────────────
BAL = ((112, 78, 48), (150, 108, 66))
DESKA = ((104, 76, 50), (140, 104, 68))
DESKA_C = (70, 50, 34)
STRZECHA = ((150, 118, 64), (214, 182, 112))
KAMIEN = ((92, 92, 96), (138, 136, 134))
OKNO = (236, 168, 78)
DRZWI = (84, 58, 38)

# Wysokość ścian (j.) i spadek dachu (stopnie) wg typu.
RODZAJ = {
    "chalupa": dict(sciana=15.0, kat=44),
    "gospodarczy": dict(sciana=15.0, kat=42),
    "stodola": dict(sciana=19.0, kat=40),
    "kurnik": dict(sciana=10.0, kat=40),
    "wiata": dict(sciana=14.0, kat=30),
    # Karczma: duża chałupa przy trakcie, z WIECHĄ (wiązka zieleni na tyczce
    # przy narożniku frontu) — dawny znak „tu szynk", czytelny z daleka.
    "karczma": dict(sciana=16.0, kat=44),
}
TYPY_DRZWI = {"drzwi": 1, "drzwi_pol": 1, "wrota": 2}
#: Ogrodzenia — własna bryła zamiast domu (`ogrodzenie()`): ostrokół z zaostrzonych
#: pali (~2,5 m — wyższy chowałby fronty chałup za nim) i brama nad drogą.
OGRODZENIA = {"palisada": dict(wys=17.0), "brama": dict(wys=22.0),
              # Wieś (owalnica): płot do pasa — plecionka z wikliny między
              # palikami, żerdzie na słupkach (pastwisko, ogród) i wrota
              # w płocie (otwarte skrzydła, bez kolizji: `kolizja=false`).
              "plot": dict(wys=7.0), "zerdzie": dict(wys=7.5), "wrota": dict(wys=8.5),
              # kładka przez potok (2026-10-10): pomost z desek w lekkim łuku, pale,
              # poręcze. ⚠ ZAWSZE z `kolizja=false`, a pod nią kafle `path` nad wodą —
              # o przechodniości decyduje najwyższy kafel (TiledMap), model jest tylko obrazem.
              "kladka": dict(wys=3.0),
              # K5 (2026-10-10) — sprzęt zagród jako obiekty z obrotem i kolizją (rekwizyt
              # `DECOR_PROPS` nie umie ani jednego, ani drugiego): wóz drabiniasty (dyszel
              # w +X), stragan Anny przed karczmą, kozioł do piłowania z kłodą, snopki lnu.
              # Skala: ~1 kafel = 1 m (drzwi 11,5 j. ≈ 1,8 m).
              "woz": dict(wys=11.0), "stragan": dict(wys=15.0), "kozel": dict(wys=11.6),
              "snopki": dict(wys=8.0),
              # K6 (2026-10-11): sznur z praniem (`kolizja=false` — przechodzi się pod
              # sznurem; rząd W–E, bo wzdłuż osi kamery zlewa się w słupek) i gnojownik
              # przy oborze (lity: obora bez gnojownika to obora-atrapa, `wioska_plan.md` B14).
              "pranie": dict(wys=11.0), "gnojownik": dict(wys=7.6)}
WIKLINA = ((104, 84, 52), (150, 124, 78))


# ── odczyt mapy ──────────────────────────────────────────────────────────────

def _lista(v):
    if v in (None, ""):
        return []
    return [int(x) for x in str(v).split(",") if x.strip()]


def wczytaj_budynki(plik):
    """Obiekty warstwy `budynki` → opisy w LOKALNYCH kaflach (front = dolna krawędź)."""
    m = json.load(open(os.path.join(ROOT, "public", "assets", "maps", plik), encoding="utf-8"))
    prefiks = next((p["value"] for p in m.get("properties", []) if p["name"] == "prefiks3d"), None)
    warstwa = next((l for l in m["layers"] if l["type"] == "objectgroup" and l["name"] == "budynki"), None)
    if warstwa is None:
        return prefiks, [], []
    out, bledy = [], []
    for o in warstwa["objects"]:
        pr = {p["name"]: p["value"] for p in o.get("properties", [])}
        nazwa = f"dom-{prefiks}-{o['id']}"
        w, h = o["width"] / TW, o["height"] / TW
        obrot = int(pr.get("obrot", 0)) % 360
        if obrot not in (0, 90, 180, 270):
            bledy.append(f"{nazwa}: obrot {obrot} (dozwolone 0/90/180/270)")
            continue
        if abs(w - round(w)) > 1e-6 or abs(h - round(h)) > 1e-6 or o["x"] % TW or o["y"] % TW:
            bledy.append(f"{nazwa}: prostokąt poza siatką kafli ({o['x']},{o['y']} {o['width']}×{o['height']})")
        szer, gleb = (round(w), round(h)) if obrot in (0, 180) else (round(h), round(w))
        typ = pr.get("typ", "chalupa")
        if typ not in RODZAJ and typ not in OGRODZENIA:
            bledy.append(f"{nazwa}: nieznany typ „{typ}” (znane: {', '.join(RODZAJ)})")
            continue
        drzwi = []
        for d in [x for x in str(pr.get("drzwi", "")).split(",") if x.strip()]:
            off, _, t = d.partition(":")
            t = t or "drzwi"
            if t not in TYPY_DRZWI:
                bledy.append(f"{nazwa}: drzwi „{d}” — nieznany rodzaj")
                continue
            drzwi.append((int(off), TYPY_DRZWI[t], t))
        sk = dict(nazwa=nazwa, x0=0, y0=0, x1=szer - 1, y1=gleb - 1, rodzaj=typ,
                  kalenica="Y" if pr.get("dach", "szczyt") == "szczyt" else "X",
                  bale=pr.get("sciany", "bale") == "bale", drzwi=drzwi, okna=_lista(pr.get("okna")),
                  okno_szczyt=bool(pr.get("okno_szczyt", False)), otwor=bool(pr.get("otwor", False)),
                  komin=_lista(pr.get("komin")), klapa=_lista(pr.get("klapa")), obrot=obrot,
                  mapa=plik, swiat=(o["x"] / TW, o["y"] / TW, w, h),
                  skroc=(float(pr.get("skroc_l", 0) or 0), float(pr.get("skroc_p", 0) or 0)))
        for kx, sz, t in drzwi:
            if not 0 <= kx <= szer - sz:
                bledy.append(f"{nazwa}: {t} na {kx} poza frontem szerokim na {szer}")
        for k in sk["okna"] + sk["komin"] + sk["klapa"]:
            if not 0 <= k < szer:
                bledy.append(f"{nazwa}: detal na {k} poza frontem szerokim na {szer}")
        out.append(sk)
    return prefiks, out, bledy


# ── klocki ───────────────────────────────────────────────────────────────────

def plyta(s, a, b, c, d, gr, kol_gora, kol_dol, srodek):
    """Płyta dachu: górny czworokąt `a b c d` + spód przesunięty o `gr` w dół + brzegi."""
    n = (b - a).cross(d - a).normalized()
    if n.z < 0:
        n = -n
    off = -n * gr
    czworokat(s, (a, b, c, d), kol_gora, srodek - n * 100)
    czworokat(s, (a + off, b + off, c + off, d + off), kol_dol, srodek + n * 100)
    pts = (a, b, c, d)
    for i in range(4):
        p, q = pts[i], pts[(i + 1) % 4]
        czworokat(s, (p, q, q + off, p + off), _mul(kol_gora, 0.78), (a + c) / 2 + off / 2)


def strzecha(s, rng, eave_l, eave_r, kal_l, kal_r, gr):
    """Połać ze strzechy pasami (warstwy wiązek): od okapu (eave) do kalenicy (kal)."""
    # bryła połaci (grubość strzechy) + na wierzchu łaty wiązek: pasy od okapu
    # w górę, każdy pocięty wzdłuż na kawałki o własnej jasności — jak fale
    # słomy w pikselowych dachach. Jedna jednolita płyta czytała się jak blacha.
    srodek = (eave_l + kal_r) / 2 - Vector((0, 0, 50))
    plyta(s, eave_l, eave_r, kal_r, kal_l, gr, _mul(STRZECHA[0], 0.9), _mul(STRZECHA[0], 0.55), srodek)
    n = (eave_r - eave_l).cross(kal_l - eave_l).normalized()
    if n.z < 0:
        n = -n
    pasy = 8
    dl = (eave_r - eave_l).length
    kaw = max(3, round(dl / 3.2))
    for k in range(pasy):
        t0, t1 = k / pasy, (k + 1) / pasy
        przes = rng.uniform(0, 1.0 / kaw)
        for j in range(kaw + 1):
            u0 = max(0.0, (j - 1) / kaw + przes)
            u1 = min(1.0, j / kaw + przes)
            if u1 - u0 < 1e-3:
                continue
            p = lambda u, t: eave_l.lerp(eave_r, u).lerp(kal_l.lerp(kal_r, u), t) + n * 0.06   # noqa: E731
            jas = _mix(*STRZECHA, 0.25 + 0.6 * t1 + rng.uniform(-0.18, 0.18))
            jas = _mul(jas, 0.86 if k % 2 else 1.0)
            if k == 0:
                jas = _mul(jas, 0.78)     # okap: ścięte końce źdźbeł, ciemniej
            czworokat(s, (p(u0, t0), p(u1, t0), p(u1, t1), p(u0, t1)), jas, srodek)


def sciana_bale(s, rng, a, b, z0, z1, gr, wysunieto):
    """Ściana z bali od `a` do `b` (poziomo), kursy po ~1,1 j.; `wysunieto` — ostatki
    bali na narożnikach (zrąb na obłap)."""
    os_ = b - a
    dl = os_.length
    d = os_.normalized()
    kursy = max(3, round((z1 - z0) / 1.1))
    hk = (z1 - z0) / kursy
    for k in range(kursy):
        kol = _mul(_mix(*BAL, rng.uniform(0.2, 0.9)), 0.92 if k % 2 else 1.0)
        c = (a + b) / 2 + Vector((0, 0, z0 + hk * (k + 0.5)))
        ext = wysunieto if k % 2 == 0 else wysunieto * 0.6
        sx = dl + 2 * ext if abs(d.x) > 0.5 else gr
        sy = gr if abs(d.x) > 0.5 else dl + 2 * ext
        skrzynka(s, c, sx, sy, hk * 0.92, kol, _mul(kol, 1.1))


def sciana_deski(s, rng, a, b, z0, z1, gr, gora=None):
    """Ściana z pionowych desek; `gora(t)` (0…1 wzdłuż ściany) obcina górę — szczyt."""
    os_ = b - a
    dl = os_.length
    d = os_.normalized()
    n = max(2, round(dl / 1.6))
    w = dl / n
    for i in range(n):
        t = (i + 0.5) / n
        zt = gora(t) if gora else z1
        if zt - z0 < 0.3:
            continue
        c = a + d * (w * (i + 0.5)) + Vector((0, 0, (z0 + zt) / 2))
        kol = _mul(_mix(*DESKA, rng.uniform(0.15, 0.9)), 0.9 if i % 2 else 1.0)
        sx = w * 0.94 if abs(d.x) > 0.5 else gr
        sy = gr if abs(d.x) > 0.5 else w * 0.94
        skrzynka(s, c, sx, sy, zt - z0, kol)


# ── skrzydło ─────────────────────────────────────────────────────────────────

def skrzydlo(s, rng, sk, ox, oy, zajete_x=()):
    """Jedno skrzydło budynku. `ox`, `oy` — punkt odniesienia modelu w px świata."""
    R = RODZAJ[sk["rodzaj"]]
    X0, X1 = (sk["x0"] * TW - ox) / PX, ((sk["x1"] + 1) * TW - ox) / PX
    YF, YB = (oy - (sk["y1"] + 1) * TW) / PX, (oy - sk["y0"] * TW) / PX
    hs = R["sciana"]
    kat = math.radians(R["kat"])
    fund = 1.2
    gr = 1.1
    otwarta = sk["rodzaj"] == "wiata"
    # fundament z kamieni (pod belkami/deskami)
    skrzynka(s, Vector(((X0 + X1) / 2, (YF + YB) / 2, fund / 2)), X1 - X0 + 0.6, YB - YF + 0.6, fund,
             _mul(KAMIEN[0], 0.85), KAMIEN[1])
    z0 = fund
    # ── ściany ──
    if sk["bale"]:
        for a, b in ((Vector((X0, YF, 0)), Vector((X1, YF, 0))), (Vector((X0, YB, 0)), Vector((X1, YB, 0))),
                     (Vector((X0, YF, 0)), Vector((X0, YB, 0))), (Vector((X1, YF, 0)), Vector((X1, YB, 0)))):
            sciana_bale(s, rng, a, b, z0, hs, gr, 0.9)
    else:
        sciany = [(Vector((X0, YB, 0)), Vector((X1, YB, 0))), (Vector((X0, YF, 0)), Vector((X0, YB, 0))),
                  (Vector((X1, YF, 0)), Vector((X1, YB, 0)))]
        if not otwarta:
            sciany.append((Vector((X0, YF, 0)), Vector((X1, YF, 0))))
        for a, b in sciany:
            sciana_deski(s, rng, a, b, z0, hs, gr)
        for x in (X0, X1):      # słupy narożne
            for y in (YF, YB):
                skrzynka(s, Vector((x, y, hs / 2)), 1.4, 1.4, hs, DESKA_C)
        skrzynka(s, Vector(((X0 + X1) / 2, YF, hs - 0.5)), X1 - X0 + 1.4, 1.4, 1.0, DESKA_C)   # oczep
    if otwarta:   # słupy frontu wiaty co ~2 kafle
        n = max(2, round((X1 - X0) / (2 * TW / PX)))
        for i in range(n + 1):
            skrzynka(s, Vector((X0 + (X1 - X0) * i / n, YF, hs / 2)), 1.2, 1.2, hs, DESKA_C, DESKA[1])
    # ── dach ──
    nad = 2.6       # okap
    nadsz = 1.8     # wysunięcie nad szczytem
    grd = 1.6       # grubość strzechy
    if sk["kalenica"] == "Y":
        pol = (X1 - X0) / 2
        xm = (X0 + X1) / 2
        hk = hs + pol * math.tan(kat)
        dz = nad * math.tan(kat)
        for strona in (-1, 1):
            xe = xm + strona * (pol + nad)
            eave_f, eave_b = Vector((xe, YF - nadsz, hs - dz)), Vector((xe, YB + nadsz, hs - dz))
            kal_f, kal_b = Vector((xm, YF - nadsz, hk + 0.3)), Vector((xm, YB + nadsz, hk + 0.3))
            strzecha(s, rng, eave_f, eave_b, kal_f, kal_b, grd)
        skrzynka(s, Vector((xm, (YF + YB) / 2, hk + 0.5)), 1.6, YB - YF + 2 * nadsz, 1.2,
                 _mul(STRZECHA[0], 0.8), _mul(STRZECHA[1], 0.85))     # kalenica
        # szczyty (front i tył): deski w trójkącie
        szczyt = lambda t: hs + (pol - abs(t * 2 * pol - pol)) * math.tan(kat)   # noqa: E731
        for y in (YF, YB):
            sciana_deski(s, rng, Vector((X0, y, 0)), Vector((X1, y, 0)), hs, hs, 0.8, gora=szczyt)
        if sk["okno_szczyt"]:
            skrzynka(s, Vector((xm, YF - 0.5, hs + pol * math.tan(kat) * 0.35)), 2.0, 0.4, 2.0, OKNO)
            skrzynka(s, Vector((xm, YF - 0.45, hs + pol * math.tan(kat) * 0.35)), 2.8, 0.3, 2.8, DESKA_C)
        if sk["otwor"]:
            skrzynka(s, Vector((xm, YF - 0.5, hs + pol * math.tan(kat) * 0.4)), 3.2, 0.4, 3.0, (34, 26, 20))
    else:
        pol = (YB - YF) / 2
        ym = (YF + YB) / 2
        hk = hs + pol * math.tan(kat)
        dz = nad * math.tan(kat)
        for strona in (-1, 1):
            ye = ym + strona * (pol + nad)
            eave_l, eave_r = Vector((X0 - nadsz, ye, hs - dz)), Vector((X1 + nadsz, ye, hs - dz))
            kal_l, kal_r = Vector((X0 - nadsz, ym, hk + 0.3)), Vector((X1 + nadsz, ym, hk + 0.3))
            strzecha(s, rng, eave_l, eave_r, kal_l, kal_r, grd)
        skrzynka(s, Vector(((X0 + X1) / 2, ym, hk + 0.5)), X1 - X0 + 2 * nadsz, 1.6, 1.2,
                 _mul(STRZECHA[0], 0.8), _mul(STRZECHA[1], 0.85))
        szczyt = lambda t: hs + (pol - abs(t * 2 * pol - pol)) * math.tan(kat)   # noqa: E731
        for x in (X0, X1):
            sciana_deski(s, rng, Vector((x, YF, 0)), Vector((x, YB, 0)), hs, hs, 0.8, gora=szczyt)
    # ── komin: kamienny, przy kalenicy, nad kolumną z mapy ──
    # ⚠ Komin daleko od kalenicy, ciemny, wychodził z niskiej części połaci jako
    #   długi ciemny pas — czytał się jak szczelina w dachu. Dziś przy kalenicy
    #   (kolumna z mapy przyciągnięta do 30% połowy szerokości), jasny kamień, czapka.
    for kx in sk["komin"][:1]:
        x = ((kx + 0.5) * TW - ox) / PX
        if sk["kalenica"] == "Y":
            xm = (X0 + X1) / 2
            x = xm + max(-0.3, min(0.3, (x - xm) / ((X1 - X0) / 2))) * (X1 - X0) / 2
            y = YF + (YB - YF) * 0.55
        else:
            y = (YF + YB) / 2 + (YB - YF) * 0.12
        top = hk + 3.0
        skrzynka(s, Vector((x, y, top / 2 + 2)), 2.6, 2.6, top - 4, KAMIEN[0], _mul(KAMIEN[1], 1.1))
        skrzynka(s, Vector((x, y, top - 0.3)), 3.2, 3.2, 0.6, _mul(KAMIEN[1], 1.05))          # czapka
        skrzynka(s, Vector((x, y, top + 0.02)), 1.5, 1.5, 0.06, (30, 26, 24))
    # ── drzwi, wrota, okna (na froncie) ──
    yfr = YF - gr / 2 - 0.15
    for kx, szer, typ in sk["drzwi"]:
        x = ((kx + szer / 2) * TW - ox) / PX
        w = szer * TW / PX * 0.82
        h = 16.0 if typ == "wrota" else 11.5
        h = min(h, hs - 0.8)
        skrzynka(s, Vector((x, yfr + 0.1, fund + h / 2)), w + 1.2, 0.5, h + 0.6, DESKA_C)      # ościeżnica
        skrzynka(s, Vector((x, yfr - 0.15, fund + h / 2)), w, 0.5, h, DRZWI, _mul(DRZWI, 1.1))
        if typ == "wrota":
            skrzynka(s, Vector((x, yfr - 0.45, fund + h / 2)), 0.3, 0.3, h, _mul(DRZWI, 0.7))
            for zz in (0.25, 0.75):   # okucia/belki poprzeczne
                skrzynka(s, Vector((x, yfr - 0.45, fund + h * zz)), w * 0.96, 0.3, 0.6, _mul(DRZWI, 0.75))
        elif typ == "drzwi_pol":
            skrzynka(s, Vector((x, yfr - 0.45, fund + h * 0.5)), w, 0.3, 0.4, _mul(DRZWI, 0.7))
        skrzynka(s, Vector((x, yfr - 1.0, 0.35)), w + 0.6, 1.6, 0.7, KAMIEN[1])                 # próg
    for kx in sk["okna"]:
        x = ((kx + 0.5) * TW - ox) / PX
        zc = fund + hs * 0.52
        skrzynka(s, Vector((x, yfr, zc)), 3.2, 0.5, 2.8, OKNO)
        skrzynka(s, Vector((x, yfr - 0.25, zc)), 0.25, 0.3, 2.8, DESKA_C)                      # szpros
        for kk in (-1, 1):                                                                      # okiennice
            skrzynka(s, Vector((x + kk * 2.3, yfr - 0.2, zc)), 1.3, 0.3, 3.0, _mul(DESKA[1], 0.9))
        skrzynka(s, Vector((x, yfr - 0.3, zc - 1.7)), 3.8, 0.8, 0.35, DESKA_C)                  # parapet
    for kx in sk["klapa"]:
        x = ((kx + 0.5) * TW - ox) / PX
        skrzynka(s, Vector((x, yfr - 0.1, fund + 1.6)), 2.2, 0.4, 2.6, (40, 30, 22))
        czworokat(s, (Vector((x - 0.9, yfr - 0.3, fund + 0.4)), Vector((x + 0.9, yfr - 0.3, fund + 0.4)),
                      Vector((x + 0.9, yfr - 4.0, 0.1)), Vector((x - 0.9, yfr - 4.0, 0.1))),
                  DESKA[1], Vector((x, yfr, -10)))                                               # trap dla kur
    return hk


def budynek(sk, rng):
    """Siatka jednego obiektu; punkt odniesienia: środek krawędzi FRONTU."""
    s = Siatka()
    s.bez_wyrownania = True
    ox = (sk["x1"] + 1) / 2 * TW
    oy = (sk["y1"] + 1) * TW
    if sk["rodzaj"] in OGRODZENIA:
        return s, ogrodzenie(s, rng, sk, ox, oy)
    wys = skrzydlo(s, rng, sk, ox, oy)
    if sk["rodzaj"] == "karczma":
        # wiecha: tyczka wysunięta skośnie z narożnika frontu, na końcu wiązka zieleni
        X0 = (sk["x0"] * TW - ox) / PX
        YF = (oy - (sk["y1"] + 1) * TW) / PX
        a = Vector((X0 + 1.0, YF - 0.8, RODZAJ["karczma"]["sciana"] * 0.85))
        b = a + Vector((-3.5, -5.5, 2.0))
        skrzynka_wzdluz(s, a, b, 0.55, DESKA_C, DESKA[0])
        for dx, dy, dz, r in ((0, 0, 0, 1.5), (0.8, -0.4, -0.9, 1.1), (-0.7, 0.3, -1.1, 1.0), (0.1, -0.2, -2.0, 0.8)):
            kulka(s, b + Vector((dx, dy, dz)), r, (64, 102, 44), (110, 150, 70))
    return s, wys


def kolo(s, c, r, gr, szprychy, kol, kol_j):
    """Koło wozu w płaszczyźnie XZ (oś w Y): obręcz z odcinków, piasta, szprychy."""
    n = 14
    pkt = [c + Vector((math.cos(math.tau * i / n) * r, 0, math.sin(math.tau * i / n) * r)) for i in range(n)]
    for a, b in zip(pkt, pkt[1:] + pkt[:1]):
        skrzynka_wzdluz(s, a, b, gr, kol, kol_j)
    skrzynka(s, c, r * 0.32, gr * 2.2, r * 0.32, kol, kol_j)
    for i in range(szprychy):
        a = math.tau * (i + 0.5) / szprychy
        skrzynka_wzdluz(s, c, c + Vector((math.cos(a), 0, math.sin(a))) * r * 0.95, gr * 0.55, kol, kol_j)


def sprzet(s, rng, rodzaj, X0, X1, YF, YB):
    """Sprzęt zagród (K5). Model w lokalnych osiach obiektu: X wzdłuż frontu, −Y = front."""
    dl, gl = X1 - X0, YB - YF
    xc, yc = (X0 + X1) / 2, (YF + YB) / 2
    if rodzaj == "woz":
        # drabiniak: skrzynia od tyłu (−X), dyszel do przodu (+X)
        rt, rp = 3.3, 2.7                                 # promień kół: tylne / przednie
        xs0, xs1 = X0 + 0.4, X0 + dl * 0.74              # skrzynia
        xt, xp = xs0 + rt + 0.4, xs1 - rp - 0.2          # osie
        zd = rt + 0.9                                     # podłoga skrzyni
        sz = gl * 0.40                                    # pół-rozstaw kół
        for x, r in ((xt, rt), (xp, rp)):
            for y in (yc - sz, yc + sz):
                kolo(s, Vector((x, y, r)), r, 0.42, 6, _mul(BAL[0], 0.8), BAL[1])
            skrzynka(s, Vector((x, yc, r)), 0.7, sz * 2 + 0.8, 0.7, _mul(BAL[0], 0.7), BAL[0])     # oś
            skrzynka(s, Vector((x, yc, (r + zd) / 2)), 0.9, sz * 1.2, zd - r, BAL[0], BAL[1])   # podsada
        szs = sz * 0.80                                   # pół-szerokość skrzyni
        n = max(4, round((xs1 - xs0) / 1.1))
        for i in range(n):                                # podłoga z desek w poprzek
            x = xs0 + (xs1 - xs0) * (i + 0.5) / n
            kol = _mul(_mix(*DESKA, rng.uniform(0.2, 0.9)), rng.uniform(0.92, 1.05))
            skrzynka(s, Vector((x, yc, zd)), (xs1 - xs0) / n * 0.92, szs * 2, 0.4, kol, _mul(kol, 1.1))
        for strona in (-1, 1):                            # drabiny: rozchylone na boki
            y0, y1 = yc + strona * szs, yc + strona * (szs + 1.4)
            a0, a1 = Vector((xs0, y0, zd + 0.2)), Vector((xs1, y0, zd + 0.2))
            b0, b1 = Vector((xs0, y1, zd + 4.2)), Vector((xs1, y1, zd + 4.2))
            skrzynka_wzdluz(s, a0, a1, 0.45, BAL[0], BAL[1])
            skrzynka_wzdluz(s, b0, b1, 0.45, BAL[0], BAL[1])
            k = max(5, round((xs1 - xs0) / 1.4))
            for i in range(k + 1):
                t = i / k
                skrzynka_wzdluz(s, a0.lerp(a1, t), b0.lerp(b1, t), 0.28, DESKA[1], DESKA[0])
        for x in (xs0, xs1):                              # deski czołowe
            skrzynka(s, Vector((x, yc, zd + 1.3)), 0.35, szs * 2, 2.4, DESKA[0], DESKA[1])
        # dyszel z orczykiem, oparty o ziemię
        skrzynka_wzdluz(s, Vector((xp, yc, rp)), Vector((X1 - 0.3, yc, 0.4)), 0.6, BAL[0], BAL[1])
        skrzynka_wzdluz(s, Vector((X1 - 1.2, yc - 1.8, 0.5)), Vector((X1 - 1.2, yc + 1.8, 0.5)), 0.4, BAL[0], BAL[1])
        for _ in range(3):                                # resztki siana na dnie
            kulka(s, Vector((rng.uniform(xs0 + 1, xs1 - 1), yc + rng.uniform(-1, 1), zd + 0.6)),
                  rng.uniform(0.9, 1.3), (180, 150, 80), (222, 192, 112))
        return zd + 4.6
    if rodzaj == "stragan":
        # stół z desek, cztery słupki, daszek z płótna w pasy pochylony ku frontowi; towar Anny:
        # bochny, kręgi sera, kosze — sprzedaje pod karczmą (`ANNA`, K1)
        zs, ht = 5.2, 14.0
        sw, sg = dl * 0.86, gl * 0.62
        skrzynka(s, Vector((xc, yc, zs)), sw, sg, 0.5, DESKA[0], _mul(DESKA[1], 1.05))
        skrzynka(s, Vector((xc, yc - sg / 2 + 0.2, zs - 1.2)), sw, 0.3, 2.0, DESKA[0], DESKA[0])   # blenda
        for x in (xc - sw / 2 + 0.3, xc + sw / 2 - 0.3):
            for y, h in ((yc - sg / 2 - 0.4, ht - 1.4), (yc + sg / 2 + 0.2, ht)):
                skrzynka(s, Vector((x, y, h / 2)), 0.55, 0.55, h, BAL[0], BAL[1])
        plotno, pas = (226, 214, 186), (168, 64, 48)
        n = 6
        for i in range(n):
            xa = xc - sw / 2 - 0.6 + (sw + 1.2) * i / n
            xb = xc - sw / 2 - 0.6 + (sw + 1.2) * (i + 1) / n
            kol = pas if i % 2 else plotno
            pk = (Vector((xa, yc - sg / 2 - 1.6, ht - 1.9)), Vector((xb, yc - sg / 2 - 1.6, ht - 1.9)),
                  Vector((xb, yc + sg / 2 + 0.6, ht + 0.4)), Vector((xa, yc + sg / 2 + 0.6, ht + 0.4)))
            czworokat(s, pk, kol, Vector((xc, yc, -50)))
            czworokat(s, pk, _mul(kol, 0.7), Vector((xc, yc, 100)))
            skrzynka(s, Vector(((xa + xb) / 2, yc - sg / 2 - 1.6, ht - 2.4)), xb - xa, 0.12, 1.0, kol, kol)   # falbana
        for i in range(4):                                # bochny
            kulka(s, Vector((xc - sw * 0.34 + i * 1.5, yc - 0.6 + rng.uniform(-0.3, 0.3), zs + 0.9)), 0.9,
                  (150, 96, 50), (196, 140, 80))
        for i in range(2):                                # kręgi sera
            skrzynka(s, Vector((xc + sw * 0.08 + i * 2.0, yc - 0.4, zs + 0.75)), 1.5, 1.5, 1.0, (210, 176, 84), (238, 210, 120))
        for i, x in enumerate((xc + sw * 0.32, xc - sw * 0.1)):   # kosze z jajami / jabłkami
            skrzynka(s, Vector((x, yc + 0.7, zs + 0.9)), 1.9, 1.6, 1.3, (138, 108, 62), (170, 136, 84))
            for _ in range(4):
                kulka(s, Vector((x + rng.uniform(-0.5, 0.5), yc + 0.7 + rng.uniform(-0.4, 0.4), zs + 1.6)), 0.38,
                      (232, 222, 196) if i == 0 else (186, 52, 40))
        for x in (xc - sw / 2 - 1.2, xc + sw / 2 + 1.1):  # kosze na ziemi przy bokach
            skrzynka(s, Vector((x, yc - 0.6, 1.1)), 1.8, 1.8, 2.2, (128, 98, 56), (162, 128, 78))
        return ht + 0.6
    if rodzaj == "kozel":
        # kozioł do piłowania (dwa krzyżaki X) z grubą kłodą i piłą; obok trociny.
        # ⚠ Pierwsza wersja (nogi 4,6 j., kłoda r 1,0) czytała się z kamery jak ławeczka z patykiem.
        for x in (xc - dl * 0.28, xc + dl * 0.28):
            for z0 in (-1, 1):
                skrzynka_wzdluz(s, Vector((x, yc - 2.2 * z0, 0.3)), Vector((x, yc + 1.6 * z0, 6.6)), 0.7, BAL[0], BAL[1])
        skrzynka_wzdluz(s, Vector((xc - dl * 0.28, yc, 2.8)), Vector((xc + dl * 0.28, yc, 2.8)), 0.6, BAL[0], BAL[1])
        kloda(s, rng, Vector((X0 - 0.6, yc, 7.2)), Vector((X1 + 0.6, yc, 7.2)), 1.7, (104, 80, 56))
        p = Vector((xc + 1.2, yc - 0.6, 8.0))                      # piła ramowa wbita w kłodę
        skrzynka_wzdluz(s, p, p + Vector((0, -0.3, 3.6)), 0.25, (150, 150, 156), (200, 200, 206))
        skrzynka_wzdluz(s, p + Vector((-1.8, -0.3, 3.6)), p + Vector((1.8, -0.3, 3.6)), 0.35, BAL[0], BAL[1])
        for _ in range(7):
            kulka(s, Vector((xc + rng.uniform(-2.0, 2.0), yc + rng.uniform(-2.6, 0.5), 0.6)), rng.uniform(0.5, 0.7),
                  (196, 164, 112), (222, 196, 140))
        return 11.6
    if rodzaj == "pranie":
        # dwa słupki z widełkami, sznur z lekkim zwisem, płótna lniane: koszule, płachta, zapaska
        hz = 10.6
        for x in (X0 + 0.5, X1 - 0.5):
            skrzynka(s, Vector((x, yc, hz / 2)), 0.6, 0.6, hz, BAL[0], BAL[1])
            for k in (-1, 1):
                skrzynka_wzdluz(s, Vector((x, yc, hz - 0.4)), Vector((x + 0.5 * k, yc, hz + 0.8)), 0.3, BAL[0], BAL[1])
        zwis = lambda t: hz - 1.1 * math.sin(math.pi * t)
        pkt = [Vector((X0 + 0.5 + (dl - 1.0) * k / 8, yc, zwis(k / 8))) for k in range(9)]
        for a, b in zip(pkt, pkt[1:]):
            skrzynka_wzdluz(s, a, b, 0.14, (120, 104, 78), (150, 132, 100))
        LEN = [(224, 216, 196), (206, 198, 178), (232, 226, 210)]
        szt = [(2.4, 4.2, LEN[0]), (3.6, 3.0, LEN[1]), (1.8, 3.4, (150, 62, 46)), (2.6, 4.0, LEN[2]), (1.6, 2.2, LEN[1])]
        x = X0 + 1.6
        for szer, wys, kol in szt:
            if x + szer > X1 - 1.2:
                break
            t = (x + szer / 2 - X0 - 0.5) / max(dl - 1.0, 1e-6)
            z = zwis(t) - 0.15
            kol = _mul(kol, rng.uniform(0.94, 1.04))
            skrzynka(s, Vector((x + szer / 2, yc + rng.uniform(-0.15, 0.15), z - wys / 2)), szer, 0.18, wys, kol, _mul(kol, 1.06))
            x += szer + rng.uniform(0.5, 1.0)
        skrzynka(s, Vector((X0 + 1.8, yc + 1.8, 0.9)), 2.2, 1.8, 1.8, (132, 102, 60), (166, 132, 82))   # kosz na pranie
        return hz + 0.8
    if rodzaj == "gnojownik":
        # ⚠ KOPIEC, nie skrzynia (autor 2026-10-11: „gnojowisko to taki stóg siano-gówna za oborą,
        # a nie na podwórku"). Obornik przekładany słomą, usypany w pryzmę: warstwy kul zwężające się
        # ku górze, jasne pasma słomy między warstwami, widły wbite w wierzch. Bez desek.
        OBORNIK = ((64, 48, 34), (92, 70, 48))
        SLOMA = ((176, 148, 84), (214, 188, 116))
        H = 7.6
        warstwy = 5
        for k in range(warstwy):
            t = k / (warstwy - 1)                          # 0 dół … 1 wierzch
            sx, sy = dl * (0.48 - 0.30 * t), gl * (0.46 - 0.28 * t)
            z = 0.9 + (H - 2.2) * t
            n = max(4, round((sx * sy) / 1.6))
            for _ in range(n):
                px, py = xc + rng.uniform(-sx, sx), yc + rng.uniform(-sy, sy)
                r = rng.uniform(1.1, 1.7) * (1.0 - 0.35 * t)
                kol = SLOMA if (k % 2 == 1 and rng.random() < 0.35) else OBORNIK
                kulka(s, Vector((px, py, max(z, r * 0.72))), r, *kol)
        for _ in range(round(dl * gl / 3.0)):              # źdźbła słomy sterczące z boków
            a = rng.uniform(0, math.tau); t = rng.uniform(0.1, 0.8)
            c = Vector((xc + math.cos(a) * dl * (0.45 - 0.3 * t), yc + math.sin(a) * gl * (0.43 - 0.28 * t), 0.9 + (H - 2.2) * t))
            skrzynka_wzdluz(s, c, c + Vector((math.cos(a) * 1.1, math.sin(a) * 1.1, rng.uniform(-0.2, 0.4))), 0.16, *SLOMA)
        p = Vector((xc + dl * 0.06, yc, H - 0.8))          # widły wbite w wierzch
        skrzynka_wzdluz(s, p, p + Vector((0.8, -0.9, 6.0)), 0.3, BAL[0], BAL[1])
        for k in (-0.35, 0.0, 0.35):
            skrzynka_wzdluz(s, p + Vector((k, 0, 0)), p + Vector((k, 0, -1.4)), 0.12, (120, 120, 126), (170, 170, 176))
        return H + 5.0
    # snopki lnu: rząd kozłów (snopki oparte o siebie w stożek) do suszenia po moczeniu
    n = max(2, round(dl / 6.0))                           # ~1 kozioł na kafel — gęściej zlewały się w płot
    for i in range(n):
        c = Vector((X0 + dl * (i + 0.5) / n, yc + rng.uniform(-0.6, 0.6), 0))
        for k in range(6):
            a = math.tau * k / 6 + rng.uniform(-0.2, 0.2)
            stopa = c + Vector((math.cos(a) * 2.0, math.sin(a) * 2.0, 0))
            skrzynka_wzdluz(s, stopa, c + Vector((0, 0, 7.4)), 0.8, (150, 128, 78), (198, 176, 112))
        kulka(s, c + Vector((0, 0, 7.4)), 0.6, (170, 148, 92), (206, 186, 124))
    return 8.0


def ogrodzenie(s, rng, sk, ox, oy):
    """Palisada: rząd zaostrzonych pali w osi prostokąta + belka od wewnątrz
    (tył, +Y). Brama: dwa słupy na skrajach prostokąta, nadproże i daszek."""
    X0, X1 = (sk["x0"] * TW - ox) / PX, ((sk["x1"] + 1) * TW - ox) / PX
    YF, YB = (oy - (sk["y1"] + 1) * TW) / PX, (oy - sk["y0"] * TW) / PX
    yc = (YF + YB) / 2
    H = OGRODZENIA[sk["rodzaj"]]["wys"]
    if sk["rodzaj"] == "plot":
        # narożnik: koniec cofnięty do środka kafla narożnego (`skroc_l` / `skroc_p`)
        X0 += sk.get("skroc", (0, 0))[0] * TW / PX
        X1 -= sk.get("skroc", (0, 0))[1] * TW / PX
        # pale co ~1,6 j., między nimi plecionka: poziome pasy wikliny,
        # naprzemiennie wysunięte przed/za pale (splot), lekko nierówne.
        n = max(2, round((X1 - X0) / 3.2))
        for i in range(n + 1):
            x = X0 + (X1 - X0) * i / n
            h = H * rng.uniform(1.02, 1.14)
            skrzynka(s, Vector((x, yc, h / 2)), 0.7, 0.7, h, _mul(BAL[0], 0.9), BAL[1])
        # plecionka: pasy wikliny na całą długość, naprzemiennie przed/za palami
        # (jeden prostopadłościan na pas — przy 50 odcinkach we wsi liczy się budżet)
        pasy = 6
        for j in range(pasy):
            z = 0.6 + (H - 0.9) * (j + 0.5) / pasy
            kol = _mul(_mix(*WIKLINA, rng.uniform(0.2, 0.9)), rng.uniform(0.92, 1.06))
            skrzynka(s, Vector(((X0 + X1) / 2, yc + (0.3 if j % 2 else -0.3), z)),
                     X1 - X0 + 0.3, 0.45, (H - 0.9) / pasy * 0.85, kol, _mul(kol, 1.12))
        return H * 1.14
    if sk["rodzaj"] == "kladka":
        dl, gl = X1 - X0, YB - YF
        h0, luk, gr = 1.1, 1.2, 0.35                      # wysokość pomostu, łuk, grubość deski
        n = max(4, round(dl / 1.05))
        for i in range(n):                                # deski w poprzek, łukiem
            t = (i + 0.5) / n
            z = h0 + luk * math.sin(math.pi * t)
            kol = _mul(_mix(*DESKA, rng.uniform(0.2, 0.9)), rng.uniform(0.9, 1.06))
            skrzynka(s, Vector((X0 + dl * t, yc, z)), dl / n * 0.9, gl * 0.8, gr, kol, _mul(kol, 1.1))
        for x in (X0 + 0.5, X0 + dl / 2, X1 - 0.5):       # pale pod pomostem
            t = (x - X0) / dl
            z = h0 + luk * math.sin(math.pi * t)
            for y in (yc - gl * 0.33, yc + gl * 0.33):
                # od gruntu (bramka: nic pod z=0); woda jest płaszczyzną kafli na z=0
                skrzynka(s, Vector((x, y, z / 2)), 0.6, 0.6, z, _mul(BAL[0], 0.85), BAL[1])
        for y in (yc - gl * 0.38, yc + gl * 0.38):        # poręcze: słupki + łamana belka po łuku
            pkt = []
            for k in range(5):
                t = k / 4
                x = X0 + 0.4 + (dl - 0.8) * t
                z = h0 + luk * math.sin(math.pi * (x - X0) / dl)
                skrzynka(s, Vector((x, y, z + 1.3)), 0.4, 0.4, 2.6, BAL[0], BAL[1])
                pkt.append(Vector((x, y, z + 2.5)))
            for a, b in zip(pkt, pkt[1:]):
                skrzynka_wzdluz(s, a, b, 0.35, DESKA[1], DESKA[0])
        return h0 + luk + 2.6
    if sk["rodzaj"] in ("woz", "stragan", "kozel", "snopki", "pranie", "gnojownik"):
        return sprzet(s, rng, sk["rodzaj"], X0, X1, YF, YB)
    if sk["rodzaj"] == "zerdzie":
        # słupki co ~2 kafle, dwie żerdzie wzdłuż (ta sama rodzina co `plot` z kafli)
        n = max(1, round((X1 - X0) / (2 * TW / PX)))
        for i in range(n + 1):
            x = X0 + (X1 - X0) * i / n
            skrzynka(s, Vector((x, yc, H / 2)), 0.9, 0.9, H, _mul(BAL[0], 0.9), BAL[1])
        for z in (H * 0.45, H * 0.85):
            skrzynka(s, Vector(((X0 + X1) / 2, yc + 0.5, z)), X1 - X0 + 0.6, 0.55, 0.6,
                     _mul(DESKA[1], 0.95), DESKA[1])
        return H
    if sk["rodzaj"] == "wrota":
        # dwa słupy na skrajach otworu, skrzydła z żerdzi uchylone do środka (+Y)
        for x in (X0 + 0.5, X1 - 0.5):
            skrzynka(s, Vector((x, yc, H / 2)), 1.1, 1.1, H, BAL[0], BAL[1])
        dl = (X1 - X0) / 2 - 0.8
        for strona in (-1, 1):
            zawias = Vector((X0 + 0.9 if strona < 0 else X1 - 0.9, yc, 0))
            kier = Vector((-strona * math.cos(math.radians(70)), math.sin(math.radians(70)), 0))
            for z in (H * 0.3, H * 0.62, H * 0.9):
                a = zawias + Vector((0, 0, z))
                skrzynka_wzdluz(s, a, a + kier * dl, 0.5, DESKA[1], DESKA[0])
            # ⚠ pionowe listwy przy zawiasie i na WOLNYM końcu (2026-10-11, zrzut autora
            # „furtka w powietrzu"): bez nich z kamery 40° skrzydło to trzy deski
            # i zastrzał zawieszone nad trawą — rama dopiero czyta się jako furtka.
            for t in (0.0, 1.0):
                p = zawias + kier * dl * t
                skrzynka(s, Vector((p.x, p.y, H * 0.55)), 0.6, 0.6, H * 0.8, DESKA[0], DESKA[1])
            skrzynka_wzdluz(s, zawias + Vector((0, 0, H * 0.3)) + kier * dl,
                            zawias + Vector((0, 0, H * 0.9)) + kier * dl * 0.2, 0.45, DESKA[0], DESKA[0])
        return H
    if sk["rodzaj"] == "palisada":
        n = max(2, round((X1 - X0) / 1.9))
        for i in range(n):
            x = X0 + (X1 - X0) * (i + 0.5) / n
            h = H * rng.uniform(0.9, 1.06)
            kol = _mul(_mix(*BAL, rng.uniform(0.15, 0.85)), rng.uniform(0.9, 1.05))
            skrzynka(s, Vector((x, yc, h / 2)), 1.75, 1.75, h, kol, _mul(kol, 1.08))
            # ostrze: czworoboczny szpic
            c = Vector((x, yc, h))
            szczyt = c + Vector((0, 0, 1.9))
            rog = [c + Vector((dx, dy, 0)) for dx, dy in ((-0.875, -0.875), (0.875, -0.875), (0.875, 0.875), (-0.875, 0.875))]
            for j in range(4):
                czworokat(s, (rog[j], rog[(j + 1) % 4], szczyt, szczyt), _mul(kol, 1.15 if j == 0 else 0.95), c - Vector((0, 0, 1)))
        for z in (H * 0.25, H * 0.7):    # belki spinające od wewnątrz
            skrzynka(s, Vector(((X0 + X1) / 2, yc + 1.2, z)), X1 - X0, 0.8, 0.9, DESKA_C, DESKA[0])
        return H + 1.9
    # brama: słupy przy krawędziach otworu, nadproże, daszek dwuspadowy
    for x in (X0 + 0.9, X1 - 0.9):
        skrzynka(s, Vector((x, yc, H / 2)), 1.9, 1.9, H, BAL[0], BAL[1])
    skrzynka(s, Vector(((X0 + X1) / 2, yc, H - 1.0)), X1 - X0 + 1.0, 1.6, 1.4, DESKA_C, DESKA[1])
    for kz in (-1, 1):
        a = Vector((X0 - 0.8, yc + kz * 2.2, H - 0.3))
        b = Vector((X1 + 0.8, yc + kz * 2.2, H - 0.3))
        c = Vector((X1 + 0.8, yc, H + 2.6))
        d = Vector((X0 - 0.8, yc, H + 2.6))
        czworokat(s, (a, b, c, d), _mix(*STRZECHA, 0.55 if kz < 0 else 0.35), Vector((0, yc, H - 10)))
        czworokat(s, (a, b, c, d), _mul(STRZECHA[0], 0.6), Vector((0, yc + kz * 10, H + 10)))
    return H + 2.6


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    mat = material()
    bledy, obiekty, nazwy = [], [], set()
    print(f"{'model':18} {'typ / dach / obrót':30} {'front×głęb.':>11} {'wys j':>6} {'trójk.':>6}")
    for plik in MAPY:
        prefiks, lista, bl = wczytaj_budynki(plik)
        bledy += bl
        if lista and not prefiks:
            bledy.append(f"{plik}: warstwa `budynki` bez właściwości mapy `prefiks3d`")
        for i, sk in enumerate(lista):
            if sk["nazwa"] in nazwy:
                bledy.append(f"{sk['nazwa']}: zdublowana nazwa modelu")
            nazwy.add(sk["nazwa"])
            s, wys = budynek(sk, random.Random(9000 + i * 31 + len(plik)))
            tr = s.trojkaty()
            opis = f"{sk['rodzaj']}/{'szczyt' if sk['kalenica'] == 'Y' else 'kalenica'}/{sk['obrot']}°"
            print(f"{sk['nazwa']:18} {opis:30} {sk['x1'] + 1:>4}×{sk['y1'] + 1:<6} {wys:6.1f} {tr:6d}")
            if tr > MAX_TROJKATOW:
                bledy.append(f"{sk['nazwa']}: {tr} trójkątów > budżet {MAX_TROJKATOW}")
            if min(p.z for p in s.v) < -0.6:
                bledy.append(f"{sk['nazwa']}: schodzi pod grunt")
            obiekty.append(do_blendera(sk["nazwa"], s, mat))
    for b in bledy:
        print("BŁĄD", b)
    print(f"budynków: {len(obiekty)} · bramka:", "CZERWONA" if bledy else "zielona")
    if ZAPISZ:
        if bledy:
            raise SystemExit("[zapis] ODMOWA — bramka czerwona")
        for o in bpy.context.scene.objects:
            o.select_set(o in obiekty)
        bpy.ops.export_scene.gltf(
            filepath=CEL, export_format="GLB", use_selection=True, export_yup=True,
            export_animations=False, export_skins=False, export_morph=False,
            export_vertex_color="ACTIVE", export_all_vertex_colors=False, export_apply=False,
            export_meshopt_compression_enable=True)
        print(f"[zapis] {CEL} {os.path.getsize(CEL)} bajtów")
    else:
        print("[przymiar] NIC nie zapisano. Zapis: -- --zapisz")


if __name__ == "__main__":
    main()
