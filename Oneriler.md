# Müzik Botu – Eklenebilecek Özellikler (Amaç: Müzik + Radyo)

Aşağıdakiler botun amacının dışına çıkmadan eklenebilir.

---

## 1. Favori Radyolar (Öncelikli)

- Kullanıcı 3–5 radyo istasyonunu “favori” olarak kaydedebilir.
- `/radyo favori` veya panelde **⭐ Favorilerim** butonu ile listeyi açıp tek tıkla o istasyona geçebilir.
- Veri: SQLite’da `user_id` + `station_id` (veya JSON); mevcut `Database.js` ile tutulabilir.

**Kapsam:** Sadece radyo, kullanıcı tercihi.

---

## 2. Çalma Geçmişi (Son Çalınanlar)

- Sunucuda son 5–10 çalınan şarkı kaydedilir.
- Yeni komut: `/soncalinan` veya `/gecmis` → listeyi embed’de gösterir; isteğe “#3’ü tekrar çal” gibi seçenek (select menu).
- İsteğe bağlı: “Hepsini tekrar kuyruğa ekle” butonu.

**Kapsam:** Sadece müzik kuyruğu, tekrar dinleme.

---

## 3. Kuyrukta Sıra Değiştirme

- `/move <sira> <hedef>` örn. `/move 3 1` → 3. şarkı 1. sıraya alınır.
- Veya `queue` embed’ine “Yukarı / Aşağı” butonları (ilk 5 şarkı için).

**Kapsam:** Müzik kuyruğu yönetimi.

---

## 4. “Devam Et” / Son Şarkıyı Tekrarla

- `/devam` veya `/tekrarla`: Şu an çalan veya en son çalan şarkıyı kuyruğun başına tekrar ekler (tek tıkla “aynı şarkıyı tekrar çal”).
- Veri gerekmez; `queue.currentTrack` veya son bırakılan track yeterli.

**Kapsam:** Müzik, kullanıcı kolaylığı.

---

## 5. Radyo “Şu An Çalan” (ICY Metadata)

- Bazı radyolar (Power FM, vb.) ICY metadata ile şarkı adı gönderir.
- FFmpeg/stream tarafında metadata parse edilip radyo embed’indeki “Anlık Şarkı” alanı güncellenebilir: “Canlı Radyo” yerine “Artist - Şarkı Adı”.
- Teknik: Stream’den gelen metadata’yı okuyup periyodik güncelleme.

**Kapsam:** Sadece radyo bilgisi, deneyim artışı.

---

## 6. Basit İstatistik (İsteğe Bağlı)

- Sunucuda “en çok çalınan 5 şarkı” veya “en çok dinlenen 3 radyo” (track URL / station_id sayacı).
- `/istatistik` ile embed’de gösterilir.
- Veri: SQLite’da play_count / station_play_count.

**Kapsam:** Müzik + radyo kullanım özeti, eğlence.

---

## 7. Ses Preset’leri

- `/volume` zaten var; ek olarak: “Gece modu %40”, “Parti %100” gibi tek tıkla ses seviyesi.
- Slash seçenek: `/volume seviye: gece|normal|parti` veya butonlar.

**Kapsam:** Sadece ses, mevcut volume komutunun geliştirmesi.

---

## Özet Öncelik

| Özellik              | Zorluk | Etki   | Amaçla uyum |
|----------------------|--------|--------|-------------|
| Favori radyolar      | Orta   | Yüksek | ✅          |
| Son çalınanlar       | Orta   | Yüksek | ✅          |
| Kuyrukta sıra (move) | Düşük  | Orta   | ✅          |
| Devam et / tekrarla  | Düşük  | Orta   | ✅          |
| Radyo metadata       | Orta   | Orta   | ✅          |
| İstatistik           | Orta   | Orta   | ✅          |
| Ses preset           | Düşük  | Düşük  | ✅          |

Hepsi müzik ve radyo deneyimini iyileştirir; moderasyon, ekonomi veya oyun eklemez.
