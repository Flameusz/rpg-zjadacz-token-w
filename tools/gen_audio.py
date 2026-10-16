"""
Generator proceduralnych efektow dzwiekowych (placeholdery).

Uruchom:  python tools/gen_audio.py
Zapisuje: public/assets/audio/*.wav  (16-bit mono, 22050 Hz)

Zasada taka sama jak przy grafice: gra ma zawsze dzialac, wiec zamiast czekac
na prawdziwe sample generujemy zastepniki. Podmiana = wrzucenie pliku o tej
samej nazwie. Wszystkie parametry sa tutaj, wiec da sie kreci bez ruszania kodu
gry.

Dobor barwy:
  * uderzenia (hit, hurt) = szum + niski sinus, bardzo szybkie wygaszenie
  * zamach (swing)        = filtrowany szum ze zjazdem w dol, bez tonu
  * nagrody (loot, level) = czyste tony, rosnace interwaly
  * smierc                = dlugi zjazd w dol
"""

import math
import os
import struct
import wave

import numpy as np

SR = 22050
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "assets", "audio")

rng = np.random.default_rng(7)  # staly seed = powtarzalne pliki


# ── narzedzia ────────────────────────────────────────────────────────────────

def t(ms):
    """Wektor czasu dla podanej dlugosci w milisekundach."""
    return np.linspace(0, ms / 1000, int(SR * ms / 1000), endpoint=False)


def decay(x, k=18.0):
    """Wykladnicze wygaszenie. Duze k = ostry trzask, male = ogon."""
    return np.exp(-k * np.linspace(0, 1, len(x)))


def attack(x, ms=3.0):
    """Krotki narost, zeby nie bylo trzasku na starcie probki."""
    n = max(1, int(SR * ms / 1000))
    env = np.ones(len(x))
    env[:n] = np.linspace(0, 1, n)
    return env


def noise(x):
    return rng.uniform(-1, 1, len(x))


def sweep(x, f0, f1):
    """Sinus ze zjazdem/wjazdem czestotliwosci (liniowo po fazie)."""
    f = np.linspace(f0, f1, len(x))
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def tone(x, f):
    return np.sin(2 * np.pi * f * x)


def band_noise(n, lo, hi):
    """Szum ograniczony do pasma lo..hi Hz, ksztaltowany w dziedzinie widma.

    Do TLA (dlugiej petli) filtrowanie w dziedzinie czasu sie nie sprawdza i to
    nie jest kwestia gustu, tylko zmierzona:
      * bialy szum + jeden biegun przy 520 Hz  -> 24% energii powyzej 2 kHz,
        czyli syk niestrojonego telewizora;
      * szum brazowy + cztery bieguny przy 260 Hz -> 86-100% energii ponizej
        120 Hz, czyli podbasowy pomruk, ktorego glosnik telefonu nie odtworzy.
    Obie wersje brzmia zle, tylko inaczej. Ksztaltujac widmo wprost dostajemy
    dokladnie to pasmo, o ktore chodzi, i da sie je zweryfikowac liczba.

    Dla wiatru 90..700 Hz daje ~4% podbasu, ~83% w 120-1000 Hz i 2.3% powyzej
    2 kHz — to jest ten wynik, ktorego szukamy.
    """
    f = np.fft.rfftfreq(n, 1 / SR)
    spec = np.fft.rfft(rng.uniform(-1, 1, n))
    with np.errstate(divide="ignore", invalid="ignore"):
        hp = (f / lo) ** 2 / (1 + (f / lo) ** 2)     # zbocze dolne, 12 dB/okt
    hp[0] = 0.0                                       # skasuj skladowa stala
    lp = 1 / (1 + (f / hi) ** 2)                      # zbocze gorne, 12 dB/okt
    out = np.fft.irfft(spec * hp * lp, n)
    return out / (np.max(np.abs(out)) or 1.0)


def lowpass(sig, cutoff):
    """Jednobiegunowy filtr dolnoprzepustowy — tanio odejmuje ostrosci szumowi."""
    a = math.exp(-2 * math.pi * cutoff / SR)
    out = np.empty_like(sig)
    acc = 0.0
    for i, s in enumerate(sig):
        acc = (1 - a) * s + a * acc
        out[i] = acc
    return out


def saturate(sig, amount=2.2):
    """Miekkie nasycenie — dodaje "cialo" bez brudzenia."""
    return np.tanh(sig * amount) / np.tanh(amount)


def norm(sig, peak=0.85):
    m = np.max(np.abs(sig)) or 1.0
    return sig / m * peak


def save(name, sig):
    sig = norm(sig)
    data = (np.clip(sig, -1, 1) * 32767).astype(np.int16)
    path = os.path.join(OUT, name + ".wav")
    with wave.open(path, "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(struct.pack("<%dh" % len(data), *data))
    print("  %-10s %5d probek  %5.0f ms" % (name, len(data), len(data) / SR * 1000))


# ── dzwieki ──────────────────────────────────────────────────────────────────

def swing():
    """Zamach bronia: powietrze, bez tonu. Najczestszy dzwiek w grze, wiec
    musi byc krotki i nieuciazliwy przy powtarzaniu."""
    x = t(130)
    n = lowpass(noise(x), 2600)
    body = n * decay(x, 9) * attack(x, 8)
    # lekki zjazd wysokosci sugeruje ruch reki
    body *= np.linspace(1.0, 0.55, len(x))
    return body * 0.7


def hit():
    """Trafienie w cialo: puk + szum. Krotkie, zeby seria ciosow sie nie zlewala."""
    x = t(110)
    thud = sweep(x, 180, 70) * decay(x, 22)
    crack = lowpass(noise(x), 3800) * decay(x, 34)
    return saturate(thud * 0.9 + crack * 0.5)


def crit():
    """Trafienie krytyczne: to samo uderzenie + metaliczny dzwiek wyzej.
    Ma sie wyrozniac w serii, nie byc glosniejsze."""
    x = t(190)
    thud = sweep(x, 230, 80) * decay(x, 18)
    crack = lowpass(noise(x), 5200) * decay(x, 28)
    ping = (tone(x, 1180) + 0.6 * tone(x, 1770)) * decay(x, 11) * 0.45
    return saturate(thud * 0.85 + crack * 0.45 + ping)


def hurt():
    """Gracz dostaje. Nizej i dluzej niz trafienie w przeciwnika, zeby dalo sie
    je odroznic bez patrzenia na pasek."""
    x = t(240)
    grunt = sweep(x, 300, 120) * decay(x, 9)
    air = lowpass(noise(x), 1500) * decay(x, 13)
    return saturate(grunt * 0.8 + air * 0.55, 1.8)


def enemy_die():
    """Zgon przeciwnika: zjazd w dol z szumem, wyraznie dluzszy od trafienia."""
    x = t(300)
    body = sweep(x, 520, 90) * decay(x, 7)
    air = lowpass(noise(x), 2000) * decay(x, 9) * 0.5
    return saturate(body * 0.8 + air)


def loot():
    """Podniesienie lupu: dwa tony w gore, czysto. Ma nagradzac, nie zaskakiwac."""
    x = t(170)
    half = len(x) // 2
    a = tone(x, 880) * decay(x, 14)
    b = np.concatenate([np.zeros(half), tone(x[:len(x) - half], 1320) * decay(x[:len(x) - half], 12)])
    return (a * 0.7 + b * 0.8) * attack(x, 2)


def level_up():
    """Awans: trojdzwiek w gore. Jedyny dzwiek, ktory moze byc dlugi."""
    x = t(560)
    seg = len(x) // 3
    out = np.zeros(len(x))
    for i, f in enumerate((523, 659, 988)):  # C5, E5, B5
        s = i * seg
        piece = x[: len(x) - s]
        env = decay(piece, 5) * attack(piece, 4)
        out[s:] += (tone(piece, f) + 0.35 * tone(piece, f * 2)) * env * 0.55
    return out


def ability():
    """Zdolnosc: wjazd w gore, energia. Wspolny dla wszystkich trzech."""
    x = t(260)
    up = sweep(x, 220, 900) * decay(x, 6)
    air = lowpass(noise(x), 3000) * decay(x, 10) * 0.4
    return saturate(up * 0.8 + air)


def drink():
    """Wypicie/zjedzenie: bulgot, kilka nizszych impulsow."""
    x = t(300)
    out = np.zeros(len(x))
    for i, f in enumerate((420, 330, 260)):
        s = int(len(x) * i * 0.22)
        piece = x[: len(x) - s]
        out[s:] += tone(piece, f) * decay(piece, 26) * 0.7
    return saturate(out, 1.6)


def player_die():
    """Smierc gracza: dlugi, niski zjazd. Ma zamykac scene."""
    x = t(850)
    body = sweep(x, 340, 55) * decay(x, 3.2)
    air = lowpass(noise(x), 900) * decay(x, 4) * 0.35
    return saturate(body * 0.85 + air, 1.5)


def ui_click():
    """Klik w interfejsie. Bardzo krotki, bo bedzie slyszany setki razy."""
    x = t(45)
    return lowpass(noise(x), 4200) * decay(x, 45) * 0.5


def howl():
    """Wycie wilka: wolne wejscie w gore, plateau, opad. Jedyny dzwiek w grze,
    ktory zapowiada, ze walka wlasnie sie powiekszyla — wiec moze byc dlugi
    i ma byc slyszalny ponad odglosami ciosow."""
    x = t(900)
    n = len(x)
    # obwiednia wysokosci: 260 -> 520 -> 430 Hz (wjazd, trzymanie, opad)
    f = np.concatenate([
        np.linspace(260, 520, int(n * 0.25)),
        np.linspace(520, 505, int(n * 0.45)),
        np.linspace(505, 300, n - int(n * 0.25) - int(n * 0.45)),
    ])
    voice = np.sin(2 * np.pi * np.cumsum(f) / SR)
    # druga harmoniczna daje "zwierzecy" charakter, sam sinus brzmi jak syrena
    voice += 0.45 * np.sin(2 * np.pi * np.cumsum(f * 2) / SR)
    # lekkie vibrato
    voice *= 1 + 0.06 * np.sin(2 * np.pi * 5.5 * x)
    env = np.minimum(np.linspace(0, 1, n) * 6, 1) * np.concatenate([
        np.ones(int(n * 0.7)), np.linspace(1, 0, n - int(n * 0.7))
    ])
    breath = lowpass(noise(x), 1200) * env * 0.18
    return saturate(voice * env * 0.75 + breath, 1.4)


def growl():
    """Warkniecie: nisko, chropowato, krotko. Gra, kiedy zwierze bierze cie na
    cel — ma byc slyszalne, ale nie zaglusza wyc ani uderzen."""
    x = t(420)
    # dwa bliskie tony nisko + szum = "chropowatosc" bez prawdziwej modelacji
    body = (np.sin(2 * np.pi * 92 * x) + 0.8 * np.sin(2 * np.pi * 118 * x)) * 0.5
    # powolna modulacja amplitudy daje wrazenie oddechu w gardle
    body *= 1 + 0.5 * np.sin(2 * np.pi * 22 * x)
    air = lowpass(noise(x), 900) * 0.5
    env = attack(x, 30) * np.minimum(np.linspace(3, 0, len(x)), 1)
    return saturate((body + air) * env, 2.6)


def charge():
    """Start szarzy dzika: tetent + swist powietrza, narastajaco. Zapowiada, ze
    cos ciezkiego wlasnie ruszylo — komplementarny do czerwonego telegrafu."""
    x = t(520)
    n = len(x)
    # cztery uderzenia kopyt, coraz gestsze
    hoof = np.zeros(n)
    for frac in (0.0, 0.26, 0.47, 0.64, 0.78):
        s = int(n * frac)
        piece = x[: n - s]
        hoof[s:] += sweep(piece, 150, 60) * decay(piece, 40) * 0.9
    rush = lowpass(noise(x), 1600) * np.linspace(0.1, 1.0, n) * 0.55
    return saturate(hoof + rush, 1.8)


def impact():
    """Ciezkie trafienie W GRACZA (szarza dzika, kes Szarego). Nizej i grubiej
    niz zwykle 'hurt' — ma sie odroznic od zwyklego draśniecia."""
    x = t(320)
    thud = sweep(x, 130, 45) * decay(x, 11)
    crack = lowpass(noise(x), 1800) * decay(x, 20) * 0.7
    return saturate(thud * 1.0 + crack, 2.4)


def forest_ambient():
    """Petla tla lasu: wiatr + ptaki + delikatny szelest.

    Nie muzyka. Proceduralna muzyka brzmi jak demo syntezatora, a swiat gry to
    'cieply realizm' — tlo ma byc niezauwazalne, a jego brak ma byc zauwazalny.

    Petla jest zapetlona przez CROSSFADE koncowki z poczatkiem, inaczej na
    szwie slychac klikniecie przy kazdym obrocie.
    """
    seconds = 12.0
    x = t(seconds * 1000)
    n = len(x)

    # WIATR: szum w pasmie 90-700 Hz (patrz band_noise — pasmo dobrane pomiarem).
    wind = band_noise(n, 90, 700)

    # ...i musi ODDYCHAC. Szum o stalej glosnosci ucho czyta jako usterke
    # sprzetu; dopiero narastanie i opadanie czyta sie jako powiew.
    gust = (0.5 + 0.5 * np.sin(2 * np.pi * 0.045 * x)) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.017 * x + 1.3))
    gust = 0.28 + 0.72 * gust
    wind *= gust

    # LISCIE: nie staly szelest (to byl drugi zrodlo sysku), tylko kilka
    # krotkich szelesniec wtedy, kiedy akurat wieje.
    leaves = np.zeros(n)
    for start_s in rng.uniform(0.3, seconds - 2.2, 5):
        s = int(start_s * SR)
        dur = int(rng.uniform(0.5, 1.1) * SR)
        if s + dur >= n:
            continue
        xs = x[:dur]
        env = np.sin(np.pi * np.linspace(0, 1, dur)) ** 2      # lagodny narost i zanik
        # Szelest jest jasniejszy od wiatru, ale wciaz ograniczony z gory —
        # i wystepuje tylko w porywach, wiec nie tworzy stalego tla.
        leaves[s:s + dur] += band_noise(dur, 350, 1800) * env * rng.uniform(0.25, 0.5)

    # PTAKI: pary krotkich swistow. Zostaja wysokie i to jest w porzadku —
    # syk bierze sie ze stalego tla, nie z krotkich zdarzen. Ostatnie 1.8 s
    # wolne, zeby crossfade nie przeciol cwierkniecia w polowie.
    birds = np.zeros(n)
    for start_s in rng.uniform(0.4, seconds - 1.8, 7):
        for offset, pitch in ((0.0, 1.0), (0.11, 1.18)):
            s = int((start_s + offset) * SR)
            dur = int(0.09 * SR)
            if s + dur >= n:
                continue
            xs = x[:dur]
            f0 = rng.uniform(2100, 3000) * pitch
            chirp = sweep(xs, f0, f0 * 1.45) * decay(xs, 26) * attack(xs, 4)
            birds[s:s + dur] += chirp * rng.uniform(0.2, 0.35)

    mix = wind * 0.9 + leaves * 0.35 + birds * 0.5

    # crossfade: ostatnia sekunda wtapia sie w pierwsza
    fade = int(1.0 * SR)
    ramp = np.linspace(0, 1, fade)
    head = mix[:fade].copy()
    mix[:fade] = mix[:fade] * ramp + mix[-fade:] * (1 - ramp)
    mix = mix[:-fade]
    del head
    return mix


def village_ambient():
    """Petla tla wsi: podworze, nie las.

    Powod istnienia: jedno tlo dla calego swiata sprawialo, ze Zagaje brzmialy
    dokladnie tak samo jak las, wiec przejscie przez brame nic nie zmienialo w
    uszach. Tlo jest najtanszym kanalem "to jest inne miejsce", jaki gra ma.

    Te same trzy zasady co przy lesie, bo one nie sa kwestia gustu:
      * szum ksztaltowany W WIDMIE (band_noise), nie bialy przez jeden biegun —
        inaczej wychodzi syk telewizora;
      * tlo musi ODDYCHAC — staly poziom ucho czyta jako usterke sprzetu;
      * petla zszyta CROSSFADE'em, inaczej na szwie klika przy kazdym obrocie.

    Roznica wobec lasu jest celowa i wynika z miejsca:
      * pasmo nizsze i wezsze (70-480 zamiast 90-700) — miedzy chalupami wiatr
        jest lamany, nie ciagly; wies ma brzmiec ciezej i blizej;
      * zamiast ptakow zdarzenia GOSPODARSKIE: mlot kowala z oddali, kury,
        jedno szczekniecie psa. Wszystko krotkie i rzadkie — syk bierze sie ze
        stalego tla, nie ze zdarzen;
      * mlot uderza SERIAMI po trzy z dluga przerwa, bo tak sie kuje. Rowny
        metronom na 14-sekundowej petli zaczyna irytowac po trzecim obrocie.

    Wszystko przepuszczone przez dolnoprzepustowy filtr: te dzwieki dochodza
    zza plotu, a nie spod ucha. To jest ta sama decyzja co glosnosc — tlo
    dziala przez to, ze brakuje go, gdy ucichnie.
    """
    seconds = 14.0
    x = t(seconds * 1000)
    n = len(x)

    air = band_noise(n, 70, 480)
    gust = (0.5 + 0.5 * np.sin(2 * np.pi * 0.037 * x)) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.013 * x + 0.7))
    air *= 0.30 + 0.70 * gust

    # MLOT KOWALA: dwie serie po trzy uderzenia. Dzwon kowadla to kilka
    # nieharmonicznych skladowych, nie jeden sinus — stad trzy czestotliwosci.
    anvil = np.zeros(n)
    for start_s in (1.7, 8.4):
        for k in range(3):
            s = int((start_s + k * 0.42) * SR)
            dur = int(0.36 * SR)
            if s + dur >= n:
                continue
            xs = x[:dur]
            ring = tone(xs, 1180) * 0.6 + tone(xs, 2360) * 0.25 + tone(xs, 3010) * 0.15
            body = lowpass(noise(xs), 900) * decay(xs, 60)
            strike = (ring * decay(xs, 9) + body * 0.8) * attack(xs, 2)
            anvil[s:s + dur] += lowpass(strike, 2000) * rng.uniform(0.18, 0.26)

    # KURY: krotkie gdaknięcia w grupkach po 2-3, opadajacy swist.
    hens = np.zeros(n)
    for start_s in rng.uniform(0.5, seconds - 2.0, 6):
        for k in range(int(rng.integers(2, 4))):
            s = int((start_s + k * rng.uniform(0.13, 0.24)) * SR)
            dur = int(0.10 * SR)
            if s + dur >= n:
                continue
            xs = x[:dur]
            f0 = rng.uniform(520, 760)
            cluck = sweep(xs, f0 * 1.3, f0) * decay(xs, 30) * attack(xs, 5)
            hens[s:s + dur] += saturate(cluck, 1.4) * rng.uniform(0.10, 0.18)

    # PIES: jedno szczekniecie, raz na petle, daleko. Wiecej brzmi jak psiarnia.
    dog = np.zeros(n)
    s = int(11.5 * SR)
    dur = int(0.24 * SR)
    if s + dur < n:
        xs = x[:dur]
        bark = (sweep(xs, 310, 175) * 0.7 + lowpass(noise(xs), 1100) * 0.5) * decay(xs, 22) * attack(xs, 4)
        dog[s:s + dur] += lowpass(bark, 1400) * 0.22

    mix = air * 0.85 + anvil + hens + dog

    # crossfade: ostatnia sekunda wtapia sie w pierwsza (jak w lesie)
    fade = int(1.0 * SR)
    ramp = np.linspace(0, 1, fade)
    mix[:fade] = mix[:fade] * ramp + mix[-fade:] * (1 - ramp)
    return mix[:-fade]


def spit():
    """Plkniecie sieci pajaka: krotki, mokry "tfu" z lekkim wjazdem w gore.
    Cichy — trzy pajaki w gniezdzie strzelaja czesto."""
    x = t(150)
    wet = lowpass(noise(x), 2200) * decay(x, 26)
    up = sweep(x, 420, 900) * decay(x, 20) * 0.5
    return saturate(wet * 0.8 + up, 1.6)


def block():
    """Cios przyjety na tarcze: twarde, krotkie "tuk" drewna spietego zelazem.

    Musi sie ODROZNIAC OD `hurt`, bo pada dokladnie zamiast niego i to jest
    jedyny kanal, ktorym gracz w ogole dowiaduje sie, ze tarcza zadzialala —
    gra nie pokazuje otrzymanych obrazen liczba. Stad trzy rozne rzeczy niz w
    `hurt`: nizej (deska, nie krzyk), krocej (odbicie, nie bol) i z twardym
    atakiem zamiast narastania.

    Dwie warstwy: niski korpus deski (~150 Hz, szybko gasnacy) plus krotki
    metaliczny pstryk okucia wyzej. Bez ogona — dzwiek ma sie skonczyc, zanim
    gracz zdazy uderzyc ponownie, inaczej przy watasze zlewa sie w warkot.
    """
    x = t(130)
    deska = sweep(x, 190, 120) * decay(x, 34) * attack(x, 2)
    okucie = lowpass(noise(x), 3800) * decay(x, 60) * 0.35
    return saturate(deska * 0.9 + okucie, 1.5)


def dodge():
    """Unik: krotkie muzniecie powietrza ubraniem. BEZ tonu i bez metalu.

    ⚠ Musi sie ODROZNIAC OD `swing`, mimo ze oba to "powietrze": `swing` znaczy
    "uderzylem", `dodge` znaczy "wyszedlem spod ciosu". Gdyby brzmialy tak samo,
    gracz nie odroznilby wlasnego zamachu od udanego uniku, a to dwa zupelnie
    inne komunikaty. Stad krocej (90 vs 130 ms), ciszej i wyzej odfiltrowane —
    tkanina, nie ostrze.
    """
    x = t(90)
    n = lowpass(noise(x), 3400)
    body = n * decay(x, 16) * attack(x, 5)
    body *= np.linspace(0.8, 1.0, len(x))   # narasta: ruch OD gracza, nie w gracza
    return body * 0.45


def parry():
    """Parowanie: jasny, krotki brzek stali o stal.

    ⚠ Musi sie ODROZNIAC OD `block`. Oba znacza "nie oberwales", ale innym
    sposobem: `block` to tarcza (deska + okucie, nisko), `parry` to ostrze o
    ostrze (wysoko, dzwoni). Bez tej roznicy gracz nie wie, ktora jego
    umiejetnosc zadzialala — a parowanie jest wlasnoscia rodziny broni
    (`WEAPON_FAMILY.*.parryBonus`), wiec informacja zwrotna o nim jest jedynym
    kanalem, ktorym widac, ze wybor broni cos zmienil.
    """
    x = t(150)
    dzwon = (tone(x, 2100) * 0.5 + tone(x, 3150) * 0.35 + tone(x, 4700) * 0.2)
    dzwon *= decay(x, 26) * attack(x, 1)
    iskra = lowpass(noise(x), 7000) * decay(x, 90) * 0.4
    return saturate(dzwon * 0.8 + iskra, 1.4)


SOUNDS = {
    "swing": swing,
    "hit": hit,
    "crit": crit,
    "hurt": hurt,
    "enemy-die": enemy_die,
    "loot": loot,
    "level-up": level_up,
    "ability": ability,
    "drink": drink,
    "player-die": player_die,
    "ui-click": ui_click,
    "howl": howl,
    "spit": spit,
    "growl": growl,
    "charge": charge,
    "impact": impact,
    "forest-ambient": forest_ambient,
    # DOPISUJ NA KONCU. Seed jest staly, ale rng jest WSPOLNY dla wszystkich
    # generatorow i konsumowany w kolejnosci tego slownika — wstawienie wpisu
    # w srodku przesunelo by strumien i zmienilo kazdy plik ponizej, mimo ze
    # nikt nie ruszal ich kodu.
    "village-ambient": village_ambient,
    "block": block,
    "dodge": dodge,
    "parry": parry,
}

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    print("Generuje %d dzwiekow do %s" % (len(SOUNDS), os.path.normpath(OUT)))
    for name, fn in SOUNDS.items():
        save(name, fn())
    print("Gotowe.")
