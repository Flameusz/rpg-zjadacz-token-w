package com.jarektylerm.rpgprototype;

import android.os.Bundle;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

/**
 * Tryb pełnoekranowy (immersive). Bez tego gra dostaje pasek stanu u góry
 * (godzina, bateria, ikony sieci) i pasek nawigacji z boku — na ekranie
 * poziomym zjadają razem kilkanaście procent szerokości i widać je NAD
 * pixel-artem, co psuje cały obraz.
 *
 * Robione natywnie, a nie ze strony, celowo: `screen.orientation.lock()` i
 * webowy fullscreen wymagają gestu użytkownika i zachowują się różnie w każdej
 * przeglądarce mobilnej. Orientacja jest z tego samego powodu zablokowana
 * w manifeście (`android:screenOrientation="landscape"`), a nie w JS.
 */
public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        hideSystemBars();
    }

    /**
     * ⚠ Powtórzone przy odzyskaniu focusu, bo paski WRACAJĄ. System pokazuje je
     * z powrotem po przełączeniu aplikacji, po zdjęciu blokady ekranu i po
     * każdym przeciągnięciu palcem od krawędzi — jednorazowe ukrycie w
     * `onCreate` trzyma się tylko do pierwszego takiego zdarzenia.
     */
    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            hideSystemBars();
        }
    }

    private void hideSystemBars() {
        // Rysuj pod paskami zamiast obok nich — inaczej po ich ukryciu zostaje
        // czarny margines dokładnie tej samej szerokości.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        WindowInsetsControllerCompat controller =
                WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        controller.hide(WindowInsetsCompat.Type.systemBars());
        // Przeciągnięcie od krawędzi pokazuje paski na chwilę i chowa je samo.
        // Wariant "BY_TOUCH" chowałby je dopiero po kolejnym dotknięciu, czyli
        // przy grze na dotyku praktycznie od razu — i mrugałyby przez cały czas.
        controller.setSystemBarsBehavior(
                WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }
}
