"""WŁOSY, ZAROST I BRWI jako BRYŁY nad głową bazy (2026-10-09, pilot NPC: Ojciec).

Moduł BLENDEROWY — importowany przez `tools/npc3d.py`, nie uruchamiany sam.

⭐ Kierunek: `docs/kreator_postaci.md` — fryzura i zarost to OSOBNE siatki,
przełączane jak element ekwipunku, z katalogu stylów (`FRYZURY`, `ZAROSTY`).
Nowy styl = wpis w katalogu (opis kształtu), nie nowy kod. Ta sama droga
posłuży kreatorowi gracza i presetom mieszkańców.

⭐ Geometria leży na PROFILU GŁOWY z `char3d_base` (`PROFIL_GLOWY`,
`PROPORCJE`) — punkt powierzchni czaszki dla (t, φ) i mnożnika promienia.
t = 0 broda, 1 czubek; φ = 0 tył (+Y), π przód (−Y), φ > π lewa połowa (x < 0).
Dzięki temu włosy idą za zmianą proporcji głowy (inna sylwetka = ta sama
fryzura pasuje bez poprawek).

⭐ Reguła czytelności (60 px postaci, głowa ~30 px przy kamerze ×0,8):
liczy się SYLWETKA czupryny i PLAMA koloru brody/brwi, nie pasma. Każda
powłoka ma GRUBOŚĆ (zewnętrzna + wewnętrzna warstwa zszyte na brzegu), żeby
brzeg włosów był widocznym progiem, a nie malunkiem na skórze.

⚠ Obiekty wiszą na KOŚCI głowy (`Bone.004`, `parent_type='BONE'`), dokładnie
jak sama głowa — budowane w pozie SPOCZYNKOWEJ, przeliczane do lokalnych.
"""
import math

import bpy
from mathutils import Matrix, Vector

import char3d_base as baza
from char3d_zones import _lin, _ustaw_kolor

PRZEDROSTEK = "Wlosy_"


def _glowa_geom(P):
    H = baza.WYSOKOSC
    wys = H / P["glow"]
    broda = baza.PODLOGA + H * (1.0 + P["glowa_uniesienie"]) - wys
    pw = wys * P["glowa_szerokosc"] / 2.0
    pg = wys * P["glowa_glebokosc"] / 2.0
    return wys, broda, pw, pg


def punkt(P, t, fi, skala, dz=0.0):
    """Punkt na powierzchni czaszki (bez nosa/brwi bazy), promień × `skala`."""
    wys, broda, pw, pg = _glowa_geom(P)
    tt = min(1.0, max(0.0, t))
    fw = baza._profil([(a, x) for a, x, _, _ in baza.PROFIL_GLOWY], tt)
    fg = baza._profil([(a, y) for a, _, y, _ in baza.PROFIL_GLOWY], tt)
    fy = baza._profil([(a, y) for a, _, _, y in baza.PROFIL_GLOWY], tt)
    # t < 0 (broda pod podbródkiem) / t > 1: przedłużenie w pionie
    z = broda + t * wys + dz * wys
    return Vector((pw * fw * skala * math.sin(fi), fy * pg + pg * fg * skala * math.cos(fi), z))


def _plat(P, t_od, t_do, fi_od, fi_do, gr_zew, gr_wew, n_fi=20, n_t=8, profil_grubosci=None,
          zamknij_krag=False, dz=None, czubek=None, odcien=None):
    """Płat powłoki: siatka (t × φ), warstwa zewnętrzna i wewnętrzna zszyte na
    brzegu. `t_od` / `t_do` mogą być funkcjami φ (np. łysiejące skronie).
    `profil_grubosci(u, fi)` → mnożnik grubości (u = 0 dół płatu, 1 góra).
    `odcien(u, fi, zewn)` → mnożnik jasności wierzchołka (pasma, odrost).
    Zwraca (wierzchołki, wielokąty, odcienie)."""
    verts, faces, cien = [], [], []
    kol = n_fi if zamknij_krag else n_fi + 1

    def siatka(skala_bazowa, dodaj):
        start = len(verts)
        for j in range(n_t + 1):
            u = j / n_t
            for i in range(kol):
                fi = fi_od + (fi_do - fi_od) * i / n_fi
                a = t_od(fi) if callable(t_od) else t_od
                b = t_do(fi) if callable(t_do) else t_do
                t = a + (b - a) * u
                g = profil_grubosci(u, fi) if profil_grubosci else 1.0
                # ⚠ Grubość jako mnożnik PROMIENIA znika u szczytu (promień
                #   czaszki → 0), więc czupryna wychodziła płaska jak beret.
                #   Zewnętrzna warstwa dostaje też uniesienie rosnące ku górze.
                wznies = dodaj * g * max(0.0, (t - 0.55) / 0.45) ** 1.5 * 0.55 if dodaj > 0 else 0.0
                verts.append(punkt(P, t, fi, skala_bazowa + dodaj * g, (dz(u, fi) if dz else 0.0) + wznies))
                cien.append(odcien(u, fi, dodaj > 0) if odcien else 1.0)
        return start

    z0 = siatka(1.0, gr_zew)
    w0 = siatka(1.0, gr_wew)

    def idx(s, j, i):
        return s + j * kol + (i % kol)

    zakres = range(n_fi) if not zamknij_krag else range(n_fi)
    for j in range(n_t):
        for i in zakres:
            faces.append((idx(z0, j, i), idx(z0, j, i + 1), idx(z0, j + 1, i + 1), idx(z0, j + 1, i)))
            faces.append((idx(w0, j, i), idx(w0, j + 1, i), idx(w0, j + 1, i + 1), idx(w0, j, i + 1)))
    # brzegi: dolny (j=0) i górny (j=n_t) zszyte zewn. ↔ wewn.
    # Krąg zamknięty (czupryna) dostaje u góry CZUBEK zamiast szwu — inaczej
    # na szczycie głowy zostaje otwór o promieniu najwyższego pierścienia.
    brzegi = ((0, False),) if (zamknij_krag and czubek is not None) else ((0, False), (n_t, True))
    if zamknij_krag and czubek is not None:
        cz = len(verts)
        verts.append(czubek)
        cien.append(odcien(1.0, 0.0, True) if odcien else 1.0)
        for i in zakres:
            faces.append((idx(z0, n_t, i), idx(z0, n_t, i + 1), cz))
    for j, odwroc in brzegi:
        for i in zakres:
            f = (idx(z0, j, i), idx(w0, j, i), idx(w0, j, i + 1), idx(z0, j, i + 1))
            faces.append(f[::-1] if odwroc else f)
    if not zamknij_krag:
        for i, odwroc in ((0, True), (n_fi, False)):
            for j in range(n_t):
                f = (idx(z0, j, i), idx(z0, j + 1, i), idx(w0, j + 1, i), idx(w0, j, i))
                faces.append(f[::-1] if odwroc else f)
    return verts, faces, cien


# ── KATALOG STYLÓW (kształty — kolory daje preset) ───────────────────────────
#
# Fryzury (`docs/kreator_postaci.md` §5). Pilot ma jedną; kolejne dochodzą
# jako wpisy. `skronie` > 0 = cofnięta linia włosów nad czołem (wiek).

PASMA = 8          # pasm na połowę głowy (z kamery gry: żłobienia, nie kosmyki)


def _pasmo(u, fi):
    """0..1 — grzbiet pasma = 1. Na górze pasma biegną przód→tył (stała
    współrzędna boczna), na bokach skręcają do tyłu po skosie — zaczesanie."""
    lat = math.sin(fi)
    bok = abs(lat)
    s = lat * (1.0 - 0.45 * bok) + math.copysign((1.0 - u) * 0.55 * bok, lat)
    return 0.5 + 0.5 * math.cos(s * PASMA * math.pi), s


def _fryzura_zaczesana(P, opcje):
    """F3/F1 — krótkie, zaczesane do tyłu.

    ⚠⚠ Pierwsza wersja czytała się jak HEŁM (autor, 2026-10-09). Hełm robią:
    równa grubość, gładka powierzchnia, prosty dolny brzeg i jeden kolor.
    Stąd: PASMA (żłobienia wzdłuż kierunku czesania, w grubości i jasności),
    NIERÓWNY brzeg na karku i nad uszami, BACZKI, cienkie boki z objętością
    na górze i z tyłu, ciemniejszy odrost przy brzegu."""
    linia = P["glowa_linia_wlosow"]
    skronie = opcje.get("skronie", 0.0)
    baczki = opcje.get("baczki", 1.0)

    def t_od(fi):
        przod = max(0.0, -math.cos(fi))          # 1 = środek czoła, 0 = boki/tył
        tyl = max(0.0, math.cos(fi))
        bok = abs(math.sin(fi))
        t = (linia + 0.04 * przod + skronie * (bok * przod) * 3.0
             - 0.08 * bok * (1 - przod) - 0.24 * tyl)
        # nierówny brzeg: kępki na karku i nad uszami (nie na czole)
        t += (0.022 * math.sin(9 * fi) + 0.014 * math.sin(17 * fi + 1.3)) * (1 - przod)
        # baczki przed uszami
        for c in (math.pi / 2 + 0.42, 3 * math.pi / 2 - 0.42):
            d = math.atan2(math.sin(fi - c), math.cos(fi - c))
            t -= 0.13 * baczki * math.exp(-(d / 0.13) ** 2)
        return t

    def grub(u, fi):
        tyl = max(0.0, math.cos(fi))
        przod = max(0.0, -math.cos(fi))
        bok = abs(math.sin(fi)) * (1 - u)
        brzeg = min(1.0, u / (0.35 if przod > 0.3 else 0.2))       # cienki brzeg
        pasmo, _s = _pasmo(u, fi)
        return (brzeg * (0.7 + 0.35 * u) * (1.0 + 0.8 * tyl) * (1.0 - 0.25 * przod)
                * (1.0 - 0.45 * bok) * (0.72 + 0.4 * pasmo))

    def odcien(u, fi, zewn):
        if not zewn:
            return 0.55
        pasmo, s = _pasmo(u, fi)
        nr = round(s * PASMA)
        szum = math.sin(nr * 12.9898 + 4.1) * 43758.5453
        szum -= math.floor(szum)                                 # 0..1 per pasmo
        return (0.68 + 0.42 * pasmo) * (0.8 + 0.2 * min(1.0, u * 3)) * (0.88 + 0.3 * szum)

    wys, broda, _pw, pg = _glowa_geom(P)
    fy = baza._profil([(a, y) for a, _, _, y in baza.PROFIL_GLOWY], 1.0)
    czubek = Vector((0.0, fy * pg + 0.05 * wys, broda + wys * (1.005 + 0.06 * opcje.get("objetosc", 1.0))))
    return _plat(P, t_od, 0.985, 0.0, 2 * math.pi, 0.095 * opcje.get("objetosc", 1.0), -0.03,
                 n_fi=64, n_t=9, profil_grubosci=grub, zamknij_krag=True, czubek=czubek, odcien=odcien)


def _fryzura_kok(P, opcje):
    """F4 (wariant) — włosy zaczesane gładko do tyłu i upięte w KOK na
    potylicy. Kok jest sylwetką czytelną z kamery gry (kamera patrzy z góry,
    więc wypukłość z tyłu głowy widać zawsze)."""
    o = dict(opcje)
    o.setdefault("skronie", 0.0)
    o.setdefault("baczki", 0.0)
    o.setdefault("objetosc", 0.8)
    v, f, c = _fryzura_zaczesana(P, o)
    wys, broda, pw, pg = _glowa_geom(P)
    # środek koka: tył głowy, nieco nad linią uszu
    sr = punkt(P, 0.66, 0.0, 1.0) + Vector((0.0, 0.11 * wys, 0.0))
    r = 0.17 * wys * opcje.get("kok", 1.0)
    n_p, n_r = 12, 7
    start = len(v)
    for j in range(n_r + 1):
        th = math.pi * j / n_r
        for i in range(n_p):
            ph = 2 * math.pi * i / n_p
            sp = (0.5 + 0.5 * math.cos(ph * 3 + th * 2))      # skręt upięcia — pasma
            rr = r * (1.0 + 0.08 * sp)
            v.append(sr + Vector((rr * math.sin(th) * math.cos(ph),
                                  rr * 0.8 * math.sin(th) * math.sin(ph),
                                  rr * 0.9 * math.cos(th))))
            c.append(0.75 + 0.35 * sp)
    for j in range(n_r):
        for i in range(n_p):
            a0 = start + j * n_p + i
            a1 = start + j * n_p + (i + 1) % n_p
            b0 = start + (j + 1) * n_p + i
            b1 = start + (j + 1) * n_p + (i + 1) % n_p
            f.append((a0, b0, b1, a1))
    return v, f, c


def _fryzura_wieniec(P, opcje):
    """Łysina z WIEŃCEM (starzec; też pod kapelusz/czapkę — wieniec wystaje
    spod ronda, a czubek nie przebija nakrycia). Pierścień włosów od karku
    i uszu do `wieniec` (t), bez przodu: czoło i czubek odsłonięte."""
    gora = opcje.get("wieniec", 0.70)

    def t_od(fi):
        tyl = max(0.0, math.cos(fi))
        bok = abs(math.sin(fi))
        return (P["glowa_linia_wlosow"] - 0.10 * bok - 0.24 * tyl
                + 0.02 * math.sin(9 * fi) + 0.012 * math.sin(17 * fi + 1.3))

    def t_do(fi):
        tyl = max(0.0, math.cos(fi))
        return gora + 0.05 * tyl + 0.015 * math.sin(7 * fi)

    def grub(u, fi):
        return min(1.0, u / 0.25) * (1.0 - 0.6 * u) + 0.25

    def odcien(u, fi, zewn):
        return (0.82 + 0.25 * (0.5 + 0.5 * math.sin(fi * 19.0))) if zewn else 0.55

    # łuk przez TYŁ (φ = 0), przód odsłonięty ± `czolo` od φ = π
    czolo = opcje.get("czolo", 0.95)
    return _plat(P, t_od, t_do, math.pi + czolo, 3 * math.pi - czolo,
                 0.07 * opcje.get("objetosc", 1.0), -0.02, n_fi=40, n_t=4,
                 profil_grubosci=grub, odcien=odcien)


def _kurtyna(P, fi_od, fi_do, t_gora, t_dol, grubosc, odchyl, n_fi=18, n_t=8, zwezenie=0.35):
    """Pasmo włosów SPADAJĄCE z głowy: od poziomu `t_gora` profilu czaszki
    w dół do `t_dol` (t < 0 = pod brodą), odchylone do tyłu o `odchyl` × wys
    (żeby nie wchodziło w kark i łopatki), zwężające się ku końcówkom."""
    wys, _broda, _pw, _pg = _glowa_geom(P)
    v, f, c = [], [], []
    kol = n_fi + 1

    def warstwa(dod):
        start = len(v)
        for j in range(n_t + 1):
            u = j / n_t                                   # 0 góra, 1 końcówki
            t = t_gora + (t_dol - t_gora) * u
            for i in range(kol):
                s = i / n_fi
                fi = fi_od + (fi_do - fi_od) * (0.5 + (s - 0.5) * (1.0 - zwezenie * u))
                p = punkt(P, t_gora, fi, 1.0 + dod * (1.0 - 0.3 * u))
                p.z = _broda + t * wys
                p.y += odchyl * wys * u ** 0.8
                v.append(p)
                fala = 0.5 + 0.5 * math.cos(fi * 22.0 + u * 2.0)
                c.append((0.72 + 0.4 * fala) * (1.05 - 0.2 * u) if dod > 0 else 0.5)
        return start

    z0 = warstwa(grubosc)
    w0 = warstwa(grubosc * 0.25)
    for j in range(n_t):
        for i in range(n_fi):
            a, b = j * kol + i, (j + 1) * kol + i
            f.append((z0 + a, z0 + a + 1, z0 + b + 1, z0 + b))
            f.append((w0 + a, w0 + b, w0 + b + 1, w0 + a + 1))
    for i in range(n_fi):                                 # końcówki
        a = n_t * kol + i
        f.append((z0 + a, z0 + a + 1, w0 + a + 1, w0 + a))
    for i in (0, n_fi):                                   # boki pasma
        for j in range(n_t):
            a, b = j * kol + i, (j + 1) * kol + i
            q = (z0 + a, z0 + b, w0 + b, w0 + a)
            f.append(q if i == 0 else q[::-1])
    return v, f, c


def _dolacz(baza_vfc, *inne):
    v, f, c = baza_vfc
    for vv, ff, cc in inne:
        o = len(v)
        v += vv
        c += cc
        f += [tuple(i + o for i in x) for x in ff]
    return v, f, c


def _fryzura_dlugie(P, opcje):
    """Długie, rozpuszczone — zaczesane na czaszce + KURTYNA z tyłu do łopatek.
    Z kamery z góry długość czyta się z pleców, nie z twarzy."""
    o = dict(opcje)
    o.setdefault("skronie", 0.0)
    o.setdefault("baczki", 0.0)
    o.setdefault("objetosc", 1.1)
    return _dolacz(_fryzura_zaczesana(P, o),
                   _kurtyna(P, -1.55, 1.55, 0.52, opcje.get("dlugosc", -0.95), 0.12, 0.16))


def _fryzura_warkocz(P, opcje):
    """Gładko zaczesane + WARKOCZ na plecach: łańcuch spłaszczonych ogniw
    na zakładkę (sylwetka sznura, nie rurka)."""
    o = dict(opcje)
    o.setdefault("skronie", 0.0)
    o.setdefault("baczki", 0.0)
    o.setdefault("objetosc", 0.8)
    v, f, c = _fryzura_zaczesana(P, o)
    wys, broda, _pw, _pg = _glowa_geom(P)
    start = punkt(P, 0.42, 0.0, 1.06)
    # ⚠ 7 ogniw na tej długości stało z PRZERWAMI (z boku: koraliki na nitce,
    #   review 2026-10-10) — odstęp 0,21 głowy przy połowie wysokości ogniwa
    #   0,07–0,11. 12 ogniw zachodzi na siebie na całej długości.
    ogniw = opcje.get("ogniwa", 12)
    for k in range(ogniw):
        u = k / max(1, ogniw - 1)
        sr = Vector((start.x + 0.02 * wys * math.sin(k * 1.7),
                     start.y + 0.10 * wys * u,
                     start.z - (0.30 + 0.95 * opcje.get("dlugosc", 1.0)) * wys * u))
        r = 0.085 * wys * (1.0 - 0.35 * u)
        n_p, n_r = 8, 5
        s0 = len(v)
        for j in range(n_r + 1):
            th = math.pi * j / n_r
            for i in range(n_p):
                ph = 2 * math.pi * i / n_p
                skret = 0.5 + 0.5 * math.cos(ph * 2 + th + k * 1.4)
                v.append(sr + Vector((r * math.sin(th) * math.cos(ph) * 1.1,
                                      r * 0.75 * math.sin(th) * math.sin(ph),
                                      r * 1.25 * math.cos(th))))
                c.append(0.72 + 0.38 * skret)
        for j in range(n_r):
            for i in range(n_p):
                a0, a1 = s0 + j * n_p + i, s0 + j * n_p + (i + 1) % n_p
                b0, b1 = s0 + (j + 1) * n_p + i, s0 + (j + 1) * n_p + (i + 1) % n_p
                f.append((a0, b0, b1, a1))
    return v, f, c


FRYZURY = {
    "zaczesane": _fryzura_zaczesana,
    "kok": _fryzura_kok,
    "wieniec": _fryzura_wieniec,
    "dlugie": _fryzura_dlugie,
    "warkocz": _fryzura_warkocz,
}


def _broda_krotka(P, opcje):
    """Krótka, przycięta broda WZDŁUŻ ŻUCHWY: gęsta na podbródku i lekko pod
    nim, na bokach cienki pas do baczków — policzki odsłonięte.

    ⚠⚠ Pierwsza wersja obejmowała twarz od ucha do ucha równą warstwą do
    połowy policzków i czytała się jak przyklejony WOREK (autor, 2026-10-09)."""
    t_ust = P["glowa_linia_ust"]
    rozp = 1.18

    def t_do(fi):
        d = abs(fi - math.pi) / rozp            # 0 przód, 1 przy uchu
        # środek: pod ustami; boki: linia żuchwy, przy uchu do baczka
        return t_ust - 0.045 + (0.40 - (t_ust - 0.045)) * min(1.0, d ** 2.2)

    def t_od(fi):
        d = abs(fi - math.pi) / rozp
        return -0.06 * (1 - d) ** 1.5 + 0.02 * math.sin(11 * fi) * (1 - d)

    def grub(u, fi):
        przod = 1.0 - abs(fi - math.pi) / rozp
        return (0.35 + 0.95 * przod ** 1.3) * (1.15 - 0.55 * u)

    def odcien(u, fi, zewn):
        return (0.8 + 0.25 * (0.5 + 0.5 * math.sin(fi * 23.0))) * (0.85 + 0.15 * (1 - u)) if zewn else 0.55

    return _plat(P, t_od, t_do, math.pi - rozp, math.pi + rozp,
                 0.06 * opcje.get("objetosc", 1.0), -0.02,
                 n_fi=30, n_t=6, profil_grubosci=grub, odcien=odcien,
                 dz=lambda u, fi: -0.015 * (1 - u) * max(0.0, 1.0 - abs(fi - math.pi) / rozp) ** 2)


def _broda_dluga(P, opcje):
    """Długa broda (starzec, sołtys): ta sama linia żuchwy co krótka, ale
    środek opada POD podbródek klinem do `dlugosc` (t < 0) — z kamery z góry
    to biała plama na piersi, czytelna przy 30 px głowy."""
    t_ust = P["glowa_linia_ust"]
    rozp = 1.18
    dl = opcje.get("dlugosc", 0.42)

    def t_do(fi):
        d = abs(fi - math.pi) / rozp
        return t_ust - 0.035 + (0.42 - (t_ust - 0.035)) * min(1.0, d ** 2.0)

    # ⚠ Profil czaszki ZWĘŻA SIĘ DO ZERA w podbródku (t = 0), więc broda
    #   liczona dla t < 0 zapadała się w pasek pod brodą i „długa" czytała się
    #   jak krótka. Dolny brzeg zostaje na profilu tuż NAD podbródkiem (t 0,06),
    #   a długość daje przesunięcie w dół (`dz`) malejące ku górze płatu.
    def t_od(fi):
        d = abs(fi - math.pi) / rozp
        return 0.06 + 0.03 * math.sin(13 * fi) * (1 - d)

    def grub(u, fi):
        przod = 1.0 - abs(fi - math.pi) / rozp
        return (0.4 + 1.1 * przod ** 1.2) * (1.25 - 0.45 * u)

    def odcien(u, fi, zewn):
        return (0.8 + 0.28 * (0.5 + 0.5 * math.sin(fi * 23.0))) * (0.9 + 0.12 * u) if zewn else 0.55

    def dz(u, fi):
        przod = max(0.0, 1.0 - abs(fi - math.pi) / rozp)
        return -dl * (1 - u) ** 1.3 * przod ** 1.1

    return _plat(P, t_od, t_do, math.pi - rozp, math.pi + rozp,
                 0.08 * opcje.get("objetosc", 1.0), -0.02,
                 n_fi=30, n_t=8, profil_grubosci=grub, odcien=odcien, dz=dz)


ZAROSTY = {
    "broda_krotka": _broda_krotka,
    "broda_dluga": _broda_dluga,
}


# ── NAKRYCIA GŁOWY (2026-10-10) ───────────────────────────────────────────────
# Review (Gemini + autor): chusty z katalogu (`cloth_coif` = kopia głowy)
# przylegały do czaszki jak czepek pływacki, a kapelusz rolnika był
# przemalowanym KAPALINEM (wysoka kopuła hełmu). Nakrycia cywilne to więc
# osobne bryły z parametrów, nie kopie siatki głowy:
# - `okrycie`: JEDEN generator luźnego okrycia — LUZ wokół czaszki, OKNO na
#   twarz, SPŁYW na kark i barki, opcjonalny SZPIC z tyłu. Chusta wiejska dziś;
#   kaptur zabójcy / maga / kapłana później (autor: kaptur ma odstawać, nie
#   przylegać) — ta sama funkcja, inne liczby.
# - `kapelusz`: niska główka (płaska albo zaokrąglona) + szerokie rondo;
#   słomkowy (rolnik) i filcowy z tej samej funkcji.

def _os_ciala():
    arm = bpy.data.objects["Armature"]
    return (arm.matrix_world @ arm.data.bones["Bone.002"].head_local).y


def _okrycie(P, opcje):
    H, Z0 = baza.WYSOKOSC, baza.PODLOGA
    wys, broda, pw, pg = _glowa_geom(P)
    luz = opcje.get("luz", 1.14)                  # promień × czaszka
    szpic = opcje.get("szpic", 0.0)               # uniesienie szpica z tyłu (× wys)
    okno = opcje.get("okno", 0.95)                # pół szerokości otworu na twarz (rad)
    okno_gora = opcje.get("okno_gora", P["glowa_linia_wlosow"] + 0.06)
    splyw = opcje.get("splyw", 1.0)               # 0 = do szyi, 1 = na barki
    splyw_szer = opcje.get("splyw_szer", 1.0)     # szerokość spływu (× barki)
    splyw_z = opcje.get("splyw_z", 0.0)           # przesunięcie końca spływu w pionie (× wzrost)
    # `pelerynka`: bez części na głowę — kołnierz opuszczonego kaptura wokół
    #   szyi + spływ na barki (pasterz). Ta sama bryła co kaptur, bez głowy.
    pelerynka = opcje.get("pelerynka", False)
    y0 = _os_ciala()
    T_GLOWA = [0.03] if pelerynka else [0.97, 0.88, 0.77, 0.65, 0.52, 0.39, 0.26, 0.13, 0.03]
    z_bark = Z0 + H * (P["bark"] + P["ramie_promien"] * 0.9 + splyw_z)
    polsz = H * (P["bark_polrozstaw"] + P["ramie_promien"] * 1.25) * splyw_szer
    polgl = H * (P["klatka_glebokosc"] + 0.04) * (0.5 + 0.5 * splyw_szer)
    n_fi = 36
    rzedy = []                                    # (t albo None dla spływu, punkty)
    for t in T_GLOWA:
        pkt = []
        for i in range(n_fi):
            fi = 2 * math.pi * i / n_fi
            p = punkt(P, t, fi, luz + 0.04 * max(0.0, math.cos(fi)))   # więcej luzu z tyłu
            # luz także W GÓRĘ: `punkt` rozsuwa tylko promień, a czubek głowy
            # (wypukła strefa włosów) przebijał wierzch okrycia
            p.z += (luz - 1.0) * wys * 0.55 * max(0.0, (t - 0.45) / 0.55)
            if szpic and t > 0.70:
                k = ((t - 0.70) / 0.30) ** 2 * max(0.0, math.cos(fi)) ** 2
                p.z += szpic * wys * k
                p.y += szpic * wys * 0.5 * k
            pkt.append(p)
        rzedy.append((t, pkt))
    glowa_dol = rzedy[-1][1]
    # ⭐ `do_szyi` (2026-10-10): okrycie DOMYKA SIĘ POD BRODĄ na szyi, zamiast
    #   rozkładać się na barki. ⚠ W bazie V5 (głowa ~3,9) szczyt barków leży
    #   prawie na wysokości podbródka, więc spływ „z podbródka na barki" jest
    #   z konieczności POZIOMY — z kamery gry (40° z góry) czytał się jako
    #   TALERZ wokół szyi (zgłoszenie autora: Hanna; to samo u zielarki
    #   i skrzydła kaptura Agaty). Zwężenie do szyi chowa się pod głową.
    do_szyi = opcje.get("do_szyi", False)
    sr_x = sum(p.x for p in glowa_dol) / n_fi
    sr_y = sum(p.y for p in glowa_dol) / n_fi
    r_szyi = H * P["szyja_promien"] * 1.35
    for u in ((0.3, 0.6, 1.0, 1.25) if pelerynka else ((0.55, 1.0) if do_szyi else (0.3, 0.6, 1.0))):
        uu = u * splyw
        pkt = []
        for i in range(n_fi):
            fi = 2 * math.pi * i / n_fi
            if do_szyi:
                cel = Vector((sr_x + r_szyi * math.sin(fi), sr_y + r_szyi * 1.1 * math.cos(fi),
                              broda - 0.05 * wys))
                pkt.append(glowa_dol[i].lerp(cel, u ** 0.7))
                continue
            bark = Vector((polsz * math.sin(fi), y0 + polgl * math.cos(fi),
                           z_bark - 0.02 * H * max(0.0, -math.cos(fi))))
            # z przodu spływ zostaje wyżej — chusta pod brodą, kaptur pod szyją
            pkt.append(glowa_dol[i].lerp(bark, uu ** 0.85))
        rzedy.append((None, pkt))
    v, f, c = [], [], []
    for ri, (t, pkt) in enumerate(rzedy):
        for i, p in enumerate(pkt):
            fi = 2 * math.pi * i / n_fi
            v.append(p)
            fald = 0.86 + 0.14 * math.sin(fi * 7.0 + ri * 0.8)
            c.append(fald * (0.9 if t is None else 1.0))
    czubek = len(v)
    if not pelerynka:
        v.append(punkt(P, 1.0, 0.0, luz) + Vector((0.0, 0.0, 0.03 * wys + (luz - 1.0) * wys * 0.55 + szpic * wys * 0.6)))
        c.append(1.0)

    def w_oknie(ri, i):
        t = rzedy[ri][0]
        if t is None:
            return False
        fi = 2 * math.pi * (i + 0.5) / n_fi
        d = abs(math.atan2(math.sin(fi - math.pi), math.cos(fi - math.pi)))
        return d < okno and t < okno_gora
    for ri in range(len(rzedy) - 1):
        ta, tb = rzedy[ri][0], rzedy[ri + 1][0]
        for i in range(n_fi):
            # okno: wycięte, gdy OBA pierścienie głowy leżą w otworze twarzy;
            # przejście głowa → spływ zostaje (zamyka okrycie pod brodą)
            if ta is not None and tb is not None and w_oknie(ri, i) and w_oknie(ri + 1, i):
                continue
            a0, a1 = ri * n_fi + i, ri * n_fi + (i + 1) % n_fi
            b0, b1 = (ri + 1) * n_fi + i, (ri + 1) * n_fi + (i + 1) % n_fi
            f.append((a0, a1, b1, b0))
    for i in range(n_fi if not pelerynka else 0):
        f.append((czubek, (i + 1) % n_fi, i))
    # brzeg okna ciemniejszy — przy 150 px to linia, która rysuje owal twarzy
    for ri, (t, pkt) in enumerate(rzedy):
        for i in range(n_fi):
            if t is not None and (w_oknie(ri, i) or w_oknie(ri, i - 1)):
                c[ri * n_fi + i] *= 0.72
    return v, f, c


def _elipsoida(v, f, c, sr, rx, ry, rz, jas=1.0, n_p=8, n_r=5):
    """Spłaszczona bryłka (węzeł, końce chusty) dopisana do (v, f, c)."""
    s0 = len(v)
    for j in range(n_r + 1):
        th = math.pi * j / n_r
        for i in range(n_p):
            ph = 2 * math.pi * i / n_p
            v.append(sr + Vector((rx * math.sin(th) * math.cos(ph), ry * math.sin(th) * math.sin(ph),
                                  rz * math.cos(th))))
            c.append(jas * (0.82 + 0.18 * math.cos(ph * 2 + th)))
    for j in range(n_r):
        for i in range(n_p):
            a0, a1 = s0 + j * n_p + i, s0 + j * n_p + (i + 1) % n_p
            b0, b1 = s0 + (j + 1) * n_p + i, s0 + (j + 1) * n_p + (i + 1) % n_p
            f.append((a0, b0, b1, a1))


def _chusta_wiazana(P, opcje):
    """Chusta ZAWIĄZANA Z TYŁU (Hanna, Zofia — portrety 2D, 2026-10-10):
    płótno na czubku i tyle głowy, brzeg od czoła nad uszami do karku, węzeł
    z dwoma końcami na potylicy. Bez części pod brodą i bez spływu na barki
    — pierwsza wersja (`chusta` = okrycie z kołnierzem) czytała się w grze
    jak talerz wokół szyi.

    Płat jak czupryna (`_plat`): grubość rośnie od brzegu (przylega, spod
    niego wychodzą włosy) ku czubkowi (luźne płótno)."""
    wys, broda, _pw, pg = _glowa_geom(P)
    t_przod = opcje.get("przod", P["glowa_linia_wlosow"] + 0.05)
    t_tyl = opcje.get("tyl", 0.16)
    luz = opcje.get("luz", 0.13)

    def t_od(fi):
        tyl = (1.0 + math.cos(fi)) / 2.0                 # 1 = tył, 0 = przód
        return t_przod - (t_przod - t_tyl) * tyl ** 1.2

    def grub(u, fi):
        # ⚠ luz 0,20 narastający do u = 0,35 robił GRZYBEK (kapelusz nad twarzą)
        return (0.35 + 0.65 * min(1.0, u / 0.6)) * (1.0 + 0.30 * max(0.0, math.cos(fi)))

    def odcien(u, fi, zewn):
        if not zewn:
            return 0.55
        brzeg = 0.74 if u < 0.13 else 1.0                # obszycie: linia rysująca owal
        return brzeg * (0.86 + 0.14 * math.sin(fi * 7.0 + u * 2.0))

    fy = baza._profil([(a, y) for a, _, _, y in baza.PROFIL_GLOWY], 1.0)
    czubek = Vector((0.0, fy * pg + 0.03 * wys, broda + wys * (1.0 + luz * 0.58)))
    v, f, c = _plat(P, t_od, 0.985, 0.0, 2 * math.pi, luz, -0.03, n_fi=48, n_t=7,
                    profil_grubosci=grub, zamknij_krag=True, czubek=czubek, odcien=odcien)
    # węzeł na karku + dwa krótkie końce zwisające na kark
    wezel = punkt(P, t_tyl + 0.06, 0.0, 1.0 + luz * 0.45)
    _elipsoida(v, f, c, wezel, 0.075 * wys, 0.06 * wys, 0.06 * wys, jas=0.85)
    for strona in (-1, 1):
        sr = wezel + Vector((strona * 0.05 * wys, 0.025 * wys, -0.11 * wys))
        _elipsoida(v, f, c, sr, 0.045 * wys, 0.025 * wys, 0.10 * wys, jas=0.9)
    return v, f, c


def _pelerynka(P, opcje):
    """Pelerynka z opuszczonym kapturem (pasterz): kołnierz u nasady szyi →
    pierścień PONAD szczytem barków → krawędź barków → zwis na ramiona.

    ⚠ Spływ liczony od podbródka (jak w `_okrycie`) przebijały barki albo
    wychodził płaski talerz: szczyt mięśnia barku leży WYŻEJ niż podbródek.
    Tu pierścień nad barkami jest jawny."""
    H, Z0 = baza.WYSOKOSC, baza.PODLOGA
    y0 = _os_ciala()
    zwis = opcje.get("zwis", 0.075)               # długość zwisu poniżej barków (× wzrost)
    b = P["bark_polrozstaw"]
    r = P["ramie_promien"]
    gl = P["klatka_glebokosc"]
    # ⚠ Pierścienie MALEJĄ w pionie: kołnierz z dołu (przy obojczyku) dawał
    #   „poduszkę pod szyję" — w tym stylu szczyt barków sięga do żuchwy.
    pierscienie = [  # (pół szer., pół głęb., z — wszystko × wzrost)
        (P["szyja_promien"] * 1.8, P["szyja_promien"] * 1.7, P["bark"] + r + 0.026),
        (b * 0.85, gl + 0.03, P["bark"] + r + 0.016),
        (b + r * 1.35, gl + 0.045, P["bark"] + 0.012),
        ((b + r * 1.35) * 1.04, gl + 0.055, P["bark"] - zwis),
    ]
    n_fi = 36
    v, f, c = [], [], []
    for ri, (sx, sy, z) in enumerate(pierscienie):
        for i in range(n_fi):
            fi = 2 * math.pi * i / n_fi
            # z przodu kołnierz niżej (podbródek), z tyłu wyżej (kark)
            dz = 0.012 * math.cos(fi) if ri == 0 else 0.0
            v.append(Vector((H * sx * math.sin(fi), y0 + H * sy * math.cos(fi), Z0 + H * (z + dz))))
            c.append((0.86 + 0.14 * math.sin(fi * 7.0 + ri)) * (0.78 if ri == 0 else 1.0))
    for ri in range(len(pierscienie) - 1):
        for i in range(n_fi):
            a0, a1 = ri * n_fi + i, ri * n_fi + (i + 1) % n_fi
            f.append((a0, a1, a1 + n_fi, a0 + n_fi))
    return v, f, c


def _kapelusz(P, opcje):
    wys, broda, pw, pg = _glowa_geom(P)
    t0 = opcje.get("t_dol", 0.80)                 # wysokość osadzenia na głowie
    glowka = opcje.get("glowka", 0.20)            # wysokość główki (× wys)
    rondo = opcje.get("rondo", 2.0)               # promień ronda (× pół szer. głowy)
    plaski = opcje.get("plaski", 1.0)             # 1 = płaska główka, 0 = kopuła
    slomka = opcje.get("slomka", False)
    haft = opcje.get("haft", False)               # haftowane pasy na główce (czapka ludowa)
    n_fi = 32
    baza_r = [punkt(P, t0, 2 * math.pi * i / n_fi, 1.10) for i in range(n_fi)]
    z0 = broda + t0 * wys
    sr = Vector((0.0, sum(p.y for p in baza_r) / n_fi, z0))
    v, f, c = [], [], []

    def pas(skala_c, k):
        if haft:
            # pasy haftu: co drugi rząd główki ciemny z zygzakiem
            return (0.62 + 0.18 * (0.5 + 0.5 * math.sin(k * 14.0))) * skala_c if int(k) % 2 else skala_c
        if slomka:
            return (0.86 + 0.18 * (0.5 + 0.5 * math.sin(k * 23.0))) * skala_c
        return (0.92 + 0.08 * math.sin(k * 5.0)) * skala_c
    # główka: 5 pierścieni od ronda w górę, lekko zwężająca się
    for k in range(5):
        u = k / 4
        zz = z0 + glowka * wys * (u if plaski >= 1.0 else math.sin(u * math.pi / 2))
        sk = 1.0 - 0.10 * u - (1.0 - plaski) * 0.35 * u ** 2
        for p in baza_r:
            q = sr + (p - sr) * sk
            v.append(Vector((q.x, q.y, zz)))
            c.append(pas(0.55 if k == 0 else 1.0, k if haft else zz * 9.0))   # ciemna wstążka u dołu główki
    gora = len(v)
    v.append(Vector((sr.x, sr.y, z0 + glowka * wys * (1.0 if plaski >= 1.0 else 1.12))))
    c.append(pas(1.0, 0.0))
    if rondo <= 0:            # czapka bez ronda (mycka, czapka ludowa)
        for k in range(4):
            for i in range(n_fi):
                a0, a1 = k * n_fi + i, k * n_fi + (i + 1) % n_fi
                f.append((a0, a1, a1 + n_fi, a0 + n_fi))
        for i in range(n_fi):
            f.append((4 * n_fi + (i + 1) % n_fi, 4 * n_fi + i, gora))
        return v, f, c
    # rondo: od podstawy główki na zewnątrz, krawędź lekko opadająca
    r_ext = pw * rondo
    rondo_od = len(v)
    for k, (s, dz) in enumerate(((0.55, 0.0), (0.8, -0.012), (1.0, -0.04))):
        for i, p in enumerate(baza_r):
            fi = 2 * math.pi * i / n_fi
            kier = Vector((math.sin(fi), math.cos(fi), 0.0))
            q = sr + kier * (r_ext * s) if k else p
            q = q.copy()
            if k == 0:
                q.z = z0
            else:
                q.z = z0 + dz * wys
            v.append(q)
            c.append(pas(0.95, s * 31.0 + fi * 0.5))
    for k in range(4):
        for i in range(n_fi):
            a0, a1 = k * n_fi + i, k * n_fi + (i + 1) % n_fi
            f.append((a0, a1, a1 + n_fi, a0 + n_fi))
    for i in range(n_fi):      # wieczko: lico W GÓRĘ (odwrotna kolejność dawała ciemny szczyt)
        f.append((4 * n_fi + (i + 1) % n_fi, 4 * n_fi + i, gora))
    for k in range(2):
        for i in range(n_fi):
            a0 = rondo_od + k * n_fi + i
            a1 = rondo_od + k * n_fi + (i + 1) % n_fi
            f.append((a0, a0 + n_fi, a1 + n_fi, a1))
    return v, f, c


NAKRYCIA = {
    # ⚠ luz 1,12 chował chustę W GŁOWIE: strefa włosów czaszki jest wypukła
    #   (+10% w bok) — widać było sam kołnierz. Spływ węższy i niżej: przy
    #   szerokości barków czytał się jak płaska kryza.
    #   ⚠⚠ Także węższy i niższy spływ dalej był TALERZEM z kamery gry (autor,
    #   2026-10-10: Hanna) — w bazie V5 barki sięgają podbródka. Od tej daty
    #   chusta i kaptur domykają się NA SZYI (`do_szyi`), a nie na barkach.
    # `chusta` = wiązana pod brodą (Dorota); `chusta_wiazana` = z tyłu (Hanna, Zofia)
    "chusta": lambda P, o: _okrycie(P, {"luz": 1.22, "okno": 0.95, "do_szyi": True, **o}),
    "chusta_wiazana": lambda P, o: _chusta_wiazana(P, o),
    "kaptur": lambda P, o: _okrycie(P, {"luz": 1.24, "okno": 1.05, "szpic": 0.22, "do_szyi": True,
                                        "okno_gora": P["glowa_linia_wlosow"] + 0.10, **o}),
    # rondo 2,25× zasłaniało z kamery gry CAŁĄ twarz — 1,65× zostawia ją widoczną
    # główka 0,26: przy 0,20 kończyła się NA czubku głowy i włosy przebijały środek
    # ⚠ pierwsza wersja (luz 1,55, barki −0,035) była płaską KRYZĄ, przez którą
    #   przebijały barki — niżej i szerzej, żeby przykryła górę ramion
    # ⛔ NIEUŻYWANA od 2026-10-10: pelerynka mieszkańca to powłoka ciała (`npc3d`,
    #   preset `pelerynka`) — ta wersja na kości głowy była z kamery gry kryzą.
    "pelerynka": lambda P, o: _pelerynka(P, o),
    # czapka ludowa bez ronda, z haftem (Bogusz — referencja autora)
    # niski toczek — przy główce 0,22 czytał się jak doniczka
    # ⚠ główka 0,15 od t 0,78 kończyła się NA 0,93 wysokości głowy — czubek
    #   czaszki przebijał wieczko i z góry czapka czytała się jak pusta obręcz
    #   (review 2026-10-10). Osadzona wyżej, wieczko ponad czubkiem.
    "czapka_haft": lambda P, o: _kapelusz(P, {"glowka": 0.19, "rondo": 0, "plaski": 0.7, "haft": True,
                                              "t_dol": 0.84, **o}),
    "slomkowy": lambda P, o: _kapelusz(P, {"glowka": 0.26, "rondo": 1.65, "plaski": 1.0, "slomka": True, **o}),
    "filcowy": lambda P, o: _kapelusz(P, {"glowka": 0.26, "rondo": 1.55, "plaski": 0.35, **o}),
}


def _wasy(P):
    """Wąsy: łuk nad ustami, końce opadają do linii brody."""
    t_ust = P["glowa_linia_ust"]
    rozp = 0.62

    def t_od(fi):
        d = abs(fi - math.pi) / rozp
        return t_ust + 0.012 - 0.07 * d ** 2

    def t_do(fi):
        d = abs(fi - math.pi) / rozp
        return t_ust + 0.075 - 0.07 * d ** 2

    # 1,10: nos bazy wypycha przód o ~7% promienia — wąsy muszą leżeć NAD nim.
    return _plat(P, t_od, t_do, math.pi - rozp, math.pi + rozp, 0.135, 0.07, n_fi=12, n_t=2)


def _brwi(P):
    """Dwie krótkie, grube kreski nad oczami (nad „daszkiem" brwi bazy)."""
    t = P["glowa_linia_oczu"] + 0.105
    v, f, c = [], [], []
    for srodek in (math.pi - 0.50, math.pi + 0.50):
        vv, ff, cc = _plat(P, t, t + 0.045, srodek - 0.27, srodek + 0.27, 0.115, 0.075, n_fi=4, n_t=1)
        o = len(v)
        v += vv
        c += cc
        f += [tuple(i + o for i in x) for x in ff]
    return v, f, c


# ── wpięcie w plik ───────────────────────────────────────────────────────────

def _material(nazwa, srgb):
    m = bpy.data.materials.get(nazwa) or bpy.data.materials.new(nazwa)
    _ustaw_kolor(m, (*[_lin(c) for c in srgb], 1.0))
    m.roughness = 0.95
    m.metallic = 0.0
    return m


def _obiekt(nazwa, verts, faces, mat, srgb, cien, wygladz=True):
    stary = bpy.data.objects.get(nazwa)
    if stary:
        bpy.data.objects.remove(stary, do_unlink=True)
    me = bpy.data.meshes.new(nazwa)
    me.from_pydata([tuple(v) for v in verts], [], faces)
    me.validate()
    me.update()
    ob = bpy.data.objects.new(nazwa, me)
    bpy.context.scene.collection.objects.link(ob)
    arm = bpy.data.objects["Armature"]
    ob.parent = arm
    ob.parent_type = "BONE"
    ob.parent_bone = "Bone.004"
    ob.matrix_parent_inverse = Matrix.Identity(4)
    bpy.context.view_layer.update()
    me.transform(ob.matrix_world.inverted())
    # Kolor × odcień w atrybucie „Col" (COLOR_0) — ta sama droga co wzór
    # pancerza (`char3d_armor.zbuduj_pancerz`): węzeł Color Attribute w Base Color.
    kol = me.color_attributes.new("Col", "FLOAT_COLOR", "POINT")
    for i, k in enumerate(cien[: len(me.vertices)]):
        kol.data[i].color = (*[min(1.0, _lin(c) * k) for c in srgb], 1.0)
    tree = mat.node_tree
    bsdf = next(n for n in tree.nodes if n.type == "BSDF_PRINCIPLED")
    wezel = next((n for n in tree.nodes if n.type == "VERTEX_COLOR"), None) or tree.nodes.new("ShaderNodeVertexColor")
    wezel.layer_name = "Col"
    tree.links.new(wezel.outputs["Color"], bsdf.inputs["Base Color"])
    me.materials.append(mat)
    for p in me.polygons:
        p.use_smooth = wygladz
    if wygladz:
        md = ob.modifiers.new("Subdivision", "SUBSURF")
        md.levels = md.render_levels = 1
    return ob


def dodaj(P, fryzura=None, zarost=None, wasy=False, brwi=True, kolor_wlosow=(55, 38, 29),
          kolor_zarostu=None, opcje=None, nakrycie=None, kolor_nakrycia=(120, 100, 80), opcje_nakrycia=None):
    """Buduje wybrane elementy; zwraca listę obiektów. Rig musi stać w REST."""
    opcje = opcje or {}
    arm = bpy.data.objects["Armature"]
    tryb = arm.data.pose_position
    arm.data.pose_position = "REST"
    bpy.context.view_layer.update()
    mw = _material("Z_wlosy", kolor_wlosow)
    mz = _material("Z_zarost", kolor_zarostu or kolor_wlosow)
    out = []
    try:
        if fryzura:
            v, f, c = FRYZURY[fryzura](P, opcje)
            out.append(_obiekt(PRZEDROSTEK + "fryzura", v, f, mw, kolor_wlosow, c))
        kz = kolor_zarostu or kolor_wlosow
        if zarost:
            v, f, c = ZAROSTY[zarost](P, opcje)
            out.append(_obiekt(PRZEDROSTEK + "zarost", v, f, mz, kz, c))
        if wasy:
            v, f, c = _wasy(P)
            out.append(_obiekt(PRZEDROSTEK + "wasy", v, f, mz, kz, c))
        if brwi:
            v, f, c = _brwi(P)
            out.append(_obiekt(PRZEDROSTEK + "brwi", v, f, mz, kz, c, wygladz=False))
        if nakrycie:
            v, f, c = NAKRYCIA[nakrycie](P, opcje_nakrycia or {})
            mn = _material("Z_nakrycie", kolor_nakrycia)
            # kapelusz: ostre rondo; okrycie: miękki materiał (wygładzony)
            out.append(_obiekt(PRZEDROSTEK + "nakrycie", v, f, mn, kolor_nakrycia, c,
                               wygladz=nakrycie in ("chusta", "chusta_wiazana", "kaptur")))
    finally:
        arm.data.pose_position = tryb
        bpy.context.view_layer.update()
    for o in out:
        print(f"[wlosy] {o.name}: {len(o.data.vertices)} wierzch., {len(o.data.polygons)} wielok.")
    return out
