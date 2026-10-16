import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import type Phaser from "phaser";
import { DEPTH, ITEMS, PLAYER, STYL_POSTACI } from "../config/GameConfig";
import { Equipment } from "../core/Equipment";
import { Progression } from "../core/Progression";
import { ySortedWorldFor } from "../core/YSortedWorld";
import { dodajSwiatlo, renderujDo, skalaSwiata, swiat3d, wSwiecie, wspolnyRenderer, zeSwiata } from "./Shared3D";

/**
 * **POSTAĆ GRACZA — model 3D renderowany w czasie rzeczywistym.**
 *
 * ⚠ **To jest domyślna postać od 2026-09-09**, nie eksperyment: tworzy ją
 * `GameScene` przy starcie, a `Player` gasi wtedy swój sprite 2D
 * (`setVisualOverride`). Decyzja i pomiary, które za nią stoją:
 * `docs/decyzje/2026-09-08-postac-3d-jako-zrodlo.md`. Powodem był RUCH, nie
 * wygląd — arkusz kwantuje animację do liczby klatek i skacze na przejściach,
 * model interpoluje i obraca się pod dowolny kąt.
 *
 * ⚠ **Arkusz 2D nadal jest ścieżką awaryjną i musi nią zostać.** Gdy `char.glb`
 * się nie wczyta, `GameScene` zostaje przy `Character.png` — to ten sam
 * niezmiennik, co przy brakującym PNG czy dźwięku: gra ZAWSZE się uruchamia.
 *
 * ── Dlaczego RENDER DO TEKSTURY, a nie druga warstwa ──────────────────────
 * ⚠ Oczywiste podejście — dołożyć drugi canvas z three.js nad canvas Phasera —
 * **rozbija przesłanianie i to jest zabójcze dla tej gry**. Świat rysuje się
 * przez jedną warstwę `Y_SORTED_WORLD`, w której pnie drzew, dekoracje
 * „do przejścia za" i wszystkie encje przeplatają się co klatkę przez
 * `setDepth(DEPTH.entities + y)`. Postać na osobnym canvasie jest wobec tej
 * warstwy PŁASKA: albo zawsze nad światem, albo zawsze pod nim — czyli nigdy
 * nie wejdzie za drzewo. Istnieje na to osobny moduł (`PlayerSilhouette`),
 * więc problem jest realny, nie teoretyczny.
 *
 * Dlatego three.js renderuje do WŁASNEGO, offscreenowego canvasa, a Phaser
 * dostaje z niego zwykłą teksturę i rysuje ją jako `Image` **wpięty do tej
 * samej warstwy Y-sortowanej**. Przesłanianie działa dalej, bo dla Phasera to
 * jest po prostu duszek.
 *
 * ⚠ **Cena siedzi dokładnie w tym moście.** Każda klatka to rysowanie
 * skinowanego mesha PLUS wysyłka całej tekstury na GPU. To jest ta praca,
 * której szuka `dev.perf.watch` — i to ona, a nie liczba wierzchołków,
 * decyduje, czy to podejście nadaje się na telefon.
 *
 * ── Co ten spike pokazuje, czego arkusz nie umie ──────────────────────────
 * Postać obraca się PŁYNNIE pod kąt ruchu, a nie skokowo do jednego z czterech
 * kierunków. Animacja jest interpolowana z 4 klatek kluczowych, więc jej
 * płynność nie zależy od liczby wyrenderowanych klatek.
 */

/**
 * Rozmiar bufora renderu. Im większy, tym droższa wysyłka tekstury co klatkę —
 * a to jest GŁÓWNY koszt tego podejścia, więc szerokość dobiera się z pomiaru,
 * nie z zapasu.
 *
 * ⚠ **Szerokość jest podyktowana BRONIĄ, nie postacią.** Przy 128 px kadr
 * mieścił ciało, ale broń dwuręczna trzymana ukośnie była UCINANA lewą
 * krawędzią (zmierzone: topór bojowy 51 px krawędzi, młot 33, włócznia 17).
 * Poszerzania kadru bez poszerzenia bufora zrobić się nie da: kamera musi mieć
 * ten sam stosunek boków co bufor, inaczej postać wychodzi ściśnięta w poziomie.
 *
 * ⚠⚠ **96 → 192 (2026-10-03).** Przy 96 px broń dwuręczna w chwycie
 * oburęcznym była UCINANA przy każdym zwrocie bokiem — zmierzone w żywej grze
 * na atrapie młota bojowego: piksele na krawędzi bufora przy 45°–135°
 * i 225°–315°, a cios mieczem w profilu dotykał x = 0 / 95 i y = 0. Nikt tego
 * nie widział, bo nikt tego nie mierzył. Dziś pilnuje bramka
 * `tools/char3d_sprawdz_bron.py` (kolumny „rama"), czytająca te stałe z tego
 * pliku. 192 mieści noszenie całego rosteru razem z piką (najdłuższa: 11,4 j.
 * od osi wobec 11,6 j. połowy kadru).
 * Koszt zmierzony na desktopie (300 klatek): 96×128 p50 0,7 / p95 1,2 ms,
 * 192×128 p50 0,5 / p95 1,1 ms — w granicach szumu. ⏳ Na telefonie
 * NIEPOTWIERDZONE (etap A, runtime test S21 FE).
 *
 * ⚠ **Wysokość 128 → 160 (2026-10-03), cały przyrost NAD głową.** W zamachu
 * (`Attack`, klatka 1) głownia jednoręczna staje pionowo nad głową i sięgała
 * do 5,4 j. przy górnej krawędzi kadru na 2,9 j. — w grze: piksele w y = 0
 * przy każdym ciosie mieczem. Zapas 32 px = 3,9 j. mieści najgorszy przypadek
 * (półtorak w chwycie jednoręcznym, +3,71 j.).
 *
 * ⚠ **Szerokość 192 → 320 (2026-10-03) — PCHNIĘCIE drzewcowej.** Broń
 * drzewcowa dostała dłuższe drzewca (`weapon_shapes.SKROT_DRZEWCOWEJ`) i własny
 * klip pchnięcia (`tools/char3d_thrust.py`); grot piki w pchnięciu sięga
 * 18,4 j. od osi, a połowa kadru przy 192 px to 11,6 j. Potrzeba ~305 px.
 */
export const RENDER_W = 320;
/** ⚠ 160 → 184 (2026-10-03): pika (273 cm) noszona PIONOWO przy boku wystawała
 *  2,9 j. nad kadr — przyrost w całości nad głową (`ZAPAS_GORA_PX`). */
/** ⚠ 184 → 200 (2026-10-10, BAZA V5): dłuższa ręka (`rozpietosc` 1,10) niesie
 *  broń 1H niżej — miecze noszone przy boku wypadały DOŁEM kadru. */
export const RENDER_H = 200;

/**
 * Jednostki świata na piksel bufora — GĘSTOŚĆ postaci. Była zaszyta jako
 * kamera 15,5 j. na 128 px; ⛔ nie ruszaj jej przy zmianie bufora, bo
 * zmieniłaby się wielkość postaci w pikselach i ostrość konturu.
 */
export const J_NA_PX = 15.5 / 128;

/**
 * ⭐ CIEŃ POD STOPAMI (2026-10-03, zrzuty z S21 FE: „postać unosi się nad
 * trawą"). Świat pixel-artowy ma cienie namalowane pod drzewami i krzakami,
 * a model 3D nie miał żadnego — sylwetka nie stała NA ziemi. Elipsa leży
 * w warstwie pod wszystkimi bytami (`DEPTH.overlay`), więc nigdy nie przykryje
 * sąsiada; w fazie lotu biegu zostaje na gruncie, co samo czyta się jako skok.
 * Wymiary to ułamki wysokości sprite'a gracza — idą za `PLAYER.scale`.
 */
const CIEN_SZER = 0.46;
const CIEN_WYS = 0.13;
const CIEN_ALFA = 0.32;

/** Ile pikseli bufora dołożono NAD postacią (na zamach nad głową).
 *  ⚠ 56 → 47 (2026-10-03, SZYJA): głowa wstała o 1,15 j. (`glowa_uniesienie`
 *  w `tools/char3d_base.py`), a zamach i pionowa pika liczą się od BARKÓW,
 *  które zostały — zapas nad głową maleje o tyle samo, inaczej środek kadru
 *  jedzie w górę i broń noszona nisko (bastard 1H) wypada DOŁEM kadru
 *  (bramka `rama nosz.`). Kadr w świecie wyszedł ten sam co do 0,03 j. */
/*  ⚠ 47 → 56 (2026-10-10, BAZA V4): głowa nie jest już uniesiona (proporcje
 *  dorosłe, figura 12,8 j. zamiast 13,99), więc zapas wraca — pika noszona
 *  pionowo wystawała 0,99 j. nad kadr (bramka `rama nosz.`). Dół kadru ma ten
 *  sam margines co w V3.7, bo cała figura jest o tyle niższa. */
/*  ⚠ 64 → 59 (2026-10-10, BAZA V5): głowa znów uniesiona (+0,046 wzrostu =
 *  0,59 j. ≈ 5 px) — zapas maleje o tyle samo, jak przy SZYI 2026-10-03. */
export const ZAPAS_GORA_PX = 59;

/**
 * **Tempo obrotu postaci**, radiany na sekundę.
 *
 * ⚠⚠ **Istnieje, bo WASD fizycznie nie umie podać kąta pośredniego.** Wektor
 * z klawiatury to `x, y ∈ {−1, 0, 1}` po normalizacji (`VirtualJoystick.update`),
 * czyli najwyżej **osiem** różnych kierunków — i żadna zmiana w modelu tego nie
 * poszerzy. Problemem nie była jednak LICZBA kierunków, tylko SKOK między nimi:
 * `kat` przeskakiwał natychmiast i przy 45° krokach czytało się to jak postać
 * czterokierunkowa. Zgłoszone przez autora z testów w przeglądarce.
 *
 * ⭐ Na dotyku wejście jest ciągłe (`InputState.move.set(cos·mag, sin·mag)`),
 * więc tam obrót był płynny już wcześniej — wygładzenie nic tam nie psuje,
 * bo cel zmienia się małymi krokami i dociąganie jest natychmiastowe.
 *
 * 14 rad/s = 90° w **0,11 s** (≈7 klatek przy 60 fps), 45° w 0,06 s. Dobrane
 * tak, żeby usunąć przeskok, a nie żeby postać „dojeżdżała" do kierunku —
 * powyżej ~0,15 s sterowanie zaczyna czuć się ospałe.
 * ⛔ To jest tempo PREZENTACJI. Geometria ciosu i osłony czyta `Player`
 * (`attackRad`, `zwrotRad`) i obrotu modelu nie widzi — wygładzenie nie może
 * więc wpłynąć na to, co trafia ani co blokuje.
 */
export const TEMPO_OBROTU = 14.0;

/** Kąt kamery nad horyzontem — ten sam, co w pre-renderze (`build_char3d.py`). */
export const ELEV_DEG = 15;

/**
 * Ile z kadru zajmuje sama postać (bez pustego marginesu).
 *
 * ⚠ Skala obrazka NIE może iść wprost z wysokości bufora, bo model wypełnia
 * kadr tylko częściowo — reszta to margines na broń. Gdyby liczyć ze 128 px
 * bufora, postać 3D byłaby wyraźnie niższa od dawnego sprite'a i rozjechałaby
 * się z NPC-ami, którzy dalej są dwuwymiarowi. Wartość mierzona RAZ po
 * pierwszym renderze (`zmierzWysokoscTresci`), nie zgadywana.
 */
const UDZIAL_TRESCI_FALLBACK = 0.78;

const KLUCZ_TEKSTURY = "char3d-live";

/**
 * Profil NIESIENIA per konstrukcja tarczy.
 *
 * ⚠⚠ **ŹRÓDŁEM JEST `tools/shield_shapes.KONSTRUKCJE[...]["profil"]`** — tam
 * stoi razem z wymiarem, który go wymusza. Ta tabela jest jego odpowiednikiem
 * po stronie silnika i **pilnuje jej bramka** `tools/char3d_sprawdz_tarcze.py`:
 * czyta ten plik i porównuje wpis po wpisie. Rozjazd = BŁĄD, nie cicha pomyłka.
 *
 * Dlaczego w ogóle istnieje: trzy największe konstrukcje (105–112 cm) w zwykłej
 * pozie niesienia **orały grunt** — migdałowa schodziła 2,43 j. pod linię stóp.
 * To nie jest błąd modelu, tylko fizyka: tarcza sięgająca od ziemi po brodę nie
 * wisi przy boku na opuszczonej ręce.
 *
 * ⛔ To są DWA profile na sześć konstrukcji, nie sześć animacji.
 */
const PROFIL_TARCZY: Record<string, "SMALL" | "LARGE"> = {
  buckler: "SMALL",
  round: "SMALL",
  heater: "SMALL",
  almond: "LARGE",
  scutum: "LARGE",
  pavise: "LARGE",
};

/**
 * Sloty ekwipunku w `char.glb`: nazwa slotu → przedrostek węzłów.
 *
 * ⚠ Rozpoznajemy je PO PRZEDROSTKU, nie po zamkniętej liście nazw. Dołożenie
 * broni albo pancerza po stronie Blendera (`tools/char3d_weapons.py`,
 * `tools/char3d_armor.py`) ma działać BEZ zmiany w tym pliku — inaczej każdy
 * nowy przedmiot wymagałby edycji w dwóch miejscach, a drugie łatwo przeoczyć.
 */
const SLOTY: Record<string, string> = {
  pancerz: "Pancerz_",
  bron: "Bron_",
  tarcza: "Tarcza_",
};

/** Mnożnik tempa ciosu. Klip ma 0,8 s (scena w char.blend chodzi po 5 fps),
 *  a to jest za wolno na cios — tempo jest decyzją gry, nie pliku. */
const TEMPO_ATAKU = 2.2;

/**
 * ⭐ TEMPO CIOSU Z ZAMACHU (2026-10-03, `OI-118`).
 *
 * Do tej daty klip grał stałe 364 ms (`TEMPO_ATAKU`) dla KAŻDEJ broni, więc
 * cięcie (klatka 2 z 4, połowa klipu) wypadało zawsze w 182 ms, a gra trafia
 * w `swingDurationMs × swingHitFraction` — sztylet trafiał ~110 ms PRZED
 * cięciem, a Ciężkie uderzenie (840 ms) grało trzy ciosy (`OI-151`).
 * Dziś klip trwa tyle, ile zamach, więc cięcie ląduje w chwili trafienia.
 *
 * ⚠ Dolna granica `MIN_CIOS_MS`: zamach noża (130 ms) dawałby 33 ms na
 * klatkę — cios przestaje być widoczny. Przy 240 ms klatka trwa 60 ms,
 * a cięcie wypada ≤ 55 ms przed trafieniem (nóż), dla miecza 30 ms.
 * ⛔ To jest PREZENTACJA: trafienie, zasięg i osłona nie czytają tempa klipu.
 */
const DLUGOSC_KLIPU_CIOSU_MS = 800;   // klatki 0–4 przy 5 fps sceny w char.blend
const CIECIE_W_KLIPIE = 0.5;          // klatka 2 z 4 (`tools/char3d_attack.py`, POZY)
const MIN_CIOS_MS = 240;

function tempoCiosu(zamachMs: number): number {
  const trwanie = Math.max(zamachMs, MIN_CIOS_MS) * (PLAYER.swingHitFraction / CIECIE_W_KLIPIE);
  return DLUGOSC_KLIPU_CIOSU_MS / trwanie;
}

/**
 * Układ klatek klipu chodu — **musi zgadzać się z `tools/char3d_walk.py`**.
 *
 * Scena w char.blend chodzi po 5 fps, więc klatka = 0,2 s. Klip wyeksportowany
 * z Blendera ma sześć klatek: 0–3 to cykl, 4 domyka pętlę (== klatka 0),
 * a 5 to POZA BEZRUCHU, która do pętli NIE NALEŻY.
 *
 * ⚠ **Dlatego bezruch nie jest już zatrzymanym chodem.** Do 2026-09-20 cykl
 * miał trzy klucze i jedną klatkę, w której obie stopy stały płasko RAZEM —
 * na niej zamrażaliśmy animację. W poprawnym, naprzemiennym cyklu takiej
 * klatki nie ma (w kontakcie stopy są rozstawione, w przeniesieniu jedna jest
 * w powietrzu), więc poza stojąca dostała własną klatkę poza pętlą.
 *
 * ⚠ **Nie da się tego zrobić jedną akcją.** Mikser zapętla CAŁY klip, więc
 * chód zagrałby też klatkę bezruchu. Stąd `subclip` na pętlę i druga akcja
 * z tego samego klipu, zapauzowana na klatce bezruchu — dwie akcje, ale
 * dalej **jeden klip na stan wyposażenia**, bez mnożenia ich przez dwa
 * po stronie Blendera i .glb.
 */
const CHOD_FPS = 5;
const KLATKA_DOMKNIECIA = 4;
const KLATKA_BEZRUCHU = 5;

/**
 * Para akcji dla jednego stanu wyposażenia: zapętlony chód i poza stojąca.
 * Obie wycięte z tego samego klipu, więc bezruch dziedziczy pozę niesienia
 * broni/tarczy za darmo — inaczej postać stojąca z mieczem machałaby nim.
 */
type ParaKlipow = {
  chod: THREE.AnimationAction;
  bezruch: THREE.AnimationAction;
  /** BIEG tego samego stanu wyposażenia (`Run_*`), zsynchronizowany fazą z chodem. */
  bieg: THREE.AnimationAction | null;
} | null;

/**
 * ⭐ CHÓD → BIEG wg prędkości (2026-10-03, `OI-138`).
 *
 * Gracz jedzie 150 px/s przy sylwetce 69 px — to tempo BIEGU, a grany do niego
 * cykl chodu „sunął i dreptał" (zgłoszone wprost: „chód + duża szybkość wygląda
 * dziwnie"). Udział biegu rośnie liniowo między `BIEG_OD` a `BIEG_DO` (px/s)
 * i jest wygładzany, a TEMPO obu klipów idzie z prędkością (`TEMPO_REF_PX_S`
 * = prędkość, przy której cykl gra 1:1 — przy 150 px/s bieg gra ×1,25,
 * sprint ×2), więc stopa mniej się ślizga, a sprint przyspiesza krok.
 * ⛔ To jest PREZENTACJA — prędkość ruchu nie czyta niczego stąd.
 */
const BIEG_OD = 85;
const BIEG_DO = 125;
const TEMPO_REF_PX_S = 120;
const TEMPO_MIN = 0.5;
const TEMPO_MAX = 2.2;
/** Jak szybko udział biegu dochodzi do celu (1/s). */
const BIEG_WYGLADZANIE = 8;

/**
 * Dociągnij `od` do `do_` najkrótszym łukiem, nie szybciej niż `maks` radianów.
 *
 * ⚠ Owijanie przez ±π jest tu istotą rzeczy: bez sprowadzenia różnicy do
 * (−π, π] obrót z −170° na +170° jechałby 340° dookoła zamiast 20° w drugą
 * stronę — czyli dokładnie w momencie, w którym gracz zawraca.
 */
function dociagnijKat(od: number, do_: number, maks: number): number {
  let d = do_ - od;
  d = Math.atan2(Math.sin(d), Math.cos(d));   // najkrótszy łuk
  if (Math.abs(d) <= maks) return do_;
  return od + Math.sign(d) * maks;
}

export class Character3D {
  private readonly scena3d = new THREE.Scene();
  private readonly kamera: THREE.OrthographicCamera;
  /**
   * Canvas 2D między three.js a Phaserem.
   *
   * ⚠ **Nie da się podać Phaserowi canvasa WebGL wprost.** `textures.addCanvas`
   * buduje `CanvasTexture`, która sięga po kontekst 2D i woła na nim
   * `getImageData` — a canvas z kontekstem WebGL zwraca na `getContext("2d")`
   * `null`. Objaw jest mylący: wyjątek `Cannot read properties of null` leci
   * z wnętrza `GLTFLoader`, bo three.js opakowuje callback `onLoad` w try/catch
   * i przekierowuje wszystko do `onError` — wygląda więc, jakby nie wczytał
   * się model, a model wczytał się poprawnie.
   *
   * ⚠ Ten blit to NIE detal implementacyjny, tylko GŁÓWNY koszt podejścia:
   * pełna klatka kopiowana raz na `drawImage` i drugi raz przy wysyłce
   * tekstury na GPU, co klatkę, na postać.
   */
  private readonly most: HTMLCanvasElement;
  private readonly mostCtx: CanvasRenderingContext2D;
  private mikser: THREE.AnimationMixer | null = null;
  private chod: ParaKlipow = null;
  /**
   * Chód Z BRONIĄ — osobne klipy, nie wariant zwykłego chodu.
   *
   * ⚠ Zwykły cykl macha OBIEMA rękami, a w jednej jest broń: zmierzone
   * w Blenderze, miecz schodził wtedy **2,18 j. pod linię stóp**, włócznia
   * 3,43, topór bojowy 1,89 — czyli ostrze zamiatało grunt przy każdym kroku.
   * W bezruchu żadna z tych broni nie miała problemu, więc bez sprawdzenia
   * marszu wyglądało to na poprawne.
   */
  private chodBron: ParaKlipow = null;
  private chodBron2h: ParaKlipow = null;
  /**
   * Chód z tarczą w lewej dłoni (goła prawa ręka) i z tarczą + bronią
   * jednoręczną. Ta sama choroba co `chodBron` opisuje wyżej, druga ręka:
   * bez tego lewa dłoń macha pełnym cyklem chodu niezależnie od tego, co
   * niesie, i tarcza wjeżdża w udo — zgłoszone wprost ze zrzutu z gry.
   *
   * ⚠ Każda z nich ma DWIE wersje — spoczynkową (tarcza opuszczona wzdłuż
   * ciała) i bojową (`...Combat`, wysunięta przed siebie) — wybierane co
   * klatkę przez `gracz.wWalce`, który `GameScene` ustawia z tego samego
   * stanu aggro/pościgu, którym już steruje wybór celu (`Enemy.isChasing`).
   * Nie jest to osobny, nowy timer — to samo zaangażowanie w walkę, tylko
   * czytane po raz drugi.
   */
  private chodTarcza: ParaKlipow = null;
  private chodTarczaWalka: ParaKlipow = null;
  private chodBronTarcza: ParaKlipow = null;
  private chodBronTarczaWalka: ParaKlipow = null;
  /**
   * CARRY dla tarcz o profilu LARGE — patrz `PROFIL_TARCZY`.
   *
   * ⚠ Tylko CARRY. GUARD jest wspólny dla wszystkich sześciu konstrukcji,
   * bo tam tarcza jest wystawiona przed siebie i duża nie ma gdzie zawadzić
   * (zmierzone: 4,0–4,8 j. nad stopami dla każdej z sześciu).
   */
  private chodTarczaDuza: ParaKlipow = null;
  private chodBronTarczaDuza: ParaKlipow = null;
  /**
   * CARRY broni DRZEWCOWEJ poza walką — pionowo przy boku, w jednej dłoni
   * (`tools/char3d_chod.py`, `NIESIENIE_DRZEWCE`), z tarczą albo bez.
   *
   * ⚠⚠ Zgłoszone wprost (2026-10-03): włócznia w `Walk_Armed_2H` leżała przy
   * barku „jak bazooka", a koniec piki sterczał za głową. Topór i młot
   * dwuręczny zostają na ramieniu — tak się je nosi. W WALCE drzewcowa wraca
   * do gotowości oburęcznej.
   */
  private chodDrzewce: ParaKlipow = null;
  private chodDrzewceTarcza: ParaKlipow = null;
  private chodDrzewceTarczaDuza: ParaKlipow = null;
  /** GOTOWOŚĆ drzewcowej W WALCE — drzewce opuszczone do przodu (2026-10-03). */
  private chodDrzewceWalka: ParaKlipow = null;
  private chodDrzewceTarczaWalka: ParaKlipow = null;
  private atak: THREE.AnimationAction | null = null;
  /**
   * Osobny klip ciosu dla broni oburęcznej.
   *
   * ⚠ To NIE jest klip jednoręczny z doklejoną lewą ręką. Ma własny tor,
   * bo przy torze jednoręcznym lewa dłoń PUSZCZAŁA drzewce w klatce cięcia
   * (zmierzone w Blenderze: 0,88 j. od osi drzewca) — prawa wyprowadza cios
   * za daleko przez ciało, a lewe ramię tam nie sięga.
   */
  private atak2h: THREE.AnimationAction | null = null;
  /** PCHNIĘCIE drzewcowej (`tools/char3d_thrust.py`) — oburącz i jednorącz. */
  private pchniecie: THREE.AnimationAction | null = null;
  private pchniecie2h: THREE.AnimationAction | null = null;
  /** Uderzenie tarczą (`Attack_ShieldBash`, `tools/char3d_shield_bash.py`). */
  private uderzenieTarcza: THREE.AnimationAction | null = null;
  private atakTrwa = false;
  /** Wygładzony udział biegu w lokomocji (0 = chód, 1 = bieg). */
  private udzialBiegu = 0;
  /** Wszystkie klipy z `.glb` — do dobrania biegu do pary chodu. */
  private klipy: THREE.AnimationClip[] = [];
  /** Start ostatniego odegranego zamachu (`Player.zamach.od`) — zbocze, `OI-151`. */
  private ostatniZamachOd = -1;
  /** Czas sceny, w którym model zaczął padać (śmierć); −1 = żyje. */
  private upadekOd = -1;
  /** Id broni pokazanej w dłoni — do wykrycia zmiany bez nasłuchu na zdarzenia. */
  private bronWDloni: string | null = null;
  /**
   * Ręczne nadpisanie broni z konsoli. `undefined` = idź za ekwipunkiem.
   *
   * ⚠ Bez tego `dev.char3d.bron("axe")` działałby przez jedną klatkę i został
   * cicho nadpisany przez synchronizację z `Equipment` — czyli komenda
   * wyglądałaby na zepsutą, mimo że robi dokładnie to, co napisano.
   */
  private nadpisanieBroni: string | false | undefined = undefined;
  /**
   * KONSTRUKCJA tarczy pokazanej w LEWEJ dłoni (`buckler`, `round`, `heater`,
   * `almond`, `scutum`, `pavise`) — nie id przedmiotu.
   *
   * ⚠ Różni się tym od `bronWDloni`, które jest id: broń ma model per sztuka,
   * tarcza per konstrukcja. Powód i cena pomyłki: `zsynchronizujTarcze`.
   */
  private tarczaWDloni: string | null = null;
  /** Okuty wariant bryły (`round_iron`…) albo `null` dla drewna. */
  private wariantTarczyWDloni: string | null = null;
  /** Podpis założonego pancerza (`wornItemIds`), żeby nie przełączać co klatkę. */
  private pancerzNaSobie = "";
  /** Ręczne nadpisanie pancerza z konsoli (lista id). `undefined` = ekwipunek. */
  private nadpisaniePancerza: string[] | undefined = undefined;
  /** Ręczne nadpisanie tarczy z konsoli. `undefined` = idź za ekwipunkiem. */
  private nadpisanieTarczy: string | false | undefined = undefined;
  private czasMs = 0;
  private korzen: THREE.Object3D | null = null;
  /**
   * Warstwa pancerza z `char.glb` — osobny mesh, nie druga postać.
   *
   * ⚠ To jest ta przewaga 3D, której arkusz 2D nie ma jak dać: gra ma 11 broni,
   * 4 materiały pancerza i 10 slotów, więc widoczny ekwipunek w sprite'ach to
   * kombinatoryka nie do wyrenderowania. Tutaj element dziedziczy te same wagi
   * kości co ciało, więc porusza się z animacją bez jednej linijki riggingu.
   */
  private sloty = new Map<string, Map<string, THREE.Object3D>>();
  private obraz: Phaser.GameObjects.Image | null = null;
  private cien: Phaser.GameObjects.Ellipse | null = null;
  /** Wiersz bufora ze stopami w pozie stojącej (dół zmierzonej treści). */
  private wierszStop = RENDER_H - 1;
  /** Udział pikseli postaci w wysokości bufora — zmierzony po pierwszym renderze. */
  private udzialTresci = UDZIAL_TRESCI_FALLBACK;
  private skalaUstawiona = false;
  private tekstura: Phaser.Textures.CanvasTexture | null = null;
  private kat = 0;
  private zywy = true;
  /**
   * Koszt samego mostu 3D w ms na klatkę, bufor kołowy.
   *
   * ⚠ **Istnieje, bo FPS na desktopie na to pytanie NIE ODPOWIADA.** Gra chodzi
   * tu z zapasem (p99 ≈ 10 ms przy budżecie 10 ms), więc po włączeniu 3D
   * licznik klatek nie drgnie i wyjdzie fałszywy wniosek „nic nie kosztuje".
   * Kosztu szuka się tam, gdzie on jest: w czasie spędzonym na rysowaniu
   * skinowanego mesha i przepchnięciu tekstury — dopiero tę liczbę można
   * zestawić z budżetem telefonu.
   */
  private readonly koszty: number[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly cel: Phaser.GameObjects.Sprite,
    /** Wołane, gdy model naprawdę stanął w świecie. Dopiero wtedy wolno zgasić
     *  sprite 2D — inaczej przy nieudanym wczytaniu zostałby pusty ekran. */
    private readonly gdyGotowy?: (obraz: Phaser.GameObjects.Image) => void,
    /** Wołane, gdy modelu NIE da się wczytać. Gra ma zostać przy arkuszu 2D. */
    private readonly gdyBlad?: (powod: unknown) => void,
  ) {
    // ⭐ Renderer WSPÓLNY dla wszystkich postaci 3D (`Shared3D`) — bufor ma
    // rozmiar gracza, stworzenia rysują się w jego lewym-dolnym wycinku.
    wspolnyRenderer(RENDER_W, RENDER_H);

    this.most = document.createElement("canvas");
    this.most.width = RENDER_W;
    this.most.height = RENDER_H;
    this.mostCtx = this.most.getContext("2d")!;
    this.mostCtx.imageSmoothingEnabled = false;

    // Kamera ortograficzna, tak jak w pre-renderze: perspektywa zmieniałaby
    // proporcje postaci zależnie od jej pozycji w kadrze, a kadr jest stały.
    // ⚠ Gęstość jest STAŁA (`J_NA_PX`), a kadr wynika z bufora — poszerzenie
    // bufora dokłada miejsca, nie zmienia wielkości postaci w pikselach.
    const wys = RENDER_H * J_NA_PX;
    const szer = RENDER_W * J_NA_PX;
    this.kamera = new THREE.OrthographicCamera(-szer / 2, szer / 2, wys / 2, -wys / 2, 0.1, 500);

    // ⭐⭐ ŚWIATŁO BRYŁY (2026-10-03, zrzuty z S21 FE: „plastikowa figurka").
    // Do tej daty rozproszone 1,8 przy kierunkowym 1,6 z przodu kamery — każda
    // ściana widoczna dla kamery była oświetlona tak samo, cieniowania nie było,
    // a metal, płótno i skóra różniły się wyłącznie kolorem. Dziś:
    //  • słońce z GÓRY i z LEWEJ (tak jak cieniowane są sprite'y świata), bardziej
    //    z boku niż z przodu — jasna i ciemna połowa bryły;
    //  • niebo/ziemia zamiast płaskiego rozproszonego — od dołu ciemniej, więc
    //    nogi i buty odcinają się od tułowia, a sylwetka „stoi" na trawie;
    //  • słabe kontrujące z tyłu-prawej — krawędź ciemnej strony nie zlewa się
    //    z ciemnym tłem.
    // A/B czterech ustawień na trzech zestawach: `docs/postac3d_checkpoint.md`
    // dopisek 2026-10-03 (10).
    dodajSwiatlo(this.scena3d);

    this.zaladuj();
  }

  private zaladuj(): void {
    new GLTFLoader().load(
      "assets/characters/char.glb",
      (gltf) => {
        if (!this.zywy) return;
        const model = gltf.scene;

        // ⚠ Model przychodzi ze stopami OKOŁO y = -11,4, nie w zerze: rig w
        // char.blend stoi na przesuniętym obiekcie `Armature`. Bez tego
        // przesunięcia postać wisi nad kadrem. Liczymy to z bryły, nie
        // wpisujemy liczby — zmiana modelu ma to poprawić sama.
        //
        // ⚠⚠ **Bryła SAMEGO CIAŁA, bez slotów (2026-10-03).** `setFromObject`
        // na całej scenie liczy też UKRYTE bronie, tarcze i pancerz w pozie
        // spoczynkowej rigu — a od kiedy roster ma pikę (219 cm), przedmiot
        // w T-pozie potrafi sięgać niżej niż stopy. Wtedy przesuwała się CAŁA
        // postać w kadrze i środek kamery, zależnie od tego, co akurat jest
        // w pliku, a nie od tego, co gracz ma na sobie.
        const wSlocie = (o: THREE.Object3D): boolean => {
          for (let p: THREE.Object3D | null = o; p; p = p.parent) {
            if (Object.values(SLOTY).some((pr) => p!.name.startsWith(pr))) return true;
          }
          return false;
        };
        const bryla = new THREE.Box3();
        model.updateMatrixWorld(true);
        model.traverse((o) => {
          if ((o as THREE.Mesh).isMesh && !wSlocie(o)) bryla.expandByObject(o);
        });
        const wysokosc = bryla.max.y - bryla.min.y;
        model.position.y -= bryla.min.y;

        // Odwrócona powłoka `Solidify` z char.blend to KONTUR, nie pogrubienie.
        // W three.js jej trójkąty są tyłem do kamery i domyślnie wypadają przez
        // backface culling — czyli kontur po prostu znika. `BackSide` go
        // przywraca; to ten sam efekt, co w widoku 3D w Blenderze.
        model.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (!mesh.isMesh) return;
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const m of mats) {
            if (m.name === "Material.001") m.side = THREE.BackSide;
          }
        });

        // Wszystko startuje ZDJĘTE — spike ma pokazywać różnicę na życzenie,
        // a nie zmieniać domyślnego wyglądu postaci.
        model.traverse((o) => {
          for (const [slot, przedrostek] of Object.entries(SLOTY)) {
            if (!o.name.startsWith(przedrostek)) continue;
            // ⚠ Rejestrujemy tylko KORZEŃ elementu, nigdy jego dzieci.
            // `GLTFLoader` rozbija mesh o kilku materiałach na grupę z dziećmi
            // `<nazwa>_1`, `<nazwa>_2`… Bez tego warunku slot dostawał 28
            // „wariantów" broni zamiast 9, a przełączenie chowało wszystkie
            // dzieci i pokazywało pustą grupę — czyli broń bez geometrii.
            // W three.js dziecko z `visible=false` zostaje niewidoczne
            // niezależnie od rodzica, więc gasimy i zapalamy WYŁĄCZNIE korzeń.
            if (o.parent?.name.startsWith(przedrostek)) continue;
            o.visible = false;
            const mapa = this.sloty.get(slot) ?? new Map<string, THREE.Object3D>();
            mapa.set(o.name.slice(przedrostek.length), o);
            this.sloty.set(slot, mapa);
          }
        });

        const obrot = new THREE.Object3D();
        obrot.add(model);
        this.scena3d.add(obrot);
        this.korzen = obrot;

        // Zapas nad głową przesuwa środek kadru W GÓRĘ o połowę siebie — dół
        // kadru (stopy, kotwica obrazka) zostaje dokładnie tam, gdzie był.
        const srodek = wysokosc / 2 + (ZAPAS_GORA_PX * J_NA_PX) / 2;
        const elew = THREE.MathUtils.degToRad(ELEV_DEG);
        this.kamera.position.set(0, srodek + Math.sin(elew) * 100, Math.cos(elew) * 100);
        this.kamera.lookAt(0, srodek, 0);

        if (gltf.animations.length) {
          this.mikser = new THREE.AnimationMixer(model);
          const klip = (n: string) => gltf.animations.find((a) => a.name === n) ?? null;
          this.klipy = gltf.animations;

          this.chod = this.paraKlipow(klip("Walk"));
          this.chodBron = this.paraKlipow(klip("Walk_Armed"));
          this.chodBron2h = this.paraKlipow(klip("Walk_Armed_2H"));
          this.chodTarcza = this.paraKlipow(klip("Walk_Shielded"));
          this.chodTarczaWalka = this.paraKlipow(klip("Walk_Shielded_Combat"));
          this.chodBronTarcza = this.paraKlipow(klip("Walk_Armed_Shielded"));
          this.chodBronTarczaWalka = this.paraKlipow(klip("Walk_Armed_Shielded_Combat"));
          // ⭐ PROFIL LARGE — osobne klipy CARRY dla tarcz, które w zwykłej
          // pozie niesienia orałyby grunt (migdałowa, legionowa, pawęż).
          // ⛔ GUARD jest WSPÓLNY, więc `_Combat` nie ma wariantu `_Large`.
          this.chodTarczaDuza = this.paraKlipow(klip("Walk_Shielded_Large"));
          this.chodBronTarczaDuza = this.paraKlipow(klip("Walk_Armed_Shielded_Large"));
          this.chodDrzewce = this.paraKlipow(klip("Walk_Armed_Pole"));
          this.chodDrzewceTarcza = this.paraKlipow(klip("Walk_Armed_Pole_Shielded"));
          this.chodDrzewceTarczaDuza = this.paraKlipow(klip("Walk_Armed_Pole_Shielded_Large"));
          this.chodDrzewceWalka = this.paraKlipow(klip("Walk_Armed_Pole_Combat"));
          this.chodDrzewceTarczaWalka = this.paraKlipow(klip("Walk_Armed_Pole_Shielded_Combat"));

          const kAtak2h = klip("Attack_2H");
          if (kAtak2h) {
            this.atak2h = this.mikser.clipAction(kAtak2h);
            this.atak2h.setLoop(THREE.LoopOnce, 1);
            this.atak2h.clampWhenFinished = true;
            this.atak2h.timeScale = TEMPO_ATAKU;
          }

          // Pchnięcie: ta sama umowa co cios (LoopOnce, klamra, tempo z zamachu).
          // ⭐ Uderzenie tarczą (2026-10-11) — ta sama umowa; grane, gdy zamach
          // niesie `poza: "tarcza"` (`PLAYER_ACTIONS.shieldBash`).
          for (const [nazwa, pole] of [["Attack_Thrust", "pchniecie"],
                                       ["Attack_Thrust_2H", "pchniecie2h"],
                                       ["Attack_ShieldBash", "uderzenieTarcza"]] as const) {
            const k = klip(nazwa);
            if (!k) continue;
            const a = this.mikser.clipAction(k);
            a.setLoop(THREE.LoopOnce, 1);
            a.clampWhenFinished = true;
            a.timeScale = TEMPO_ATAKU;
            this[pole] = a;
          }

          const kAtak = klip("Attack");
          if (kAtak) {
            this.atak = this.mikser.clipAction(kAtak);
            this.atak.setLoop(THREE.LoopOnce, 1);
            // ⚠ **Bez `clampWhenFinished` postać wpada w POZĘ T na końcu ciosu.**
            // Przy `LoopOnce` akcja przestaje wpływać na szkielet dokładnie
            // w chwili zakończenia, a chód dopiero zaczyna się wtapiać — przez
            // te ~0,1 s suma wag jest MNIEJSZA od jedynki, a resztę mikser
            // dobiera z pozy spoczynkowej rigu, czyli z rozłożonych rąk.
            // Klamrowanie trzyma ostatnią klatkę ciosu, aż chód przejmie wagę.
            this.atak.clampWhenFinished = true;
            // ⚠ Klip ma 0,8 s, bo scena w char.blend chodzi po 5 fps i tak
            // wygodnie się go autorowało. Tempo ciosu w grze jest osobną
            // decyzją i należy do gry, nie do pliku — stąd `timeScale`.
            this.atak.timeScale = TEMPO_ATAKU;
            this.mikser.addEventListener("finished", () => {
              this.atakTrwa = false;
              for (const a of this.klipyCiosu()) a.fadeOut(0.10);
              // Wraca ten cykl chodu, który pasuje do broni/tarczy w dłoni —
              // wybór dzieje się w `krok()`, tu tylko przywracamy wagę.
              for (const para of this.pary()) {
                if (!para) continue;
                para.chod.reset().fadeIn(0.10).play();
                para.bieg?.reset().fadeIn(0.10).play();
                // ⚠ Bezruchu NIE wolno tu zresetować: `reset()` zdejmuje pauzę
                // i cofa czas do zera, czyli poza stojąca stałaby się pierwszą
                // klatką cyklu (stopy rozstawione). Wagę i włączenie z powrotem
                // załatwia `krok()` w najbliższej klatce.
                para.bezruch.stopFading().play();
              }
            });
          }
        }

        this.tekstura = this.scene.textures.exists(KLUCZ_TEKSTURY)
          ? (this.scene.textures.get(KLUCZ_TEKSTURY) as Phaser.Textures.CanvasTexture)
          : this.scene.textures.addCanvas(KLUCZ_TEKSTURY, this.most)!;

        // ⚠ Wysokość bierzemy z SPRITE'A GRACZA, nie z liczby w tym pliku.
        // Świat (NPC, wrogowie, budynki) jest wyskalowany do dawnej postaci
        // 31×60; model, który tego nie uszanuje, będzie górował nad wsią.
        // Dzięki temu zmiana `PLAYER.scale` sama pociągnie model.
        const wysGracza = this.cel.displayHeight;
        const img = this.scene.add
          .image(this.cel.x, this.cel.y, KLUCZ_TEKSTURY)
          .setOrigin(0.5, 1)
          .setScale(wysGracza / (RENDER_H * this.udzialTresci));
        ySortedWorldFor(this.scene)?.add(img);
        this.obraz = img;
        this.cien = this.scene.add
          .ellipse(this.cel.x, this.cel.y, wysGracza * CIEN_SZER, wysGracza * CIEN_WYS, 0x000000, CIEN_ALFA)
          .setDepth(DEPTH.overlay + 5);

        this.scene.events.on("update", this.krok, this);
        this.gdyGotowy?.(img);
        console.log(
          `[char3d] model wpięty: ${gltf.animations.length} animacji, ` +
            `bufor ${RENDER_W}x${RENDER_H}, wysokość modelu ${wysokosc.toFixed(2)} j.`,
        );
      },
      undefined,
      (e) => {
        // ⚠ Niezmiennik projektu: GRA ZAWSZE SIĘ URUCHAMIA. Brak modelu nie
        // może zostawić gracza bez postaci — wołający zostaje przy arkuszu 2D.
        console.error("[char3d] nie udało się wczytać assets/characters/char.glb", e);
        this.gdyBlad?.(e);
      },
    );
  }

  /** Wszystkie pary chód/bezruch — jedno miejsce, żeby żadnej nie zgubić. */
  private pary(): ParaKlipow[] {
    return [this.chod, this.chodBron, this.chodBron2h, this.chodTarcza,
            this.chodTarczaWalka, this.chodBronTarcza, this.chodBronTarczaWalka,
            this.chodTarczaDuza, this.chodBronTarczaDuza, this.chodDrzewce,
            this.chodDrzewceTarcza, this.chodDrzewceTarczaDuza, this.chodDrzewceWalka,
            this.chodDrzewceTarczaWalka];
  }

  /**
   * Buduje z jednego klipu z .glb parę: zapętlony chód i zamrożony bezruch.
   *
   * ⚠ `subclip` ma **wyłączny** koniec zakresu, więc żeby zabrać klatkę
   * domykającą pętlę (4), trzeba podać granicę POWYŻEJ niej. Połówka zamiast
   * `+ 1` jest odporna na to, że `subclip` liczy numer klatki jako
   * `czas * fps` w zmiennoprzecinkowych (0,8 × 5 wychodzi 4,0000005).
   */
  private paraKlipow(klip: THREE.AnimationClip | null): ParaKlipow {
    if (!klip || !this.mikser) return null;
    // Bieg tego samego stanu: `Walk…` → `Run…` (ta sama budowa klipu).
    const kBieg = this.klipy.find((a) => a.name === klip.name.replace(/^Walk/, "Run")) ?? null;
    const bieg = kBieg
      ? this.mikser.clipAction(THREE.AnimationUtils.subclip(
          kBieg, `${kBieg.name}|petla`, 0, KLATKA_DOMKNIECIA + 0.5, CHOD_FPS))
      : null;
    bieg?.play();
    const petla = THREE.AnimationUtils.subclip(
      klip, `${klip.name}|petla`, 0, KLATKA_DOMKNIECIA + 0.5, CHOD_FPS,
    );
    const chod = this.mikser.clipAction(petla);
    const bezruch = this.mikser.clipAction(klip);
    // ⚠ Bezruch jest akcją ZAPAUZOWANĄ na swojej klatce, a nie akcją o wadze
    // zero: zejście do zera NIE JEST opcją, bo mikser dobiera wtedy resztę
    // z pozy spoczynkowej rigu, czyli rozkłada ręce na boki.
    bezruch.paused = true;
    bezruch.time = KLATKA_BEZRUCHU / CHOD_FPS;
    bezruch.play();
    chod.play();
    return { chod, bezruch, bieg };
  }

  /** Krok klatki: obrót pod kąt ruchu, animacja, render, wysyłka tekstury. */
  private krok(): void {
    const img = this.obraz;
    const korzen = this.korzen;
    if (!img || !korzen) return;

    this.zsynchronizujBron();
    this.zsynchronizujTarcze();
    this.zsynchronizujPancerz();

    const gracz = this.cel as unknown as {
      isSwinging?: boolean;
      /** Start i długość bieżącego zamachu — patrz `Player.zamach`.
       *  `poza`: `wir` = obrót o pełne koło, `tarcza` = klip uderzenia tarczą. */
      zamach?: { od: number; ms: number; poza?: "wir" | "tarcza" };
      isDead?: boolean;
      /** Ciągły zwrot CIOSU — patrz `Player.attackKat`. */
      attackKat?: number;
      wWalce?: boolean;
      /** Ciągły zwrot z intencji gracza — patrz `Player.zwrotKat`. */
      zwrotKat?: number;
    };
    // ⚠ `dt` liczone TU, a nie tuż przed `mikser.update` — obrót postaci
    // potrzebuje go wcześniej, a dwa niezależne pomiary czasu w jednej klatce
    // rozjechałyby się przy pierwszym zacięciu.
    // ⚠ Ograniczone do 0,1 s (2026-10-09), tak jak w `Creature3D.krok`.
    // Pauza rozmowy zatrzymuje logikę, ale nie zegar ściany: po 20 s
    // rozmowy pierwsza klatka przewijała mikser o 20 s naraz.
    const teraz = performance.now();
    const dt = this.czasMs === 0 ? 0 : Math.min(0.1, (teraz - this.czasMs) / 1000);
    this.czasMs = teraz;

    const body = this.cel.body as Phaser.Physics.Arcade.Body | null;
    const vx = body?.velocity.x ?? 0;
    const vy = body?.velocity.y ?? 0;
    const idzie = vx * vx + vy * vy > 4;
    const predkosc = Math.hypot(vx, vy);
    const celBiegu = Math.min(1, Math.max(0, (predkosc - BIEG_OD) / (BIEG_DO - BIEG_OD)));
    this.udzialBiegu += (celBiegu - this.udzialBiegu) * Math.min(1, dt * BIEG_WYGLADZANIE);
    const tempo = Math.min(TEMPO_MAX, Math.max(TEMPO_MIN, predkosc / TEMPO_REF_PX_S));
    // ⚠ To jest cała różnica wobec arkusza: kąt jest CIĄGŁY, a nie zaokrąglony
    // do jednego z czterech wierszy. Model w char.blend patrzy w +Z po
    // eksporcie z `export_yup`, a ekranowe "w dół" to właśnie +Z.
    //
    // ⚠⚠ **Źródłem jest INTENCJA gracza (`Player.zwrotKat`), a nie
    // `body.velocity`** (A5, 2026-09-20). Prędkość wyglądała na to samo i nie
    // była — zmierzone dwa rozjazdy:
    // 1. **obrót w miejscu był niewidoczny.** Strefa `STICK.turnZoneFrac`
    //    pisze zwrot, ale ZERUJE prędkość, więc warunek `idzie` nie wpuszczał
    //    nowego kąta i model stał bokiem do tego, w co gracz celuje.
    // 2. **ślizg po przeszkodzie obracał postać.** Kolizja odchyla prędkość
    //    (wejście na ukos → ciało jedzie wzdłuż ściany), więc model skręcał
    //    tam, gdzie gracz nie szedł.
    // ⛔ Nie przywracać `velocity` jako źródła: `zwrotKat` trzyma ostatnią
    // wartość przy zerowym wejściu, więc gate `idzie` jest tu zbędny, a jego
    // powrót przywróci punkt 1.
    if (!this.atakTrwa && typeof gracz.zwrotKat === "number") {
      // ⚠ PŁYNNIE, nie skokiem — patrz `TEMPO_OBROTU`. Dotyczy ruchu, bezruchu
      // i POWROTU PO CIOSIE; samo wejście w cios zostaje natychmiastowe
      // (`zagrajAtak`), żeby zamach nie „dojeżdżał" do celu.
      this.kat = dociagnijKat(this.kat, gracz.zwrotKat, TEMPO_OBROTU * dt);
    }

    // Cios przejmuje zwrot postaci od `attackKat`, nie od ruchu — bo gra
    // celowo rozdziela te dwie rzeczy (patrz `Player.attackRad`: zamach nigdy
    // nie przepisuje kierunku biegu).
    // ⚠⚠ **ZBOCZE, nie poziom (2026-10-03, `OI-151`).** Do tej daty warunkiem
    // było `isSwinging && !atakTrwa`: gdy poza trwała dłużej niż klip, po jego
    // końcu cios startował OD NOWA — Uderzenie tarczą grało 2×, Ciężkie
    // uderzenie 3×, a gra zadawała jeden cios. Dziś klip startuje raz, na
    // NOWYM zamachu (inny `zamach.od`) — także wtedy, gdy poprzedni klip
    // jeszcze się kończy.
    const zamach = gracz.zamach;
    if (gracz.isSwinging === true && zamach && zamach.od !== this.ostatniZamachOd) {
      this.ostatniZamachOd = zamach.od;
      // ⚠ Wyłącznie kąt CIĄGŁY (ścieżka czterokierunkowa usunięta 2026-09-27).
      this.zagrajAtak(gracz.attackKat ?? this.kat, zamach.ms, zamach.poza);
    }
    korzen.rotation.y = this.kat;
    // ⭐ WIR OSTRZY = obrót o pełne koło w czasie zamachu (2026-10-11). Klip
    // ciosu jest jeden i kierunkowy; bez tego Wir bijący dookoła wyglądał na
    // modelu jak zwykłe cięcie w jedną stronę. Kręci się korzeń, nie klip —
    // zero nowych animacji. Postęp z zegara SCENY, tym samym co `zamach.od`.
    if (zamach?.poza === "wir" && gracz.isSwinging === true && zamach.ms > 0) {
      const p = Math.min(1, Math.max(0, (this.scene.time.now - zamach.od) / zamach.ms));
      korzen.rotation.y = this.kat + Math.PI * 2 * (1 - (1 - p) * (1 - p));
    }
    // ⭐ ŚMIERĆ: model pada na bok (2026-10-11). Sprite 2D przewracał się
    // tweenem kąta (`Player.die`), a model stał dalej, bo kąt sprite'a nie
    // ma odpowiednika w świecie 3D. Pada wokół osi WŁASNEGO zwrotu (lokalne Z,
    // w które model patrzy po eksporcie), czyli na bok — czytelne z kamery
    // z góry. 400 ms i ten sam ease-in, co tween sprite'a.
    if (gracz.isDead === true) {
      if (this.upadekOd < 0) this.upadekOd = this.scene.time.now;
      const p = Math.min(1, (this.scene.time.now - this.upadekOd) / 400);
      korzen.rotation.z = p * p * (Math.PI / 2);
    } else if (this.upadekOd >= 0) {
      this.upadekOd = -1;
      korzen.rotation.z = 0;
    }

    // Który cykl chodu: bez broni, z jednoręczną, z oburęczną — × z tarczą
    // albo bez (chwyt oburęczny wyklucza tarczę, patrz `oburacz()`).
    //
    // ⚠ Każdy stan to PARA akcji (pętla chodu + zamrożona poza stojąca)
    // wycięta z jednego klipu — patrz `paraKlipow`. Bezruch nie jest brakiem
    // animacji: zejście obu wag do zera NIE jest opcją, bo model wraca wtedy
    // do pozy spoczynkowej rigu, czyli rozkłada ręce na boki.
    const bron = this.bronWDloni !== null;
    const tarcza = this.tarczaWDloni !== null;
    const walka = gracz.wWalce === true;
    // ⚠ Profil dotyczy WYŁĄCZNIE pozy CARRY — w walce wszystkie sześć
    // konstrukcji używa tego samego klipu GUARD.
    const duza = tarcza && PROFIL_TARCZY[this.tarczaWDloni!] === "LARGE";
    const carryTarcza = duza ? this.chodTarczaDuza ?? this.chodTarcza : this.chodTarcza;
    const carryBronTarcza = duza
      ? this.chodBronTarczaDuza ?? this.chodBronTarcza
      : this.chodBronTarcza;
    // Drzewcowa poza walką: jedna poza CARRY bez względu na chwyt — w marszu
    // nikt nie trzyma piki oburącz przy piersi.
    // ⭐ W WALCE drzewcowa ma WŁASNĄ gotowość — drzewce opuszczone do przodu,
    // jak klatka 0 pchnięcia — a nie gardę topora przy barku (2026-10-03).
    const drzewce = bron && this.rodzinaBroni() === "polearm";
    const carryDrzewce = walka
      ? (tarcza ? this.chodDrzewceTarczaWalka : this.chodDrzewceWalka)
      : tarcza
        ? (duza ? this.chodDrzewceTarczaDuza ?? this.chodDrzewceTarcza : this.chodDrzewceTarcza)
        : this.chodDrzewce;
    const aktywny = drzewce && carryDrzewce
      ? carryDrzewce
      : this.oburacz()
      ? (this.chodBron2h ?? this.chod)
      : bron && tarcza
        ? (walka ? this.chodBronTarczaWalka : carryBronTarcza) ?? carryBronTarcza ?? this.chodBron ?? this.chod
        : tarcza
          ? (walka ? this.chodTarczaWalka : carryTarcza) ?? carryTarcza ?? this.chod
          : bron
            ? (this.chodBron ?? this.chod)
            : this.chod;

    if (!this.atakTrwa) {
      for (const para of this.pary()) {
        if (!para) continue;
        const wybrany = para === aktywny;
        // ⚠ `enabled = true` PRZED każdą wagą, i to nie jest ostrożność na
        // zapas. Zakończony `fadeOut` w three.js **wyłącza akcję**
        // (`_updateWeight`: `if (interpolantValue === 0) this.enabled = false`),
        // a `setEffectiveWeight` na wyłączonej akcji daje ZERO, cokolwiek się
        // jej poda. Cios wygasza obie akcje pary, więc bez tej linii postać po
        // pierwszym ciosie wchodziła w bezruch z **sumą wag równą zeru** i
        // wracała do pozy spoczynkowej rigu, czyli rozkładała ręce na boki.
        // Zmierzone wprost w grze: `wChod 0, wBezr 0` po sekwencji
        // chód → cios → postój.
        para.chod.enabled = true;
        para.bezruch.enabled = true;
        const u = para.bieg ? this.udzialBiegu : 0;
        para.chod.setEffectiveWeight(wybrany && idzie ? 1 - u : 0);
        para.bezruch.setEffectiveWeight(wybrany && !idzie ? 1 : 0);
        para.chod.timeScale = tempo;
        if (para.bieg) {
          para.bieg.enabled = true;
          para.bieg.setEffectiveWeight(wybrany && idzie ? u : 0);
          // ⚠ Faza WSPÓLNA z chodem: oba klipy mają ten sam układ (0 = lewa
          // podpiera), więc mieszanie nie krzyżuje nóg — pod warunkiem, że
          // grają w tym samym miejscu cyklu.
          para.bieg.timeScale = tempo;
          para.bieg.time = para.chod.time;
        }
      }
    }

    this.mikser?.update(dt);

    // ⭐ Prototyp „świat w 3D" (`WorldView3D`): model w scenie świata, u stóp
    // ciała Arcade. ⚠ Skala świata musi być już zmierzona (pierwsze klatki
    // idą zwykłą drogą), inaczej model wszedłby w zapasowej skali.
    if (swiat3d.scena && this.skalaUstawiona) {
      img.setVisible(false);
      this.cien?.setVisible(false);
      const b = this.cel.body as Phaser.Physics.Arcade.Body | null;
      korzen.userData.styl ??= STYL_POSTACI;
      // ⚠⚠ Tint i alfa Z SPRITE'A, jak w `Creature3D` (2026-10-11). Do tej daty
      // stało tu `null, 1`, więc NIC, co gra rysuje na sprite'cie gracza, nie
      // docierało do modelu: mignięcie trafienia/bloku/parowania/uniku
      // (`flashHit`), półprzezroczystość Uniku (jedyny sygnał nietykalności),
      // miganie po odrodzeniu i blednięcie przy śmierci. Sprite jest schowany
      // przez `setVisible(false)` (`Player.setVisualOverride`), nie alfą,
      // więc jego alfa i tint dalej niosą informację.
      const c = this.cel;
      wSwiecie(korzen, c.x, b ? b.bottom : c.y, c.isTinted ? c.tintTopLeft : null, c.alpha);
      return;
    }
    if (korzen.parent !== this.scena3d) {
      zeSwiata(korzen, this.scena3d);
      img.setVisible(true);
      this.cien?.setVisible(true);
    }

    const t0 = performance.now();
    renderujDo(this.mostCtx, this.scena3d, this.kamera, RENDER_W, RENDER_H);
    this.tekstura?.refresh();
    this.koszty.push(performance.now() - t0);
    if (this.koszty.length > 600) this.koszty.shift();

    if (!this.skalaUstawiona) this.zmierzWysokoscTresci();

    img.setPosition(this.cel.x, this.cel.y + this.cel.displayHeight / 2);
    img.setDepth(DEPTH.entities + this.cel.y);
    if (this.cien) {
      // Stopy leżą `RENDER_H − 1 − wierszStop` px bufora NAD dołem obrazka.
      const stopyY = img.y - (RENDER_H - 1 - this.wierszStop) * img.scaleY;
      this.cien.setPosition(img.x, stopyY).setVisible(img.visible);
    }
  }

  /**
   * Odegraj cios raz.
   *
   * Wywoływane samo z siebie na zboczu `Player.isSwinging`, ale wystawione też
   * jako `dev.char3d.cios()`, bo **atak w grze wymaga wybranego celu**
   * (`GameScene`: „Brak celu”), a oceny samej animacji nie da się uzależnić od
   * tego, czy akurat stoi obok kto do bicia.
   */
  /** Wszystkie klipy ciosu — jedno miejsce, żeby żadnego nie zgubić przy wygaszaniu. */
  private klipyCiosu(): THREE.AnimationAction[] {
    return [this.atak, this.atak2h, this.pchniecie, this.pchniecie2h, this.uderzenieTarcza]
      .filter((a): a is THREE.AnimationAction => a !== null);
  }

  /**
   * ⭐ PCHNIĘCIE zamiast zamachu (2026-10-03): broń drzewcowa + bieżący wariant
   * ataku kłuty. Zgłoszone wprost: „atak włócznią to bardziej dźganie niż
   * machanie". ⚠ Wybór idzie za WARIANTEM (`Progression.damageType`), nie za
   * bronią: halabarda rąbie zamachem, a dźga pchnięciem.
   */
  private klipCiosu(poza?: "wir" | "tarcza"): THREE.AnimationAction | null {
    // Uderzenie tarczą: tylko gdy tarcza naprawdę jest w dłoni — bez niej
    // umiejętność i tak odmawia (`Potrzebujesz tarczy`), to jest bezpiecznik.
    if (poza === "tarcza" && this.uderzenieTarcza && this.tarczaWDloni !== null) return this.uderzenieTarcza;
    const oburacz = this.oburacz();
    if (this.rodzinaBroni() === "polearm" && Progression.damageType === "pierce") {
      const p = oburacz ? this.pchniecie2h : this.pchniecie;
      if (p) return p;
    }
    return oburacz ? (this.atak2h ?? this.atak) : this.atak;
  }

  zagrajAtak(kat: number = this.kat, zamachMs?: number, poza?: "wir" | "tarcza"): void {
    const klip = this.klipCiosu(poza);
    if (!klip) return;
    // Nowy zamach z gry (`zamachMs` podane) przerywa dogrywany klip; podgląd
    // z konsoli (`dev.char3d.cios()`) czeka, aż poprzedni się skończy.
    if (this.atakTrwa && zamachMs === undefined) return;
    this.atakTrwa = true;
    klip.timeScale = zamachMs === undefined ? TEMPO_ATAKU : tempoCiosu(zamachMs);
    // ⚠⚠ **KĄT, NIE ĆWIARTKA.** Do 2026-09-22 cios zawsze skakał do jednej
    // z czterech stron (`KAT_ZWROTU`), bo tyle miał arkusz 2D — a `atakTrwa`
    // blokuje ciągłą aktualizację zwrotu na CAŁY czas zamachu, więc postać
    // stała przekrzywiona aż do końca ciosu. Model obraca się ciągle od A5,
    // więc jedyny moment, który pozostawał czterokierunkowy, był zarazem tym,
    // na który gracz patrzy najuważniej.
    // ⚠ Klip `Attack` jest KIERUNKOWO OBOJĘTNY — orientuje go obrót korzenia,
    // więc uciąglenie nie wymagało niczego po stronie animacji.
    // ⛔ Przyjmuje WYŁĄCZNIE kąt (radiany, 0 = w dół). Czterokierunkowe
    // `KAT_ZWROTU` usunięte 2026-09-27 razem z modelem 4 kierunków gracza.
    this.kat = kat;
    for (const para of this.pary()) {
      para?.chod.fadeOut(0.06);
      para?.bezruch.fadeOut(0.06);
      para?.bieg?.fadeOut(0.06);
    }
    for (const a of this.klipyCiosu()) if (a !== klip) a.fadeOut(0.06);
    klip.reset().setEffectiveWeight(1).fadeIn(0.06).play();
  }

  /**
   * Czy postać trzyma broń OBURĄCZ.
   *
   * ⚠⚠ **Do 2026-09-18 ta funkcja czytała `ITEMS[id].hands === 2` WPROST** —
   * z pominięciem `itemHands` — i była **drugim, niezależnym źródłem prawdy
   * o rękach**. Przy kategorii 1.5H rozjechałaby się natychmiast: półtorak
   * deklaruje `hands: 2`, więc model trzymałby go oburącz nawet z tarczą
   * w lewej dłoni. Dziś pyta o CHWYT, czyli o stan, a nie o pole katalogu.
   *
   * ⚠ Gałąź podglądu (`dev.char3d.bron(...)`) istnieje, bo ręcznie nadpisana
   * broń NIE jest tą, którą trzyma `Equipment` — chwyt liczymy wtedy z samego
   * przedmiotu. To jest przyrząd, nie symulacja zasad (patrz `main.ts`).
   */
  /** Rodzina broni w dłoni (`family` z katalogu) albo `null`. */
  private rodzinaBroni(): string | null {
    const id = this.bronWDloni;
    if (!id) return null;
    const it = (ITEMS as Record<string, { family?: string } | undefined>)[id];
    return it?.family ?? null;
  }

  private oburacz(): boolean {
    const id = this.bronWDloni;
    if (!id) return false;
    if (id === (Equipment.weaponId as string | null)) return Equipment.weaponGrip === "two";
    const it = (ITEMS as Record<string, { hands?: number; grip?: string } | undefined>)[id];
    return it?.hands === 2 && it?.grip !== "either";
  }

  /**
   * Dociągnij broń w dłoni do tego, co gracz ma NAPRAWDĘ założone.
   *
   * ⚠ Czytamy `Equipment.weaponId` co klatkę zamiast nasłuchiwać zdarzenia.
   * To getter na singletonie, więc koszt jest zerowy, a spike nie dokłada
   * wpisu do `EventBus` — nic w mechanice nie ma o nim wiedzieć.
   */
  private zsynchronizujBron(): void {
    if (this.nadpisanieBroni !== undefined) return;
    const id = Equipment.weaponId ?? null;
    if (id === this.bronWDloni) return;
    this.bronWDloni = id;
    const wynik = this.ustawSlot("bron", id ?? false);
    // ⚠ Brak modelu dla założonej broni objawia się PUSTĄ RĘKĄ, nie błędem —
    // wygląda wtedy jak „broń jeszcze nie działa", a nie jak brakujący węzeł
    // w `char.glb`. Tak przepadł `stick`, czyli pierwsza broń w grze.
    // Bramką po stronie źródeł jest `tools/char3d_sprawdz_bron.py`.
    if (id && wynik.startsWith("Nie znam")) {
      console.warn(
        `[char3d] brak modelu broni "${id}" w char.glb — postać trzyma powietrze. ` +
        "Dopisz ją w tools/char3d_weapons.py i przebuduj model.",
      );
    }
  }

  /**
   * Dociągnij tarczę w LEWEJ dłoni do tego, co gracz ma w drugiej ręce.
   *
   * ⚠ **W drugiej ręce nie zawsze jest tarcza.** Slot `offhand` przyjmuje też
   * jednoręczną broń (dual wield — patrz `Equipment.offhandWeapon`), a modele
   * broni wiszą w kości PRAWEJ dłoni. Rozpoznajemy więc tarczę po polu `block`,
   * czyli po tym samym, po czym rozpoznaje ją `GameConfig` („tarcza to zbroja,
   * która dodatkowo blokuje"). Bez tego warunku każde założenie broni do drugiej
   * ręki wołałoby `ustawSlot` z nieznanym id i zasypywało konsolę ostrzeżeniem
   * o brakującym modelu — czyli alarm, który nic nie znaczy.
   *
   * Broni dwuręcznej nie trzeba tu obsługiwać osobno: `Equipment` przy jej
   * założeniu sam odkłada zawartość drugiej ręki do plecaka, więc `offhand`
   * jest wtedy pusty i tarcza gaśnie sama.
   */
  /**
   * Klucz okutej bryły z ikony przedmiotu: `icon-shield-iron-round` →
   * `round_iron`. Drewno (i każda ikona spoza tego wzorca) → `null`.
   * ⚠ Bliźniaczy wzorzec stoi w `tools/shield_roster.mjs` — zmieniając jeden,
   * zmień drugi, inaczej bramka przestanie widzieć warianty z gry.
   */
  static wariantTarczy(konstrukcja: string, iconTexture?: string): string | null {
    const m = /^icon-shield-(iron|steel)-(\w+)$/.exec(iconTexture ?? "");
    return m ? `${konstrukcja}_${m[1]}` : null;
  }

  /**
   * ⭐ PANCERZ NA MODELU (2026-10-03, pilot: tors). Każda sztuka to węzeł
   * `Pancerz_<id>` (`tools/char3d_armor.py`) — widoczny dokładnie wtedy, gdy
   * gracz ma ją NA SOBIE. Warstwy pokazujemy WSZYSTKIE naraz: zewnętrzna jest
   * grubsza, więc przykrywa wewnętrzną tam, gdzie obie sięgają, a rękawy
   * przeszywanicy wystają spod kolczugi same — bez reguł widoczności w kodzie.
   * ⚠ Sztuka bez węzła (obszary poza pilotem) po prostu nic nie dokłada; ciało
   * nosi tam kolory bazy.
   */
  private zsynchronizujPancerz(): void {
    const mapa = this.sloty.get("pancerz");
    if (!mapa) return;
    const ids = this.nadpisaniePancerza ?? (Equipment.wornItemIds as string[]);
    const podpis = ids.join(",");
    if (podpis === this.pancerzNaSobie) return;
    this.pancerzNaSobie = podpis;
    const zalozone = new Set(ids);
    for (const [id, o] of mapa) o.visible = zalozone.has(id);
  }

  /** Ręcznie wymuś pancerz (lista id) albo wróć do śledzenia ekwipunku. */
  ustawPancerzRecznie(w: string | string[] | false | "auto"): string {
    if (w === "auto") {
      this.nadpisaniePancerza = undefined;
      this.pancerzNaSobie = "\u0000";        // wymuś ponowną synchronizację
      return "pancerz: śledzi ekwipunek";
    }
    this.nadpisaniePancerza = w === false ? [] : Array.isArray(w) ? w : [w];
    this.pancerzNaSobie = "\u0000";
    const mapa = this.sloty.get("pancerz");
    const nieznane = this.nadpisaniePancerza.filter((id) => !mapa?.has(id));
    return nieznane.length
      ? `Nie znam w char.glb: ${nieznane.join(", ")}. Dostępne: ${[...(mapa?.keys() ?? [])].join(", ")}`
      : `pancerz: ${this.nadpisaniePancerza.join(", ") || "zdjęty"}`;
  }

  private zsynchronizujTarcze(): void {
    if (this.nadpisanieTarczy !== undefined) return;
    const wDrugiejRece = Equipment.offhand;
    const def = wDrugiejRece
      ? (ITEMS as Record<string, { block?: unknown; construction?: string; iconTexture?: string } | undefined>)[
          wDrugiejRece.itemId
        ]
      : undefined;
    // ⭐⭐ **ADRESUJEMY PO KONSTRUKCJI, NIE PO ID PRZEDMIOTU (2026-09-21).**
    // 30 tarcz z katalogu dzieli 6 brył, a `construction` jest w `GameConfig`
    // opisane wprost jako „jedyne miejsce, w którym przedmiot mówi, czym JEST".
    // Dzięki temu KAŻDA nowa pozycja katalogu działa bez nowego modelu.
    //
    // ⚠⚠ Poprzednia wersja brała `itemId` i dlatego **28 z 30 tarcz
    // renderowało PUSTĄ LEWĄ DŁOŃ**: modele nazywały się `buckler`
    // i `ironbound_shield` (dwa stare wpisy), a gracz kupował u Sobka
    // `wood_round_shield`. Objawem był `console.warn` i pusta ręka, nie błąd.
    // ⛔ Nie wracaj do `itemId`.
    const konstrukcja = def && def.block !== undefined ? def.construction ?? null : null;
    // ⭐ Wariant OKUTY (2026-10-03): `<konstrukcja>_<gatunek>` czytany z IKONY,
    // nie z pola `material` — model ma pokazywać to, co gracz widział
    // w sklepie („Tarcza okuta" nie ma `material`, a ma ikonę żelaza). Ta sama
    // reguła stoi w `tools/shield_roster.mjs`, który pilnuje kompletu brył.
    const wariant = konstrukcja ? Character3D.wariantTarczy(konstrukcja, def?.iconTexture) : null;
    if (konstrukcja === this.tarczaWDloni && wariant === this.wariantTarczyWDloni) return;
    this.tarczaWDloni = konstrukcja;
    this.wariantTarczyWDloni = wariant;
    const mapa = this.sloty.get("tarcza");
    // Brak okutej bryły = drewniana tej samej konstrukcji (sylwetka i chwyt
    // są wspólne), a nie pusta ręka.
    const klucz = wariant && mapa?.has(wariant) ? wariant : konstrukcja;
    const wynik = this.ustawSlot("tarcza", klucz ?? false);
    // ⚠ Ta sama pułapka co przy broni: brak modelu to PUSTA RĘKA, nie błąd.
    if (konstrukcja && wynik.startsWith("Nie znam")) {
      console.warn(
        `[char3d] brak modelu tarczy o konstrukcji "${konstrukcja}" w char.glb — ` +
        "druga ręka jest pusta. Dopisz ją w tools/char3d_shields.py i przebuduj model.",
      );
    }
  }

  /**
   * Załóż/zdejmij pancerz. Zwraca stan albo powód, dla którego się nie da.
   *
   * ⚠ Sam `visible` wystarcza, bo element jest normalnym meshem skinowanym tym
   * samym szkieletem — nie ma tu nic do przeliczenia, przepięcia ani
   * zsynchronizowania z animacją. To jest cała treść tego testu.
   */
  /**
   * Załóż/zdejmij element w danym slocie. Zwraca stan albo powód, czemu się nie da.
   *
   * ⚠ Sam `visible` wystarcza i to jest CAŁA treść tego testu: pancerz jest
   * skinowany tym samym szkieletem, a broń wisi w gnieździe kości dłoni.
   * Nie ma tu nic do przeliczenia, przepięcia ani zsynchronizowania z animacją
   * — czyli dokładnie to, czego arkusz 2D nie potrafi dać za żadną cenę.
   */
  /**
   * Ręcznie wymuś broń w dłoni albo wróć do śledzenia ekwipunku.
   *
   * `"auto"` zdejmuje nadpisanie — od tej chwili model znów pokazuje to, co
   * gracz ma naprawdę założone.
   */
  ustawBronRecznie(wariant: string | false | "auto"): string {
    if (wariant === "auto") {
      this.nadpisanieBroni = undefined;
      this.bronWDloni = null;          // wymuś ponowną synchronizację
      return "broń: śledzi ekwipunek";
    }
    this.nadpisanieBroni = wariant;
    this.bronWDloni = wariant === false ? null : wariant;
    return this.ustawSlot("bron", wariant);
  }

  /**
   * Ręcznie wymuś tarczę w drugiej ręce albo wróć do śledzenia ekwipunku.
   *
   * ⚠ Istnieje z tego samego powodu co `ustawBronRecznie`: bez nadpisania
   * komenda z konsoli działałaby jedną klatkę i zostałaby cicho nadpisana przez
   * synchronizację z `Equipment` — czyli wyglądałaby na zepsutą.
   *
   * ⚠⚠ **`wariant` to KONSTRUKCJA, nie id przedmiotu** — `"round"`, a nie
   * `"wood_round_shield"`. Lista dostępnych: `dev.char3d.dostepne().tarcza`.
   */
  ustawTarczeRecznie(wariant: string | false | "auto"): string {
    if (wariant === "auto") {
      this.nadpisanieTarczy = undefined;
      this.tarczaWDloni = null;          // wymuś ponowną synchronizację
      this.wariantTarczyWDloni = null;
      return "tarcza: śledzi ekwipunek";
    }
    this.nadpisanieTarczy = wariant;
    // Okuty wariant (`almond_iron`) niesie konstrukcję przed podkreślnikiem —
    // a od KONSTRUKCJI zależy profil niesienia (`PROFIL_TARCZY`).
    this.tarczaWDloni = wariant === false ? null : wariant.split("_")[0];
    this.wariantTarczyWDloni = wariant === false || !wariant.includes("_") ? null : wariant;
    return this.ustawSlot("tarcza", wariant);
  }

  ustawSlot(slot: string, wariant: string | false): string {
    const mapa = this.sloty.get(slot);
    if (!mapa || mapa.size === 0) {
      return `Brak slotu "${slot}" w char.glb — przebuduj: blender -b ` +
        "public/assets/char.blend --python tools/char3d_export_gltf.py -- <plik.glb>";
    }
    // Warianty wykluczają się wzajemnie — to jeden slot, nie kilka naraz.
    for (const o of mapa.values()) o.visible = false;
    if (wariant === false) return `${slot}: zdjęte`;
    const cel = mapa.get(wariant);
    if (!cel) return `Nie znam "${wariant}" w slocie ${slot}. Dostępne: ${[...mapa.keys()].join(", ")}`;
    cel.visible = true;
    return `${slot}: ${wariant}`;
  }

  /** Co da się założyć w każdym slocie — do podpowiedzi w konsoli. */
  dostepne(): Record<string, string[]> {
    const out: Record<string, string[]> = {};
    for (const [slot, mapa] of this.sloty) out[slot] = [...mapa.keys()];
    return out;
  }

  /**
   * Zmierz, jaką część kadru zajmuje postać, i dociągnij do tego skalę obrazka.
   *
   * ⚠ Robione RAZ, po pierwszym renderze, a nie co klatkę: to odczyt pikseli
   * z canvasa, czyli dokładnie ta operacja, której ten moduł unika w pętli.
   * Bez pomiaru skala opiera się na `UDZIAL_TRESCI_FALLBACK`, czyli na
   * zgadywaniu — a model wypełnia kadr inaczej niż dawny sprite wypełniał
   * swoją klatkę.
   */
  private zmierzWysokoscTresci(): void {
    const img = this.obraz;
    if (!img) return;
    // ⚠⚠ **Mierzymy SAMO CIAŁO (2026-10-03).** Pierwsza klatka pokazuje to,
    // co gracz ma założone z zapisu — a broń dwuręczna w gotowości albo hełm
    // wystają ponad głowę. Wtedy „udział treści" rósł i CAŁA postać wychodziła
    // mniejsza, zależnie od tego, z czym wczytano grę. Gasimy sloty na jeden
    // dodatkowy render, mierzymy i przywracamy — koszt jednej klatki, raz.
    const zgaszone: THREE.Object3D[] = [];
    for (const mapa of this.sloty.values()) {
      for (const o of mapa.values()) if (o.visible) { o.visible = false; zgaszone.push(o); }
    }
    if (zgaszone.length) {
      renderujDo(this.mostCtx, this.scena3d, this.kamera, RENDER_W, RENDER_H);
    }
    const d = this.mostCtx.getImageData(0, 0, RENDER_W, RENDER_H).data;
    if (zgaszone.length) {
      for (const o of zgaszone) o.visible = true;
      renderujDo(this.mostCtx, this.scena3d, this.kamera, RENDER_W, RENDER_H);
      this.tekstura?.refresh();
    }
    let gora = -1;
    let dol = -1;
    for (let y = 0; y < RENDER_H; y++) {
      let jest = false;
      for (let x = 0; x < RENDER_W; x++) {
        if (d[(y * RENDER_W + x) * 4 + 3] > 8) { jest = true; break; }
      }
      if (jest) { if (gora < 0) gora = y; dol = y; }
    }
    if (gora < 0 || dol <= gora) return;          // pusty kadr — spróbuj w następnej klatce
    this.skalaUstawiona = true;
    this.wierszStop = dol;
    this.udzialTresci = (dol - gora + 1) / RENDER_H;
    img.setScale(this.cel.displayHeight / (RENDER_H * this.udzialTresci));
    // Ta sama gęstość dla stworzeń 3D — patrz `Shared3D.skalaSwiata`.
    skalaSwiata.obrazu = img.scaleX;
    console.log(
      `[char3d] postać zajmuje ${(this.udzialTresci * 100).toFixed(0)}% kadru; ` +
      `skala dociągnięta do sprite'a gracza (${this.cel.displayHeight.toFixed(0)} px)`,
    );
  }

  /** Obrazek, który naprawdę rysuje postać — dla `PlayerSilhouette`. */
  get obrazek(): Phaser.GameObjects.Image | null {
    return this.obraz;
  }

  /** Koszt mostu w ms/klatkę: percentyle, nie średnia (patrz `core/Perf.ts`). */
  koszt(): Record<string, number | string> {
    if (this.koszty.length < 30) return { uwaga: "za mało klatek — poczekaj chwilę" };
    const s = [...this.koszty].sort((a, b) => a - b);
    const p = (q: number) => +s[Math.floor(s.length * q)].toFixed(3);
    return {
      klatek: s.length,
      msP50: p(0.5),
      msP95: p(0.95),
      msP99: p(0.99),
      msMax: +s[s.length - 1].toFixed(3),
      bufor: `${RENDER_W}x${RENDER_H}`,
    };
  }

  destroy(): void {
    this.zywy = false;
    this.scene.events.off("update", this.krok, this);
    this.obraz?.destroy();
    this.cien?.destroy();
    this.cel.setVisible(true);
    // ⚠ Renderer jest WSPÓLNY i żyje do końca strony — nie `dispose()`.
    if (this.scene.textures.exists(KLUCZ_TEKSTURY)) {
      this.scene.textures.remove(KLUCZ_TEKSTURY);
    }
  }
}
