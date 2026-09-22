# autoszerviz

Azonnali árajánlat minta autószervizeknek. Sablon: minden új szervizhez másold
le az `autoszerviz.html` fájlt `<szerviz-nev>.html` néven, és cseréld benne a
`THEME` színeket és a `PLACEHOLDER`-rel jelölt mezőket.

| fájl | mi ez |
| --- | --- |
| `autoszerviz.html` | a sablon: téma, cégadatok, a beszélgetés és az árkalkuláció |
| `quote-agent.js` | a motor, minden demó ezt használja |
| `quote-agent.css` | a stílusok |
| `index.html` | átirányítás a `/autoszerviz` oldalra |

## Élő minták

| szerviz | oldal |
| --- | --- |
| Eki Autó Kft., Pécs | `/eki-auto` |
| Mobil Star (Bosch Car Service), Budapest | `/mobil-star` |
| Rapid Autószerviz, Szolnok | `/rapid-autoszerviz` |

Amiben eltér a burkoló demótól:

- **kilenc kérdés**, mert a DM azt ígéri, hogy addig kérdez, amíg meg nem van minden
- **alvázszám**, a saját indoklásával: egy típushoz több változat is tartozik
- **két folyam**: az első pontos árat ad egy vezérműszíj cserére, a második
  szándékosan *nem* ad árat egy bizonytalan tünetre, hanem diagnosztikát ajánl
- **nincs költségkeret-kérdés**, egy elromlott kuplungra senkinek nincs kerete
- **nincs távolság a tulajdonosi kártyán**, mert az ügyfél jön a szervizhez;
  helyette a kért időpont és az alkatrész-kategória látszik
- az ügyfél felé tegezés, a tulajdonos felé magázás, mert a DM is magázó
