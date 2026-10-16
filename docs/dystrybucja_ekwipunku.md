---
typ: GENEROWANE
domena: items
tytul: Dystrybucja ekwipunku — skąd gracz bierze każdą sztukę
stan: zywy
kotwice: [tools/dystrybucja_przymiar.mjs]
generator: tools/dystrybucja_przymiar.mjs
otwarte: []
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-11
---

# Dystrybucja ekwipunku

> **Ten plik jest GENEROWANY** (`OI-106`, 2026-10-11) przez
> `tools/dystrybucja_przymiar.mjs` ze sklepów (`NPCS[*].stock`), zadań
> (`grant`, `reward.item`, `onComplete.grant`), łupu (`LOOT.equipmentDrops`)
> i stroju startowego. Proza jest ręczna.
>
> ```
> node tools/dystrybucja_przymiar.mjs             # przymiar — raport i bramka
> node tools/dystrybucja_przymiar.mjs --lista     # wypisuje braki
> node tools/dystrybucja_przymiar.mjs --zapisz    # odświeża tabelę
> node tools/dystrybucja_przymiar.mjs --sabotaz   # samokontrola bramki
> ```
>
> ⭐ **Reguła ETAPU TESTÓW (decyzja autora 2026-10-11): każda broń i każdy
> pancerz stoi w jakimś sklepie** — „łatwiej będzie testować wizualnie
> przedmioty na tym etapie”. Wyjątki: biżuteria i sztuki osobiste (owijki
> Patryczka). ⚠ Przed wydaniem do przeglądu (`docs/odlozone.md` §1).
>
> ⭐ **Łup z wroga to to, co MIAŁ NA SOBIE — rzadko i zniszczone**
> (`LOOT.equipmentDrops`), żeby wróg nie stał się farmą przedmiotów.
>
> ⛔ `docs/ekwipunek_przedmioty.md` mówi, co ISTNIEJE; ten plik — skąd się to
> BIERZE. Pałka i Krótki miecz były nieosiągalne przez wiele tygodni właśnie
> dlatego, że tej drugiej tabeli nie było.

<!-- AUTO:start:dystrybucja -->
Sztuk ekwipunku: **127** · ze źródłem: **127** · **bez żadnej drogi zdobycia: 0**

| slot | przedmiot | id | skąd |
|---|---|---|---|
| weapon | Bastard | `bastard_sword` | sklep: Kowal |
| weapon | Berdysz | `bardiche` | sklep: Kowal |
| weapon | Buzdygan | `mace` | sklep: Kowal |
| weapon | Cep bojowy | `peasant_flail` | sklep: Rolnik |
| weapon | Glewia | `glaive` | sklep: Kowal |
| weapon | Halabarda | `halberd` | sklep: Kowal |
| weapon | Kiścień | `flail` | sklep: Kowal |
| weapon | Korbacz | `chain_mace` | sklep: Kowal |
| weapon | Kord | `messer` | sklep: Myśliwy |
| weapon | Krótki miecz | `short_sword` | sklep: Kowal |
| weapon | Labrys | `labrys` | sklep: Kowal |
| weapon | Maczuga | `great_club` | sklep: Myśliwy |
| weapon | Miecz | `sword` | sklep: Kowal · łup: bandit_chief 25% |
| weapon | Miecz długi | `longsword` | sklep: Kowal |
| weapon | Miecz dwuręczny | `greatsword` | sklep: Kowal |
| weapon | Mizerykordia | `misericorde` | sklep: Kowal |
| weapon | Młot | `hammer` | sklep: Kowal |
| weapon | Młot bojowy 1H | `war_hammer_1h` | sklep: Kowal |
| weapon | Młot bojowy 2H | `war_hammer` | sklep: Kowal |
| weapon | Nadziak | `war_pick` | sklep: Kowal |
| weapon | Nóż | `knife` | sklep: Myśliwy |
| weapon | Osiosany kij | `stick` | sklep: Myśliwy · zadanie: Kij w garści (na start) · zadanie: Pierwszy odstrzał |
| weapon | Pałka | `club` | sklep: Kowal · łup: bandit_club 2% |
| weapon | Pika | `pike` | sklep: Kowal |
| weapon | Rapier | `rapier` | sklep: Kowal |
| weapon | Rohatyna | `boar_spear` | sklep: Myśliwy |
| weapon | Siekiera | `axe` | sklep: Kowal · łup: bandit_axe 2% |
| weapon | Szabla | `sabre` | sklep: Kowal |
| weapon | Sztylet | `dagger` | sklep: Myśliwy |
| weapon | Tasak | `cleaver_sword` | sklep: Kowal |
| weapon | Toporek | `hatchet` | sklep: Kowal |
| weapon | Topór bojowy | `battle_axe` | sklep: Kowal |
| weapon | Topór brodaty | `bearded_axe` | sklep: Kowal · zadanie: Zrabowany wóz |
| weapon | Topór duński | `dane_axe` | sklep: Kowal |
| weapon | Widły | `pitchfork` | sklep: Rolnik |
| weapon | Wielki miecz | `zweihander` | sklep: Kowal |
| weapon | Włócznia | `spear` | sklep: Kowal |
| offhand | Ciężka drewniana pawęż | `wood_pavise_heavy` | sklep: Sobek |
| offhand | Ciężka drewniana tarcza migdałowa | `wood_almond_shield_heavy` | sklep: Sobek |
| offhand | Ciężka drewniana tarcza okrągła | `wood_round_shield_heavy` | sklep: Sobek |
| offhand | Ciężka drewniana tarcza rycerska | `wood_heater_shield_heavy` | sklep: Sobek |
| offhand | Ciężka stalowa tarcza okrągła | `steel_round_shield_heavy` | sklep: Kowal |
| offhand | Ciężka stalowa tarcza rycerska | `steel_heater_shield_heavy` | sklep: Kowal |
| offhand | Ciężka żelazna tarcza migdałowa | `iron_almond_shield_heavy` | sklep: Kowal |
| offhand | Ciężka żelazna tarcza okrągła | `iron_round_shield_heavy` | sklep: Kowal |
| offhand | Ciężka żelazna tarcza rycerska | `iron_heater_shield_heavy` | sklep: Kowal |
| offhand | Ciężki drewniany puklerz | `wood_buckler_heavy` | sklep: Sobek |
| offhand | Ciężki stalowy puklerz | `steel_buckler_heavy` | sklep: Kowal |
| offhand | Ciężki żelazny puklerz | `iron_buckler_heavy` | sklep: Kowal |
| offhand | Drewniana pawęż | `wood_pavise` | sklep: Sobek |
| offhand | Drewniana tarcza legionowa | `wood_scutum` | sklep: Sobek |
| offhand | Drewniana tarcza migdałowa | `wood_almond_shield` | sklep: Sobek |
| offhand | Drewniana tarcza okrągła | `wood_round_shield` | sklep: Sobek |
| offhand | Drewniana tarcza rycerska | `wood_heater_shield` | sklep: Sobek |
| offhand | Lekka drewniana tarcza legionowa | `wood_scutum_light` | sklep: Sobek |
| offhand | Lekka stalowa tarcza legionowa | `steel_scutum_light` | sklep: Kowal |
| offhand | Lekka żelazna tarcza legionowa | `iron_scutum_light` | sklep: Kowal |
| offhand | Puklerz | `buckler` | sklep: Kowal · sklep: Sobek · zadanie: Skóra na pasy |
| offhand | Stalowa tarcza legionowa | `steel_scutum` | sklep: Kowal |
| offhand | Stalowa tarcza rycerska | `steel_heater_shield` | sklep: Kowal |
| offhand | Stalowy puklerz | `steel_buckler` | sklep: Kowal |
| offhand | Tarcza okuta | `ironbound_shield` | sklep: Kowal |
| offhand | Żelazna tarcza legionowa | `iron_scutum` | sklep: Kowal |
| offhand | Żelazna tarcza migdałowa | `iron_almond_shield` | sklep: Kowal |
| offhand | Żelazna tarcza okrągła | `iron_round_shield` | sklep: Kowal |
| offhand | Żelazna tarcza rycerska | `iron_heater_shield` | sklep: Kowal |
| offhand | Żelazny puklerz | `iron_buckler` | sklep: Kowal |
| head | Czepiec | `cloth_coif` | sklep: Witek |
| head | Czepiec lamelkowy | `lamellar_coif` | sklep: Kowal |
| head | Czepiec pikowany | `padded_cap` | sklep: Witek · łup: bandit_axe 2% |
| head | Hełm stożkowy | `spangenhelm` | sklep: Kowal · łup: bandit_chief 100% |
| head | Kapalin | `kettle_hat` | sklep: Kowal |
| head | Kaptur kolczy | `mail_coif` | sklep: Kowal |
| head | Kaptur żelazny | `iron_coif` | sklep: Kowal |
| head | Skórzany kaptur | `leather_helmet` | sklep: Myśliwy |
| head | Stalowy hełm | `steel_helmet` | sklep: Kowal · zadanie: Droga na wschód |
| head | Żelazny hełm | `iron_helmet` | sklep: Kowal |
| chest | Brygantyna | `brigandine` | sklep: Kowal |
| chest | Kaftan ćwiekowany | `studded_leather` | sklep: Myśliwy |
| chest | Kaftan pikowany | `arming_doublet` | sklep: Witek |
| chest | Kirys | `cuirass` | sklep: Kowal |
| chest | Kolczuga | `mail_hauberk` | sklep: Kowal |
| chest | Kolczuga krótka | `short_hauberk` | sklep: Kowal · łup: bandit_chief 25% |
| chest | Kolczuga żelazna | `iron_hauberk` | sklep: Kowal |
| chest | Koszula | `linen_shirt` | sklep: Witek · łup: bandit_club 2% · start (na sobie) |
| chest | Napierśnik skórzany | `hardened_leather_chest` | sklep: Myśliwy |
| chest | Pancerz lamelkowy | `lamellar_chest` | sklep: Kowal |
| chest | Pancerz łuskowy | `scale_chest` | sklep: Kowal |
| chest | Przeszywanica | `gambeson` | sklep: Witek · łup: bandit_axe 2% |
| chest | Skórzany kaftan | `leather_chest` | sklep: Myśliwy · łup: bandit_club 2% |
| chest | Stalowy napierśnik | `steel_chest` | sklep: Kowal |
| chest | Żelazny napierśnik | `iron_chest` | sklep: Kowal |
| shoulders | Naramienniki lamelkowe | `lamellar_pauldrons` | sklep: Kowal |
| shoulders | Naramienniki łuskowe | `scale_pauldrons` | sklep: Kowal |
| shoulders | Naramienniki płytowe | `plate_pauldrons` | sklep: Kowal |
| shoulders | Naramienniki skórzane | `leather_pauldrons` | sklep: Myśliwy |
| gloves | Rękawice kolcze | `mail_gloves` | sklep: Kowal |
| gloves | Rękawice pikowane | `padded_gloves` | sklep: Witek · zadanie: Rękawice od wnuka |
| gloves | Skórzane rękawice | `leather_gloves` | sklep: Myśliwy · łup: bandit_chief 25% |
| gloves | Stalowe rękawice | `steel_gauntlets` | sklep: Kowal |
| gloves | Stare owijki Patryczka | `worn_wraps` | zadanie: Kij w garści (etap) |
| legs | Okute spodnie | `splinted_greaves` | sklep: Kowal |
| legs | Pełne nagolenniki | `cuisses` | sklep: Kowal |
| legs | Skórzane spodnie | `leather_legs` | sklep: Myśliwy · łup: bandit_axe 2% |
| legs | Spodenki kolcze | `demi_chausses` | sklep: Kowal |
| legs | Spodnie | `linen_trousers` | sklep: Witek · łup: bandit_club 2% · start (na sobie) |
| legs | Spodnie kolcze | `mail_chausses` | sklep: Kowal |
| legs | Spodnie lamelkowe | `lamellar_legs` | sklep: Kowal |
| legs | Spodnie łuskowe | `scale_legs` | sklep: Kowal |
| legs | Spodnie pikowane | `padded_chausses` | sklep: Witek |
| legs | Stalowe nagolenniki | `steel_legs` | sklep: Kowal |
| legs | Żelazne nagolenniki | `iron_legs` | sklep: Kowal |
| legs | Żelazne spodnie kolcze | `iron_chausses` | sklep: Kowal |
| boots | Buty kolcze | `mail_boots` | sklep: Kowal |
| boots | Buty piechura | `marching_boots` | sklep: Myśliwy |
| boots | Łapcie | `bast_shoes` | sklep: Witek · start (na sobie) |
| boots | Onuce | `foot_wraps` | sklep: Witek · łup: bandit_club 2% |
| boots | Półstalowe buty | `half_sabatons` | sklep: Kowal |
| boots | Skórzane buty | `leather_boots` | sklep: Myśliwy · łup: bandit_chief 25% |
| boots | Stalowe buty | `steel_boots` | sklep: Kowal |
| boots | Trzewiki | `low_boots` | sklep: Myśliwy · łup: bandit_axe 2% |
| boots | Żelazne buty | `iron_boots` | sklep: Kowal |
| ring | Pierścień ochrony | `ring_warding` | sklep: Kowal |
| ring | Pierścień precyzji | `ring_precision` | sklep: Kowal |
| ring | Pierścień wigoru | `ring_vigor` | sklep: Kowal |
| ring | Pierścień zwinności | `ring_swiftness` | sklep: Kowal |
| amulet | Naszyjnik z kła Szarego | `grey_fang_necklace` | zadanie: Szary |
<!-- AUTO:end:dystrybucja -->
