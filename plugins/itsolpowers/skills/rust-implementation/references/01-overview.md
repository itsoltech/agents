# rust-implementation Reference Sector: Overview

## Zawartość

- Overview
- Cel dokumentu
- Zasady ogólne
- Ownership i borrowing
- Projektowanie API i typów
- Wybór struktur danych
- HashMap, hashowanie i klucze
- Iteratory i pętle ręczne
- Alokacje i zarządzanie pamięcią
- Bufory, bajty i dane binarne
- Równoległe przetwarzanie CPU-bound
- Async i Tokio
- Współdzielenie stanu i locki


## Cel dokumentu

Ten dokument służy jako checklist do code review dla projektów Rust. Obejmuje wydajność, zarządzanie pamięcią, async, SQLx, projektowanie API, testy, profilowanie, zależności i organizację kodu.

Checklist nie zastępuje pomiarów. Reguła, która poprawia jeden fragment kodu, może pogorszyć inny. Przy zmianach wydajnościowych porównuj czas, alokacje, użycie CPU, rozmiar binarki i czytelność kodu.
## Zasady ogólne

- najpierw pisz kod poprawny i czytelny, potem optymalizuj miejsca potwierdzone pomiarami
- nie optymalizuj całego projektu na podstawie intuicji
- traktuj hot path jako fragment wykonywany często, w pętli, na ścieżce requestu albo w kodzie o małym budżecie czasowym
- nie wprowadzaj złożonych typów, lifetimes, makr albo `unsafe`, jeśli prostszy kod spełnia wymagania
- dokumentuj decyzje techniczne tam, gdzie kod może wyglądać nietypowo
- każda optymalizacja powinna mieć powód: benchmark, profil, ograniczenie pamięci, rozmiar binarki albo wymaganie latency
## Ownership i borrowing

- unikaj niepotrzebnych `.clone()`, `.to_owned()`, `.to_string()`
- nie unikaj ownership na siłę - move `Vec`, `String`, `HashMap`, `Box<T>` jest tani, bo przenosi uchwyt, a nie całą zawartość z heapu
- unikaj kosztownego `clone()` dużych danych, jeśli wystarczy referencja, slice albo przeniesienie ownership
- funkcje tylko czytające powinny zwykle przyjmować `&T`, `&str`, `&[T]`, `&Path`
- funkcje, które przejmują dane i zapisują je w strukturze, mogą przyjmować `T`, `String`, `Vec<T>` albo `impl Into<T>`
- nie zwracaj `&Vec<T>` tam, gdzie wystarczy `&[T]`
- nie przyjmuj `&String`, jeśli wystarczy `&str`
- nie przyjmuj `&PathBuf`, jeśli wystarczy `&Path`
- używaj `Cow<'a, str>` / `Cow<'a, [T]>`, gdy dane zwykle są pożyczone, a ownership jest potrzebny tylko w części przypadków
- nie używaj `Cow` automatycznie zamiast `.clone()` - jeśli komplikuje API albo lifetimes, zwykły `String` / `Vec<T>` może być lepszy
- używaj `Arc<T>` w kodzie wielowątkowym, `Rc<T>` tylko w single-threaded
- używaj `Weak<T>` do unikania cykli referencji przy grafach, cache'ach, listenerach i strukturach rodzic-dziecko
- unikaj `Rc<RefCell<T>>` jako sposobu obchodzenia borrow checkera; dopuszczaj go głównie w strukturach grafowych, UI, parserach albo prototypach
- przy współdzielonych, rzadko modyfikowanych danych rozważ `Arc::make_mut` zamiast `Arc<Mutex<T>>`
- stosuj `Arc::clone(&value)` / `Rc::clone(&value)`, gdy chcesz pokazać, że klonujesz uchwyt, a nie głęboką kopię
- nie dodawaj `Clone` do typów domenowych bez powodu; `clone()` może ukrywać kosztowne kopie
- nie dodawaj `Copy` do dużych struktur; `Copy` jest dobre dla małych value objectów, ID, liczników, flag i prostych enumów
- jawnie podawaj lifetimes tylko tam, gdzie kompilator ich nie wywnioskuje albo gdzie zwiększa to czytelność API
## Projektowanie API i typów

- domyślnie używaj `pub(crate)`, a `pub` tylko na granicach crate'a
- nie wystawiaj publicznych pól, jeśli typ ma invariants
- używaj konstruktorów, `TryFrom`, `FromStr` albo builderów dla wartości wymagających walidacji
- używaj newtype dla ID, tenantów, kwot, jednostek, statusów, tokenów i wartości domenowych
- unikaj parametrów `bool` w publicznym API; zastąp je enumem opisującym intencję
- unikaj publicznych funkcji z długą listą argumentów; użyj structa, buildera albo command object
- używaj `Option<&T>` zamiast `&Option<T>`, jeśli funkcja potrzebuje opcjonalnej referencji
- używaj `Result<T, E>` dla operacji, które mogą się nie udać z powodu środowiska, danych wejściowych albo stanu systemu
- nie używaj `Result<T, String>` w publicznym API biblioteki
- dla enumów publicznych, które mogą dostać nowe warianty, rozważ `#[non_exhaustive]`
- dokumentuj warunki paniki w publicznych funkcjach
- dokumentuj invariants typów, których nie da się w pełni wymusić przez system typów
- oznaczaj buildery, guardy, transakcje i typy reprezentujące wynik operacji przez `#[must_use]`
- przy `#[must_use]` dodawaj komunikat, jeśli samo ostrzeżenie nie tłumaczy problemu
- rozważ `Box<dyn Trait>` / `&dyn Trait`, gdy potrzebujesz runtime polymorphism albo chcesz ograniczyć monomorfizację
- rozważ generics, gdy zależy Ci na static dispatch, inliningu i typach znanych w czasie kompilacji
- dla skończonej liczby wariantów implementacji rozważ enum zamiast trait object
- nie wystawiaj generyków w publicznym API, jeśli użytkownik crate'a nie zyskuje na tej elastyczności
## Wybór struktur danych

- używaj `Vec<T>` do sekwencyjnego dostępu i operacji push/pop z końca
- używaj `VecDeque<T>` do operacji z obu końców kolejki
- używaj `HashMap<K, V>` / `HashSet<T>` do szybkiego wyszukiwania po kluczu, gdy kolejność nie ma znaczenia
- używaj `BTreeMap<K, V>` / `BTreeSet<T>`, gdy potrzebny jest porządek, stabilna iteracja albo zakresy
- używaj `IndexMap` / `IndexSet`, gdy potrzebujesz mapy hashującej ze stabilną kolejnością iteracji
- unikaj wyszukiwania liniowego (`find`, `position`, `contains`) na dużych kolekcjach
- dla małych kolekcji `Vec` + liniowe wyszukiwanie może być szybsze niż `HashMap`
- dla posortowanych danych rozważ `binary_search`, `partition_point`, `dedup`, `dedup_by`
- dla membership check w małych zbiorach rozważ posortowany `Vec` zamiast `HashSet`
- dla tablic o stałym rozmiarze używaj `[T; N]`
- dla danych o znanym rozmiarze, które po zbudowaniu nie będą rosnąć, rozważ `Box<[T]>`
- dla współdzielonych niemutowalnych danych rozważ `Arc<[T]>` albo `Arc<str>`
- nie używaj `Vec<Box<T>>`, jeśli nie potrzebujesz stabilnych adresów, trait objectów albo zmniejszenia rozmiaru dużych enumów
- przy dużych kolekcjach ustawiaj capacity z góry: `Vec::with_capacity`, `HashMap::with_capacity`, `String::with_capacity`
## HashMap, hashowanie i klucze

- nie polegaj na kolejności iteracji `HashMap`
- jeśli kolejność ma znaczenie, użyj `BTreeMap` albo `IndexMap`
- dla map tworzonych w hot path ustawiaj capacity z góry
- nie klonuj `String` tylko po to, żeby zrobić lookup; korzystaj z lookupu po `&str`, gdy typ klucza na to pozwala
- unikaj tworzenia tymczasowego `String` przy każdym dostępie do mapy
- przy małych integer key i wewnętrznych mapach rozważ szybszy hasher dopiero po benchmarku
- nie zmieniaj domyślnego hashera dla map zależnych od danych użytkownika bez analizy ryzyka HashDoS
- dla często używanych kluczy rozważ internowanie stringów, newtype albo ID liczbowe
- przy cache'ach zawsze ustal limit rozmiaru, TTL albo strategię usuwania danych
## Iteratory i pętle ręczne

- preferuj iteratory, gdy skracają kod i zachowują czytelność
- używaj zwykłego `for`, gdy logika ma wiele warunków, efektów ubocznych albo wymaga debugowania krok po kroku
- unikaj `for i in 0..len` z indeksowaniem, gdy da się użyć `iter`, `enumerate`, `zip`, `chunks`, `windows`
- nie używaj `for_each` tylko po to, żeby nie pisać pętli `for`
- nie twórz `.collect::<Vec<_>>()` tylko po to, żeby potem od razu iterować po wektorze
- używaj `filter_map`, `find_map`, `map_while`, `flatten`, gdy usuwają dodatkowe przejścia po danych
- używaj `try_fold` / `try_for_each` przy iteracji z możliwością wcześniejszego zwrócenia błędu
- używaj `chunks`, `chunks_exact`, `array_chunks`, `windows`, gdy przetwarzasz dane porcjami
- używaj `by_ref()`, gdy chcesz zużyć część iteratora i dalej korzystać z tego samego iteratora
- przy implementacji własnych iteratorów podawaj sensowny `size_hint`
- implementuj `ExactSizeIterator`, `DoubleEndedIterator`, `FusedIterator` tylko wtedy, gdy invariants są spełnione
- nie zakładaj, że iterator chain zawsze jest szybszy od pętli; sprawdzaj hot path benchmarkiem
## Alokacje i zarządzanie pamięcią

- minimalizuj alokacje w hot path
- używaj `&str` zamiast `String` w argumentach funkcji, gdy funkcja tylko czyta tekst
- używaj `&[T]` zamiast `Vec<T>` w argumentach funkcji, gdy funkcja tylko czyta elementy
- używaj `String::with_capacity()` + `push_str` / `push` zamiast wielokrotnego `+=`
- unikaj `format!` w pętlach; buduj `String` przez `write!` do istniejącego bufora
- reuse'uj bufory przez `clear()` zamiast tworzyć nowe w każdej iteracji
- używaj `reserve` / `try_reserve` przed dużym batch insert, parse albo generowaniem tekstu
- nie wywołuj `shrink_to_fit()` w hot path
- używaj `retain`, `drain`, `split_off`, `truncate`, `mem::take`, gdy pozwalają uniknąć budowania drugiej kolekcji
- dla małych wektorów rozważ `smallvec`, `tinyvec` albo tablice na stacku
- dla małych stringów rozważ `smol_str`, `compact_str`, `smartstring`
- przy dużych strukturach sprawdzaj rozmiar przez `std::mem::size_of::<T>()`
- zwracaj uwagę na duże warianty enumów; największy wariant wpływa na rozmiar całego enumu
- jeśli enum ma jeden bardzo duży wariant, rozważ `Box<LargeVariant>`
- nie pakuj wszystkiego w `Box`, jeśli nie ma powodu związanego z rozmiarem, rekurencją, trait objectem albo stabilnym adresem
- dla hot path unikaj niepotrzebnych alokacji w closures, logach i mapowaniu błędów
## Bufory, bajty i dane binarne

- używaj `&[u8]` dla funkcji tylko czytających dane bajtowe
- używaj `Vec<u8>` dla danych budowanych i posiadanych przez aktualny komponent
- używaj `bytes::Bytes` dla taniego klonowania, slicingu i współdzielenia payloadów
- używaj `BytesMut` do budowania bufora, który później ma stać się `Bytes`
- nie konwertuj danych binarnych do `String`, jeśli nie są tekstem
- unikaj wielokrotnego kopiowania payloadów między warstwami HTTP, kolejkami i parserami
- dla parserów preferuj pracę na slice'ach i offsetach zamiast tworzenia nowych stringów
- dla dużych plików używaj streamingu zamiast ładowania całości do pamięci
- przy pracy z UTF-8 rozróżniaj bajty, znaki Unicode i grapheme clusters
## Równoległe przetwarzanie CPU-bound

- używaj Rayona dla CPU-bound operacji na dużych kolekcjach
- używaj `par_iter()`, `par_iter_mut()`, `into_par_iter()` tylko tam, gdzie koszt pracy przewyższa overhead podziału
- traktuj progi typu liczba elementów albo czas jednej iteracji jako heurystykę, nie regułę
- profiluj przed i po zmianie `.iter()` na `.par_iter()`
- nie używaj Rayona dla I/O-bound pracy; dla I/O używaj async albo kontrolowanej puli workerów
- unikaj `par_iter()`, gdy każda iteracja bierze lock, robi alokację albo odwołuje się do współdzielonego zasobu
- preferuj `par_chunks()` / `par_chunks_mut()` dla dużych danych przetwarzanych porcjami
- dla redukcji używaj `par_iter().reduce()`, `fold()`, `sum()`, `min()`, `max()` zamiast ręcznego zbierania wyników pod lockiem
- używaj redukcji tylko dla operacji łącznych; przy float wynik może różnić się przez inną kolejność działań
- nie używaj `for_each` do efektów ubocznych, jeśli kolejność wyniku ma znaczenie
- jeśli kolejność wyniku ma znaczenie, używaj `par_iter().map(...).collect::<Vec<_>>()` na kolekcjach indeksowanych
- nie traktuj `par_bridge()` jako mechanizmu zachowania kolejności
- dla danych strumieniowych zbieraj porcje do `Vec`, przetwarzaj porcję równolegle, a zapis/output wykonuj sekwencyjnie
- nie konfiguruj globalnego thread poola Rayona w bibliotece bez zgody aplikacji
- jeśli domyślny pool nie pasuje, twórz lokalny pool przez `ThreadPoolBuilder`
## Async i Tokio

- nie używaj `tokio::spawn` automatycznie; jeśli wynik jest potrzebny od razu, zwykłe `.await` jest prostsze
- używaj `tokio::spawn` dla niezależnych zadań, których lifecycle jest kontrolowany przez `JoinHandle`, `JoinSet` albo supervisor
- nie porzucaj `JoinHandle`, jeśli wynik albo panic taska ma znaczenie
- używaj `spawn_blocking` dla krótkich operacji blokujących albo sync I/O
- dla ciężkiego CPU-bound używaj Rayona, dedykowanej puli albo `spawn_blocking` z limitem przez `Semaphore`
- nie zakładaj, że `spawn_blocking` da się anulować po starcie
- unikaj `.await` w pętlach, gdy zadania mogą działać równolegle przez `FuturesUnordered`, `buffer_unordered`, `join_all` albo `try_join_all`
- nie używaj jednego ogromnego `join_all` dla nieograniczonej liczby future; ogranicz równoległość
- dodawaj timeouty do operacji I/O, requestów HTTP, zapytań zewnętrznych i acquire z puli
- używaj bounded channeli tam, gdzie producent może zalać konsumenta
- stosuj backpressure zamiast nieskończonych kolejek
- nie trzymaj locka przez `.await`, jeśli da się skopiować dane, skrócić sekcję krytyczną albo zmienić strukturę kodu
- do krótkiej ochrony zwykłych danych w async kodzie dopuszczalne jest `std::sync::Mutex` albo `parking_lot::Mutex`
- `tokio::sync::Mutex` stosuj, gdy lock musi być trzymany przez `.await` albo chroniony zasób jest async
- unikaj nested locków; jeśli są konieczne, opisz stałą kolejność ich brania
- przy `select!` z `biased;` ustaw branch shutdown/cancellation wysoko, jeśli ma mieć pierwszeństwo
- przy pętlach z `select!` sprawdzaj cancellation safety używanych metod
- każdy długi task powinien reagować na shutdown przez `CancellationToken`, kanał albo inny jawny mechanizm
- nie blokuj runtime przez sync filesystem, sync networking, `std::thread::sleep` albo ciężkie CPU w async tasku
- używaj `tokio::time::sleep`, `tokio::fs`, klientów async albo `spawn_blocking` dla kodu sync
## Współdzielenie stanu i locki

- nie używaj `Arc<Mutex<T>>` jako domyślnego sposobu przekazywania danych
- jeśli dane mają jednego właściciela, przekazuj ownership przez kanał
- jeśli zasób jest sekwencyjny, rozważ actor/task posiadający zasób i komunikację przez channel
- jeśli shared state jest mały i operacje są krótkie, użyj `Mutex`
- jeśli odczytów jest dużo, a zapis rzadki, rozważ `RwLock`, ale mierz kontencję
- nie zakładaj, że `RwLock` zawsze jest szybszy od `Mutex`
- nie trzymaj locka podczas I/O, zapytań do bazy, logowania albo `.await`
- nie wykonuj kosztownych operacji w sekcji krytycznej
- unikaj globalnego mutable state; jeśli jest potrzebny, opisz lifecycle i zasady dostępu
- przy atomikach dokumentuj, dlaczego wybrano dane `Ordering`
- używaj `Atomic*` tylko dla prostych stanów; nie buduj skomplikowanego protokołu synchronizacji bez testów
- przy własnych strukturach współbieżnych rozważ testy przez `loom`
