"""Twarze pixel-art bez portretu 2D (2026-10-10) -> characters/player_face.png, innkeeper_face.png,
ciechan_face.png, bolko_face.png, zbych_face.png (drwale, K5 Zagajów)

Uruchom:  python tools/build_player_face.py            (przymiar: podgląd ASCII, NIC nie zapisuje)
          python tools/build_player_face.py --zapisz   (zapisuje PNG)

Mieszkańcy mają twarz z PORTRETU 2D (`npc3d`, rzut `char3d_face`); gracz
portretu nie ma, więc jego twarz jest postawiona ręcznie według referencji
autora (zdjęcia realnej osoby — NIE w repo): szczupła, podłużna twarz, mocna
żuchwa, krótki zarost na żuchwie i brodzie, gęste ciemne brwi, lekki uśmiech,
ciemnobrązowe włosy podniesione do góry. Bez okularów.

⭐ Kontrakt rzutu (`char3d_face.naloz_twarz`): oś twarzy DOKŁADNIE na środku
obrazka (x = W/2), bo głowa gracza ma modyfikator lustra z odbiciem UV —
druga połowa twarzy dostaje odbitą połowę obrazka. Rysunek jest więc
SYMETRYCZNY z definicji (lewa połowa + lustro). Kalibracja: `TWARZ` niżej.
⭐ Skóra = `char3d_zones.PAL["skin"]`: ten sam kolor po obu stronach brzegu
tekstury, więc szwu nie widać (ta sama zasada co `npc3d._skora_z_portretu`).
"""
import os
import struct
import sys
import zlib

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Kalibracja dla rzutu: podbródek t = 0 → wiersz 25, ~23 px na wysokość głowy.
# ⚠ `oczy_y` 13,5, a oczy narysowane w 15: rysy ŚCIŚNIĘTE W DÓŁ o ~2 rzędy
#   (oczy na t ≈ 0,41 zamiast 0,50). Głowa bazy ma objętość włosów, która nad
#   czołem robi DASZEK — z kamery 40° chował brwi i górę oczu (render z gry,
#   zbliżenie 4×). Włosów bazy nie ruszamy (zmieniłoby mieszkańców).
TWARZ = dict(portret="player_face.png", srodek_x=12.0, oczy_y=13.5, broda_y=25.0, pol_szer=8.0)

S = (253, 176, 132)          # skóra = PAL["skin"]
KOLORY = {
    "S": S,
    "H": (255, 192, 150),    # światło (czoło, kość policzkowa)
    "1": (226, 150, 112),    # cień skóry (oczodół, bok nosa)
    "2": (196, 124, 94),     # głębszy cień (nozdrze, szyja pod żuchwą)
    "B": (55, 38, 29),       # włosy i brwi = PAL["hair"]
    "D": (92, 64, 48),       # brew — jaśniejszy brzeg
    "W": (240, 226, 214),    # białko oka
    "E": (40, 28, 24),       # tęczówka/źrenica (ciemna — czyta się przy 2 px)
    "M": (150, 84, 72),      # usta
    "Z": None,               # zarost: szachownica dwóch tonów (faktura kilkudniowego zarostu)
}
ZAROST = ((146, 98, 78), (184, 126, 98))   # kontrast mocniejszy — 170/196 ginęło w grze

# LEWA połowa (kolumny 0..11, kolumna 11 przylega do osi), wiersze 0..27.
LEWA = [
    "BBBBBBBBBBBB",  # 0  włosy (nad linią włosów rzut ich nie bierze — dla porządku)
    "BBBBBBBBBBBB",  # 1
    "BBBBBBBBBBBB",  # 2
    "BBBBBBBBBBBB",  # 3
    "BBBBBBBBBBBB",  # 4
    "BBBBBBBBBBBB",  # 5
    "BBBBBBBBBBBB",  # 6
    "BBBBBBBBBBBB",  # 7
    "BBBBBBBBBBBB",  # 8
    "SBBBBBBBBBBB",  # 9  krótkie boki — skroń wcześniej niż środek
    "SSSBBBBBBBBB",  # 10 linia włosów (t ≈ 0,65)
    "SSSSSSSSSSSS",  # 11 czoło — pod daszkiem grzywki, z kamery zwykle niewidoczne
    "SSSSSSHHSSSS",  # 12
    "SSSSSSDBBDSS",  # 13 brwi — gęste, ciemne, krótkie (2 rzędy)
    "SSSSSDBBBBSS",  # 14
    "SSSSS1WEE1SS",  # 15 oczy — blisko osi (boki głowy uciekają od kamery)
    "SSSSSS1111SS",  # 16 cień pod okiem
    "SSSSSHHSSS1S",  # 17 kość policzkowa, bok nosa
    "ZSSSSSSSSS1S",  # 18
    "ZZSSSSSSSS12",  # 19 nozdrze
    "ZZZSSSSSSSSS",  # 20
    "ZZZZSSSSMSZZ",  # 21 kącik ust w górę (uśmiech), wąs — zarost
    "ZZZZZSSSSMMM",  # 22 usta
    "ZZZZZZSSSSSS",  # 23 dolna warga jasna
    "ZZZZZZZZZZZZ",  # 24 broda — zarost
    "1ZZZZZZZZZZZ",  # 25 podbródek
    "111122222222",  # 26 cień pod żuchwą
    "SSSSSSSSSSSS",  # 27 szyja
]


# ── BOGUSZ, karczmarz (2026-10-10): pełna, okrągła twarz, gładko ogolony,
#   rumiane policzki, szeroki nos, szeroki uśmiech, jaśniejsze brwi. Ta sama
#   kalibracja co gracz (głowa bazy z tym samym daszkiem czupryny).
#   Skóra NIE musi być PAL — mieszkaniec bierze skórę modelu z policzków
#   tej tekstury (`npc3d._skora_z_portretu`), więc szwu i tak nie będzie.
TWARZ_BOGUSZ = dict(portret="innkeeper_face.png", srodek_x=12.0, oczy_y=13.5, broda_y=25.0, pol_szer=8.0)
KOLORY_BOGUSZ = dict(KOLORY, **{
    "S": (240, 166, 128), "H": (250, 186, 148), "1": (214, 140, 104), "2": (184, 112, 84),
    "B": (104, 72, 50), "D": (132, 94, 68), "R": (232, 132, 108),     # R: rumieniec
})
LEWA_BOGUSZ = [
    "BBBBBBBBBBBB",  # 0
    "BBBBBBBBBBBB",  # 1
    "BBBBBBBBBBBB",  # 2
    "BBBBBBBBBBBB",  # 3
    "BBBBBBBBBBBB",  # 4
    "BBBBBBBBBBBB",  # 5
    "BBBBBBBBBBBB",  # 6
    "BBBBBBBBBBBB",  # 7
    "BBBBBBBBBBBB",  # 8
    "SBBBBBBBBBBB",  # 9
    "SSSBBBBBBBBB",  # 10
    "SSSSSSSSSSSS",  # 11
    "SSSSSSHHSSSS",  # 12
    "SSSSSSDDDDSS",  # 13 brwi — jaśniejsze, jeden rząd
    "SSSSSSSSSSSS",  # 14
    "SSSSS1WEE1SS",  # 15 oczy
    "SSSSSS1111SS",  # 16
    "SSSSRRSSSS1S",  # 17 rumiane policzki
    "SSSRRRSSSS12",  # 18 szeroki nos
    "SSSSRSSSS122",  # 19
    "SSSSSSSSSSSS",  # 20
    "SSSSSSSMSSSS",  # 21 kąciki szerokiego uśmiechu w górę
    "SSSSSSSSMMMM",  # 22 usta
    "SSSSSSSSSSSS",  # 23
    "SSSSSSS1111S",  # 24 cień pod wargą — pełny podbródek
    "1SSSSSSSSSSS",  # 25 podbródek
    "111122222222",  # 26 podwójny podbródek w cieniu
    "SSSSSSSSSSSS",  # 27
]

# ── DRWALE (K5, 2026-10-10): ojciec Ciechan z synami Bolkiem i Zbychem — rozpoznawalni
#   jako RODZINA (ta sama szczęka i nos), różni WIEKIEM: siwy zarost i głęboko osadzone
#   oczy ojca, ciemna broda starszego syna, gładka twarz z piegami młodszego.
#   `Z` może mieć własną parę tonów (`KOLORY["Z"]`) — siwy zarost Ciechana.
def _kal(nazwa):
    return dict(portret=f"{nazwa}_face.png", srodek_x=12.0, oczy_y=13.5, broda_y=25.0, pol_szer=8.0)


KOLORY_CIECHAN = dict(KOLORY, **{
    "S": (214, 146, 108), "H": (226, 162, 124), "1": (184, 118, 86), "2": (156, 98, 70),
    "B": (150, 140, 128), "D": (124, 114, 104), "M": (140, 80, 66),
    "Z": ((132, 124, 116), (172, 164, 154)),
})
LEWA_CIECHAN = [
    *["BBBBBBBBBBBB"] * 9,  # 0–8
    "SBBBBBBBBBBB",  # 9
    "SSSBBBBBBBBB",  # 10
    "SSSSSSSSSSSS",  # 11
    "SSSS1SSSS1SS",  # 12 bruzdy na czole
    "SSSSSDBBBBSS",  # 13 krzaczaste, siwe brwi
    "SSSSS11111SS",  # 14 głęboko osadzone oczy — cień pod brwią
    "SSSSS1WEE1SS",  # 15
    "SSSS1S1111SS",  # 16 kurze łapki
    "SSSSSHHSSS1S",  # 17
    "ZSSSSSSSSS1S",  # 18
    "ZZSSSSSSSS12",  # 19
    "ZZZSSSSSSSSS",  # 20
    "ZZZZSSSSZZZZ",  # 21 wąs
    "ZZZZZSSSMMMM",  # 22 usta — prosta kreska, bez uśmiechu
    "ZZZZZZSSZZZZ",  # 23
    "ZZZZZZZZZZZZ",  # 24
    "1ZZZZZZZZZZZ",  # 25
    "111122222222",  # 26
    "SSSSSSSSSSSS",  # 27
]
KOLORY_BOLKO = dict(KOLORY, **{
    "S": (222, 156, 116), "H": (234, 172, 132), "1": (194, 128, 94), "2": (166, 106, 78),
    "B": (92, 62, 40), "D": (116, 82, 56),
    "Z": ((104, 72, 52), (140, 98, 72)),
})
LEWA_BOLKO = [
    *["BBBBBBBBBBBB"] * 9,
    "SBBBBBBBBBBB",  # 9
    "SSSBBBBBBBBB",  # 10
    "SSSSSSSSSSSS",  # 11
    "SSSSSSHHSSSS",  # 12
    "SSSSSDBBBBSS",  # 13 proste, ciemne brwi
    "SSSSSSSSSSSS",  # 14
    "SSSSS1WEE1SS",  # 15
    "SSSSSS1111SS",  # 16
    "SSSSSHHSSS1S",  # 17
    "ZSSSSSSSSS1S",  # 18
    "ZZSSSSSSSS12",  # 19
    "ZZZSSSSSSSSS",  # 20
    "ZZZZSSSSSSZZ",  # 21
    "ZZZZZSSSMMMM",  # 22
    "ZZZZZZSSSSSS",  # 23
    "ZZZZZZZZZZZZ",  # 24 krótka broda
    "1ZZZZZZZZZZZ",  # 25
    "111122222222",  # 26
    "SSSSSSSSSSSS",  # 27
]
KOLORY_ZBYCH = dict(KOLORY, **{
    "S": (238, 172, 132), "H": (248, 188, 150), "1": (210, 142, 104), "2": (180, 114, 82),
    "B": (168, 128, 76), "D": (146, 108, 66), "F": (212, 130, 94),     # F: piegi
})
LEWA_ZBYCH = [
    *["BBBBBBBBBBBB"] * 9,
    "SBBBBBBBBBBB",  # 9
    "SSBBBBBBBBBB",  # 10 grzywka niżej
    "SSSSSSSSSSSS",  # 11
    "SSSSSSHHSSSS",  # 12
    "SSSSSSDDDDSS",  # 13 jasne brwi
    "SSSSSSSSSSSS",  # 14
    "SSSSS1WEE1SS",  # 15
    "SSSSSS1111SS",  # 16
    "SSSSFSFSSS1S",  # 17 piegi
    "SSSSSFSSSS1S",  # 18
    "SSSSSSSSSS12",  # 19
    "SSSSSSSSSSSS",  # 20
    "SSSSSSSSMSSS",  # 21 lekki uśmiech
    "SSSSSSSSSMMM",  # 22
    "SSSSSSSSSSSS",  # 23
    "SSSSSSSSSSSS",  # 24 gładko ogolony
    "1SSSSSSSSSSS",  # 25
    "111122222222",  # 26
    "SSSSSSSSSSSS",  # 27
]

TWARZE = [("gracz", LEWA, KOLORY, TWARZ, True), ("Bogusz", LEWA_BOGUSZ, KOLORY_BOGUSZ, TWARZ_BOGUSZ, False),
          ("Ciechan", LEWA_CIECHAN, KOLORY_CIECHAN, _kal("ciechan"), False),
          ("Bolko", LEWA_BOLKO, KOLORY_BOLKO, _kal("bolko"), False),
          ("Zbych", LEWA_ZBYCH, KOLORY_ZBYCH, _kal("zbych"), False)]


def obraz(lewa=None, kolory=None):
    lewa = lewa or LEWA
    kolory = kolory or KOLORY
    W, H = 24, len(lewa)
    px = []
    for y, wiersz in enumerate(lewa):
        assert len(wiersz) == 12, (y, wiersz)
        pelny = wiersz + wiersz[::-1]
        r = []
        for x, ch in enumerate(pelny):
            if ch == "Z":
                dx = x if x < 12 else 23 - x          # od osi — szachownica symetryczna
                kol = (kolory.get("Z") or ZAROST)[(dx + y) % 2]
            else:
                kol = kolory[ch]
            r.append(kol)
        px.append(r)
    return W, H, px


def zapisz_png(sciezka, W, H, px):
    surowe = b"".join(b"\x00" + bytes(c for kol in wiersz for c in (*kol, 255)) for wiersz in px)
    def blok(typ, dane):
        return struct.pack(">I", len(dane)) + typ + dane + struct.pack(">I", zlib.crc32(typ + dane) & 0xFFFFFFFF)
    png = (b"\x89PNG\r\n\x1a\n" + blok(b"IHDR", struct.pack(">IIBBBBB", W, H, 8, 6, 0, 0, 0))
           + blok(b"IDAT", zlib.compress(surowe, 9)) + blok(b"IEND", b""))
    open(sciezka, "wb").write(png)


def main():
    bledy_razem = 0
    for nazwa, lewa, kolory, tw, skora_pal in TWARZE:
        W, H, px = obraz(lewa, kolory)
        # samokontrola: symetria wokół osi; gracz — skóra = PAL (brak szwu)
        bledy = [f"wiersz {y} niesymetryczny" for y, r in enumerate(px) if r != r[::-1]]
        if skora_pal and kolory["S"] != (253, 176, 132):
            bledy.append("skóra różna od PAL['skin'] — na brzegu tekstury będzie szew")
        print(f"── {nazwa}")
        for y, wiersz in enumerate(lewa):
            print(f"{y:2d} {wiersz + wiersz[::-1]}")
        print(f"[twarz {nazwa}] {W}×{H}, kalibracja {tw}")
        for b in bledy:
            print("BŁĄD:", b)
        bledy_razem += len(bledy)
        if not bledy and "--zapisz" in sys.argv:
            cel = os.path.join(ROOT, "public", "assets", "characters", tw["portret"])
            zapisz_png(cel, W, H, px)
            print("[zapis]", cel)
    if bledy_razem:
        sys.exit(1)
    if "--zapisz" not in sys.argv:
        print("Nic nie zapisano — użyj --zapisz.")


if __name__ == "__main__":
    main()
