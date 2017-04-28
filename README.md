# API Dökümantasyonu

# 1-) En çok dinlenen ilk 10 şarkı ve şarkı arama

Kullanıcıdan ilk defa bilgi alırken en popüler şarkılar listelenecek ve kullanıcının şarkı ismine göre arama yapabilecek

```sh
Backend 
send to mining /playlistRecommendation?type=0

Mining 
response 
[
    {
        sarkiId : int, 
        sarkiismi : string,
        sanatciIsmi : string,
        genreId : int 
    },
    {
        sarkiId : int, 
        sarkiismi : string,
        sanatciIsmi : string,
        genreId : int 
    },
    ...
]
```

# 2-) Kullanıcıya özel playlist sunulması

Kullanıcı giriş yaptıktan sonra 4 farklı playlist önerilecek. Bu öneriler kullanıcının geçmiş dinlemeleri, favori şarkı ve türlerine göre yapılacak. 
**Burada kullanılacak olan ülke ve tür ( genre ) verileri ortak bir şekilde statik olarak kullanılacak !**
**0 = Pop 1 = Rock gibi ülkelerde aynı şekilde 0 = Amerika , 1 = Almanya vs... !**
Type = 
- 1 - ) Kişiye özel öneri
- 2 - ) Her türe özel 3 er tane öneri
- 3 - ) Ülkeye özel öneri
- 4 - ) Yaşa göre öneri

Yaş verisini -+5 olarak hesaplanacak. 25 yollanırsa 20-30 arası kullanıcılar dikkate alınacak
```sh
Backend 
send to mining  /playlistRecommendation?type=1,2,3,4&userId=useridblabla&ulkeId=ulkeid&yas=22

Mining 
response 
[
    {
        sarkiId : int, 
        sarkiismi : string,
        sanatciIsmi : string,
        genreId : int 
    },
    {
        sarkiId : int, 
        sarkiismi : string,
        sanatciIsmi : string,
        genreId : int 
    },
    ...
]
```

# 3-) Playlistlerde dinlenilen şarkılar kaydedilecek

Bu playlistlerde her dinlenen sarkının idsi ve genreID'si 'user_stat' kaydedilecek.

# 4-) Favori Tuşu

Her şarkı favoriye eklenebilir olacak.(kalp tuşu vb.)

# 5-) Sağ tarafta Sidebar (Kişiye özel istatistikler)
Sağ tarafta kullanıcıya özel istatistikler olacak.Burada ;
 - Bu şarkı kaç defa dinlendi
 - Kullanıcının toplamda kaç sarkı dinlendiği 
 - Bu şarkının populer olduğu ulkeler
 - Bu muzik turunde kaç sarkı dinlendi
 - Kullanıcının en çok dinlediği şarkı türleri

 
```sh
Backend 
send to mining  /userStatistics?userId=userid&sarkiId=sarkiid&genreId=genreid&

Mining 
response 
    {
        listenedCount : int, 
        userSongCount : int,
        listenedCountries : [ülkeid1, ülkeid2],
        genreSongCount : int, 
        listenedGenres : [genreid1,genreid2]
    }
```

# 6-) Genel istatistikler

    - Toplam kullanıcısı sayısı 
    - Toplam şarkı sayısı
    - Şarkıların toplam dinlenme sayısı
    - vs vs buraya eklenir


```sh
Backend 
send to mining  /mainStatistics

Mining 
response 

    {
        1 : int, 
        2 : string,
        3 : string,
        4 : int 
    }
```


