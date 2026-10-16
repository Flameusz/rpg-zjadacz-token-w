/**
 * Pomiar klatek — narzędzie DEWELOPERSKIE, nie mechanika.
 *
 * ⚠ **Powstało, bo „trochę tnie" nie jest danymi.** Ścinanie ma co najmniej trzy
 * różne przyczyny, które wymagają trzech różnych napraw i wyglądają tak samo:
 *
 *  • **niskie stałe FPS** — za dużo pracy w każdej klatce (rysowanie, AI, kafle);
 *  • **zacięcia (hitche)** — pojedyncze klatki po 30–100 ms przy średniej 16 ms;
 *    to zwykle GC albo wysyłka tekstury na GPU, a średnia ich NIE POKAZUJE;
 *  • **dławienie przeglądarki** — nieaktywna karta, oszczędzanie energii.
 *
 * Dlatego raport podaje **percentyle i licznik zacięć**, a nie samo FPS. Średnia
 * 58 FPS przy dwudziestu klatkach po 40 ms czyta się jako „jest dobrze", a gra
 * w tym czasie szarpie.
 *
 * ⚠ **Nakładka jest elementem DOM, nie obiektem Phasera, i to jest celowe.**
 * Napis Phasera rysowałby się w tej samej liście wyświetlania i wysyłał własną
 * teksturę — czyli dokładał tę pracę, której szukamy. Miernik ma nie wchodzić
 * w mierzone.
 *
 * Cały plik znika z buildu produkcyjnego (`import.meta.env.DEV` w `main.ts`).
 *
 * Użycie z konsoli:
 *   dev.perf.overlay()        — włącz/wyłącz licznik na ekranie
 *   dev.perf.watch(10)        — zbieraj 10 s i wypisz raport
 *   dev.perf.scene()          — co siedzi na scenie (rozmiar listy, tweeny, teksty)
 */

import Phaser from "phaser";

interface Raport {
  klatek: number;
  sekund: number;
  fpsSrednie: number;
  msP50: number;
  msP95: number;
  msP99: number;
  msNajgorsza: number;
  /** Klatki dłuższe niż dwie ramki 60 Hz — widoczne szarpnięcie. */
  zaciec33: number;
  /** Klatki dłuższe niż 100 ms — zauważalne przycięcie. */
  zaciec100: number;
}

/** Ile klatek trzyma okno przesuwne nakładki. 120 = ~1,2 s przy 100 Hz. */
const OKNO = 120;
/**
 * Co ile milisekund nakładka przemalowuje napis.
 *
 * ⚠ **To jest granica CZYTELNOŚCI, nie próg wydajności** — uzasadnienie przy
 * `rysuj()`. Zejście z tym do zera przywraca błąd, którym ten plik świecił
 * w trace 2026-08-23.
 */
const RYSUJ_MS = 250;

class PerfProbe {
  private gra?: Phaser.Game;
  private probki: number[] = [];
  private zbiera = false;
  private el?: HTMLDivElement;
  private hook?: () => void;
  /** Okno przesuwne dla nakładki — osobne od `probki`, bo tamte służą raportowi. */
  private okno: number[] = [];
  /** Bufor roboczy sortowania, alokowany RAZ — patrz komentarz przy `rysuj`. */
  private sortBuf: number[] = [];
  /** `gra.loop.now` ostatniego przemalowania nakładki. */
  private ostatnieRysowanie = 0;
  /** Ostatnio ZAPISANY kolor napisu — żeby nie pisać w DOM tej samej wartości.
   *  Ten sam wzorzec, co `painted*` w widżetach (`src/ui/CLAUDE.md`). */
  private ostatniKolor = "";

  attach(gra: Phaser.Game): void {
    this.gra = gra;
    this.hook = () => this.tick();
    gra.events.on(Phaser.Core.Events.POST_STEP, this.hook);
  }

  private tick(): void {
    const dt = this.gra?.loop.delta ?? 0;
    // ⚠ Pierwsza klatka po wznowieniu potrafi mieć setki milisekund (karta była
    // schowana). To nie jest wynik gry i wpisane do próbek psuje percentyle.
    if (dt <= 0 || dt > 1000) return;
    if (this.zbiera) this.probki.push(dt);
    this.okno.push(dt);
    if (this.okno.length > OKNO) this.okno.shift();
    // ⚠ Nakładka przemalowuje się CO `RYSUJ_MS`, nie co klatkę — patrz `rysuj`.
    if (!this.el) return;
    const teraz = this.gra?.loop.now ?? 0;
    if (teraz - this.ostatnieRysowanie < RYSUJ_MS) return;
    this.ostatnieRysowanie = teraz;
    this.rysuj();
  }

  /**
   * Przemaluj nakładkę. **Woła się to co `RYSUJ_MS`, nie co klatkę** — i to jest
   * poprawka błędu, który ten plik sam popełniał.
   *
   * ⚠ **Miernik był najdroższą funkcją całego kodu gry.** Trace z 2026-08-23:
   * `rysuj` miał **404 ms self time**, czyli 1% czasu zegara i więcej niż cała
   * reszta `/src/` razem wzięta — przy 1,1%, jakie zajmowała wtedy AI, walka,
   * fizyka i UI łącznie. Trzy przyczyny, wszystkie po ~100 razy na sekundę:
   * kopia okna pod sortowanie (`[...this.okno]`), druga tablica z `filter`,
   * oraz **zapis do DOM**, który unieważnia styl całej strony (w tym samym
   * trace: 537 × `ScheduleStyleRecalculation`, 529 × `InvalidateLayout`).
   *
   * Nagłówek tego pliku obiecuje, że „miernik ma nie wchodzić w mierzone".
   * Wersja rysująca co klatkę tej obietnicy nie dotrzymywała.
   *
   * ⚠ **Ćwierć sekundy jest granicą CZYTELNOŚCI, nie oszczędności.** Liczby
   * odświeżane 100 razy na sekundę i tak są nie do odczytania — okno jest
   * przesuwne po `OKNO` klatkach, więc wartości zmieniają się płynnie i
   * rzadszy zapis nie gubi żadnego zacięcia, tylko przestaje migotać.
   */
  private rysuj(): void {
    if (!this.el || this.okno.length === 0) return;
    // Bufor roboczy zamiast `[...this.okno]`: alokacja raz na życie sondy,
    // a nie raz na przemalowanie.
    const pos = this.sortBuf;
    pos.length = 0;
    let suma = 0;
    let zaciec = 0;
    for (const d of this.okno) {
      pos.push(d);
      suma += d;
      if (d > 33) zaciec++;
    }
    pos.sort((a, b) => a - b);
    const p95 = pos[Math.min(pos.length - 1, Math.floor(pos.length * 0.95))];
    const sr = suma / this.okno.length;
    // ⚠ p95 obok średniej, nie zamiast — różnica między nimi JEST diagnozą:
    // blisko siebie = równe, stałe obciążenie; daleko = zacięcia.
    this.el.textContent =
      `${(1000 / sr).toFixed(0)} fps   śr ${sr.toFixed(1)} ms   p95 ${p95.toFixed(1)} ms   ` +
      `zacięć/2s ${zaciec}`;
    const kolor = p95 > 33 ? "#ff7b7b" : p95 > 22 ? "#ffd45e" : "#8ce99a";
    if (kolor !== this.ostatniKolor) {
      this.ostatniKolor = kolor;
      this.el.style.color = kolor;
    }
  }

  /** Włącz/wyłącz licznik w rogu ekranu. Zwraca nowy stan. */
  overlay(): boolean {
    if (this.el) {
      this.el.remove();
      this.el = undefined;
      return false;
    }
    const d = document.createElement("div");
    d.style.cssText =
      "position:fixed;left:6px;top:6px;z-index:99999;font:12px/1.4 monospace;" +
      "background:rgba(0,0,0,.62);padding:3px 7px;border-radius:4px;" +
      "pointer-events:none;white-space:nowrap";
    document.body.appendChild(d);
    this.el = d;
    // ⚠ Nowy element nie ma jeszcze ŻADNEGO koloru, więc pamięć po poprzedniej
    // nakładce zdusiłaby pierwszy zapis i napis wyszedłby domyślnie biały.
    // Zerowanie znacznika czasu jest z tego samego powodu: pierwszy `tick`
    // po włączeniu ma przemalować od razu, nie za ćwierć sekundy.
    this.ostatniKolor = "";
    this.ostatnieRysowanie = 0;
    this.rysuj();
    return true;
  }

  /** Zbieraj przez `sekund` i wypisz raport. */
  watch(sekund = 10): Promise<Raport> {
    this.probki = [];
    this.zbiera = true;
    console.log(`[perf] zbieram ${sekund} s — GRAJ, nie stój.`);
    return new Promise((res) => {
      setTimeout(() => {
        this.zbiera = false;
        const r = this.raport();
        console.table(r);
        if (r.zaciec33 > 0) {
          console.log(
            `[perf] ${r.zaciec33} zacięć >33 ms (${((100 * r.zaciec33) / r.klatek).toFixed(1)}% klatek). ` +
            "Przy niskiej średniej to zwykle GC albo wysyłka tekstury (nowy obiekt Text), nie „za dużo rysowania”.",
          );
        }
        res(r);
      }, sekund * 1000);
    });
  }

  private raport(): Raport {
    const p = [...this.probki].sort((a, b) => a - b);
    const kw = (q: number) => (p.length ? p[Math.min(p.length - 1, Math.floor(p.length * q))] : 0);
    const suma = p.reduce((a, b) => a + b, 0);
    return {
      klatek: p.length,
      sekund: +(suma / 1000).toFixed(2),
      fpsSrednie: p.length ? +(1000 / (suma / p.length)).toFixed(1) : 0,
      msP50: +kw(0.5).toFixed(2),
      msP95: +kw(0.95).toFixed(2),
      msP99: +kw(0.99).toFixed(2),
      msNajgorsza: +(p[p.length - 1] ?? 0).toFixed(2),
      zaciec33: p.filter((d) => d > 33).length,
      zaciec100: p.filter((d) => d > 100).length,
    };
  }

  /**
   * Co siedzi na scenie. **Rozmiar listy wyświetlania i liczba obiektów `Text`
   * to dwie liczby, od których zaczyna się każde śledztwo o wydajność** —
   * pierwsza kosztuje w każdej klatce (sortowanie po głębokości), druga
   * kosztuje skokowo (każdy nowy napis to własne płótno i wysyłka na GPU).
   */
  scene(): Record<string, number> {
    const out: Record<string, number> = {};
    for (const s of this.gra?.scene.getScenes(true) ?? []) {
      const lista = s.children.list;
      const licz = (typ: string) => lista.filter((o) => o.type === typ).length;
      out[`${s.scene.key}/obiekty`] = lista.length;
      out[`${s.scene.key}/Text`] = licz("Text");
      out[`${s.scene.key}/Graphics`] = licz("Graphics");
      out[`${s.scene.key}/Container`] = licz("Container");
      out[`${s.scene.key}/tweeny`] = s.tweens.getTweens().length;
      // Zdarzenia czasowe: `flashHit` planuje jedno na KAZDE trafienie, wiec
      // rosnaca liczba przy stalej walce znaczy, ze cos ich nie sprzata.
      out[`${s.scene.key}/timery`] = (s.time as unknown as { _active: unknown[] })._active?.length ?? -1;
    }
    const tex = this.gra?.textures.list ?? {};
    out["tekstur w cache"] = Object.keys(tex).length;
    return out;
  }
}

export const Perf = new PerfProbe();
