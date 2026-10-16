# -*- coding: utf-8 -*-
"""
Wyśrodkowanie ikony przedmiotu w jej polu — wspólny krok WSZYSTKICH
generatorów ikon (decyzja autora 2026-10-02: „wyśrodkuj w polach ogólnie
przedmioty, spójność to podstawa").

⭐ Przesunięcie jest CAŁKOWITE: żaden piksel rysunku się nie zmienia, zmienia
się wyłącznie jego położenie w płótnie. Dlatego generatory sprawdzają kształt
(długość, zamrożone SHA1, dziury) PRZED wyśrodkowaniem, a położenie PO nim.

⚠ Do 2026-10-02 broń kotwiczyła koniec rękojeści w prawym dolnym rogu (relikt
2D-rigu broni w dłoni, `PLAYER.swing.gripOrigin`) — krótka broń 1×2 leżała
w dolnej połowie kafla z pustą górą. Tarcze, pancerz i jedzenie były
wyśrodkowane od początku.

Miara: środek PROSTOKĄTA OBRYSU (alfa > 0, razem z konturem) w środku płótna,
tolerancja 0,5 px — przy nieparzystym boku obrysu dokładny środek nie istnieje.
"""
import numpy as np

TOLERANCJA = 0.5


def odchylenie(arr):
    """(dx, dy) środka obrysu od środka płótna, w px."""
    a = arr[..., 3] > 0
    ys, xs = np.nonzero(a)
    H, W = a.shape
    return ((xs.min() + xs.max()) / 2 - (W - 1) / 2,
            (ys.min() + ys.max()) / 2 - (H - 1) / 2)


def wysrodkuj(arr):
    """Kopia `arr` przesunięta o całkowite (dx, dy) tak, żeby środek obrysu
    trafił najbliżej środka płótna. Nic nie wychodzi poza płótno."""
    a = arr[..., 3] > 0
    ys, xs = np.nonzero(a)
    H, W = a.shape
    ox, oy = odchylenie(arr)
    dx = -int(round(ox))
    dy = -int(round(oy))
    dx = max(-xs.min(), min(W - 1 - xs.max(), dx))
    dy = max(-ys.min(), min(H - 1 - ys.max(), dy))
    out = np.zeros_like(arr)
    out[ys + dy, xs + dx] = arr[ys, xs]
    return out


def bledy_srodka(ikony):
    """Lista błędów dla słownika {nazwa: arr}: ikona poza środkiem pola."""
    out = []
    for nazwa, arr in ikony.items():
        ox, oy = odchylenie(arr)
        if abs(ox) > TOLERANCJA or abs(oy) > TOLERANCJA:
            out.append(f"{nazwa}: niewyśrodkowana — środek obrysu ({ox:+.1f}, {oy:+.1f}) px "
                       f"od środka pola (tolerancja {TOLERANCJA})")
    return out
