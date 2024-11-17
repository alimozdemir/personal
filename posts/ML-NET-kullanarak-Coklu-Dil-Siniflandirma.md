---
title: "ML.NET kullanarak çoklu dil sınıflandırma"
description: "Bu yazımda Microsoft’un makine öğrenmesi kütüphanesi olan ML.NET’i kullanarak dil sınıflandırma yapacağım. Örnek vermek gerekirse, dökümanları, yazıları vb. şeylerin dillerini tespit edebileceğiz. İşe kendi eğitim ve test verilerimizi oluşturarak başlayacağım."
date: "2019-01-30T11:36:33.410Z"
categories: "Machine Learning"
keywords: "dotnet,mlnet,naive bayes,classification,sınıflandırma"
thumbnail: "/img/1__f3sXaYpdqlhYKPlED0J6mg.jpeg"
---

Herkese yeniden merhaba,

Bu yazımda Microsoft’un makine öğrenmesi kütüphanesi olan ML.NET’i kullanarak dil sınıflandırma yapacağım. Örnek vermek gerekirse, dökümanları, yazıları vb. şeylerin dillerini tespit edebileceğiz. İşe kendi eğitim ve test verilerimizi oluşturarak başlayacağım.

<!--more-->

### Veri kümesinin hazırlanması

Veri kümemizi oluşturmak için Wikipedia sayfalarını kullandım. Bu blog yazısı için python üzerinde [bir script](https://github.com/lyzerk/medium/blob/master/MLNet/MulticlassLanguageClassifier/Data/main.py) dosyası hazırladım. Python üzerinde bulunan [wikipedia kütüphanesi](https://pypi.org/project/wikipedia/) ile istenilen sayfaların içeriğini çekerek bunları test ve eğitim kümesi olarak ayırıyorum. Ben bu makale için üç dil seçtim; Türkçe, İngilizce ve İspanyolca. Bu her üç dil için neredeyse aynı oranda başlık seçmeye çalıştım. Bu script dosyası ile önceden belirlemiş olduğum sayfaların içeriklerini alıp python [nltk](http://www.nltk.org) (natural language toolkit) kütüphanesini kullanarak cümlelere bölüyorum. Ve ardından `1/4` oranında test/eğitim verilerimi ayırıyorum. Eğer veri kümesini genişletmek istersek script dosyamıza yeni makaleler ekleyebiliriz. Örneğin;

titles.append((“Mustafa Kemal Atatürk”, “tr”))  
titles.append(("Pablo Picasso", "es"))  
titles.append(("Abraham Lincoln", "en"))

Ardından `$ python main.py`komutu ile çalıştırdığımızda train.txt ve test.txt dosyasımızı oluşturacak. Oluşan dosyaların formatı aşağıdaki gibidir

tr Cumhuriyet Dönemi Türkiye Ansiklopedisi.  
es Picasso finalizó el poema en seis actos...  
en Native Americans were also often...

Ayıraçı `\t` karakteri olarak belirledim.

![ML.NET](/img/1__f3sXaYpdqlhYKPlED0J6mg.jpeg)

### Modelin hazırlanması

Sıra modelimizi hazırlayamaya geldi. Ben bu makaleyi ML.NET 0.5.0 versiyonu ile hazırlamaya başlamıştım ancak 0.6.0 versiyonunda eski API’ların hepsi Legacy namespace’inin altına taşınarak yeni yapıya geçince, ben de bu yeni halinin oturmasını bekledim ve sonunda 0.9.0 versiyonu ile birlikte kodumu yeniden düzenleyerek makaleme devam edebildim.

#### Pipeline ve Model

Hazırlamış olduğumuz verileri ML.NET API tarafından tanıtmamız gerekiyor. ML.NET temel olarak bir ana sınıf ile ilerliyor o da `MLContext` sınıfı, bu sınıf ile birlikte verilerimizi tanımlıyoruz.

```csharp
string dataPath = "train.txt", testDataPath = "test.txt";
var context = new MLContext();

// Create textloader for our structure
var textLoader = context.Data.CreateTextReader(new TextLoader.Arguments()
{
    Separator = "\t",
    Column = new[] {
                    new TextLoader.Column("Label", DataKind.Text, 0),
                    new TextLoader.Column("Sentence", DataKind.Text, 1)
                }
});

var trainDataView = textLoader.Read(dataPath);
var testDataView = textLoader.Read(testDataPath);
```

`CreateTextReader` methodu ile birlikte girilen verilerin şemasını belirliyoruz. Read methodu ile bu şema dosyalarının yollarını birbirine bağlıyoruz. Ayrıca belirtmek isterim ki, buraya kadar hiç bir dosya yükleme işlemi yapılmadı.

Sıra da pipeline dediğimiz, bir dizi işlemi ardı ardına yapmakta olan veri yapısını oluşturacağız. Burada yapının güzelliğinden bahsetmek istiyorum, verilmiş olan verilerin teker teker sonuç kısmına kadar hangi işlemlerden geçeceğini alttaki kod parçacığında belirtiyoruz.

```csharp
// Create data process pipeline
// First we have to change label value into ML.NET KeyType
var dataProcessPipeline = context.Transforms.Conversion.MapValueToKey("Label")
    // Then, we have to normalize text
    .Append(context.Transforms.Text.NormalizeText("Sentence", "NormalizedSentence"))
    // Featurize the given text with n-grams
    .Append(context.Transforms.Text.FeaturizeText("NormalizedSentence", "Features"))
    // Give the naive bayes algorithm
    .Append(context.MulticlassClassification.Trainers.NaiveBayes())
    // Convert back the label value to it's origin
    .Append(context.Transforms.Conversion.MapKeyToValue("PredictedLabel"));
```

1.  Öncelikle, “Label” değişkeni string kabul edilmemekte bu yüzden onu ML.NET içerisinde bulunan KeyType tipine çeviriyoruz. MapValueToKey(“Label”)
2.  Daha sonra verilen cümlelerdeki özel karakterleri/büyük küçük harfleri kaldırıyoruz (normalize) ediyoruz. NormalizeText(“Sentence”, “NormalizedSentence”). Burada yakalanması gereken nokta, normalize edilmiş veri artık “NormalizedSentence” olarak adlandırılması.
3.  Burada ML.NET’in bir özelliği olan FeaturizeText methodunu kullanacağız. Verilen text değerini n-gramlara ayırmakta, örneğin 2-gram için “merhaba” kelimesini “me”, “er”, “rh”, “ha”, “ab”, “ba”. Şeklinde ayırıp bir dizi oluşturmaktadır. Burada dikkat edilmesi gereken nokta pipeline üzerinde ML algoritması verilmeden önce “Features” alanının oluşması lazım. O yüzden bu methottan çıkan değere “Features” ismini veriyoruz.
4.  Sıra ML algoritmasını seçmekte, ben Naive Bayes algoritması ile devam edeceğim.
5.  En son olarak da yaptığımız tüm bu iş hattından çıkan KeyType tipindeki sonucumuzu “Label” da ki değerlere geri çeviriyoruz.

Şimdi bu pipeline’a ilk aşamada oluşturmuş olduğumuz IDataView arayüzümüzü verip modelimizi oluşturacağız. (Şimdi dosyaları okumaya başladık !)

```csharp
// Create our model with train data
var model = dataProcessPipeline.Fit(trainDataView);
```

Artık bu model sınıfımız ile birlikte tahminlerimizi gerçekleştirebiliriz. Öncelikle tahmin mekanizması için 2 adet sınıfa ihtiyacımız var, biri yukarıda tanıtmış olduğumuz pipeline’a eş değer olan sınıf (Label ve Sentence). Diğeri ise sonuç sınıfımız. Bunları tanımlayarak başlıyoruz.

```csharp
public class SentenceData
{
    public string Label { get; set; }
    public string Sentence { get; set; }
}
public class PredictionData
{
    public string PredictedLabel { get; set; }
}
```

Tek bir cümle ile modelimizi test edelim. Blizzard’ın ünlü kart oyunu Heartstone’un ispanyolca kısmından aldığım bir cümleyi test etmek için kullanacağım.

```csharp
// Create single prediction engine
var predictionEngine = model.CreatePredictionEngine<SentenceData, PredictionData>(context);
// Create the testing data
var testData = new SentenceData() { Sentence = "Enfunda tu espada, saca tu baraja y prepárate para disfrutar con Hearthstone, un trepidante juego de cartas de estrategia, fácil de aprender y salvajemente divertido. Inicia una partida gratuita y utiliza tus mejores cartas para lanzar hechizos, invocar criaturas y dar órdenes a los héroes de Warcraft en épicos y estratégicos duelos." };
// Predict the testing data
var result = predictionEngine.Predict(testData);

Console.WriteLine("Predicted language {0}", result.PredictedLabel);
```

Veee sonuç beklediğimiz gibi çıkıyor !

Predicted language es

#### Modelimiz ne kadar başarılı oldu ?

Sıra modelimizi değerlendirme sürecine geldi. Veri kümesinin hazırlanması kısmında gerçek verinin 1/4'ünü bu aşama için ayırmıştık.

```csharp
var testPredictions = model.Transform(testDataView);
var metrics = context.MulticlassClassification.Evaluate(testPredictions);
Console.WriteLine();
Console.WriteLine("Model quality metrics evaluation");
Console.WriteLine("------------------------------------------");
Console.WriteLine($"Accuracy Macro: {metrics.AccuracyMacro}");
```

İlk satırda modelimiz ile test verimizi ilişkilendiriyoruz, ikinci satırda ise bu ilişkilendirdiğimiz modeli değerlendirmeye alıyoruz.

Model quality metrics evaluation  
 — — — — — — — — — — — — — — — — — — — — —   
Accuracy Macro: 0.985645367576614

Görüldüğü üzere doğruluk değerimiz yüksek çıktı ama bu aklımıza başka bir sorunu getirebilir. Modelimiz _overfit_ mi oldu ? bu yüzden veriyi ve modeli daha detaylı inceleyip ona göre bakmamız gerekecek ama ben daha kolaya kaçacağım ve makaleyi de uzun tutmamak adına twitter üzerinde modelimizi test edeceğim.

Bunun için Netflix’in Türkiye ([netflixturkiye](http://www.twitter.com/netflixturkiye)), Amerika ([netflix](http://www.twitter.com/netflix)) ve İspanya ([NetflixES](http://www.twitter.com/NetflixES)) twitter hesaplarının son 400 tweetini test edeceğim. Reply tweetlerini exclude ediyorum.

Not: İçerisinde sadece link, resim ve ya mention içeren tweetleri doğru tahmin edemiyor haliyle.

```csharp
TweetTest.UsersTimelineTest(predictionEngine, "NetflixES", "es", 400);
TweetTest.UsersTimelineTest(predictionEngine, "netflix", "en", 400);
TweetTest.UsersTimelineTest(predictionEngine, "netflixturkiye", "tr", 400);
```

Örnek kodumuz bu şekilde siz isterseniz farklı tweet hesaplarında deneyebilirsiniz. (twittersettings.json dosyası oluşturup API authentication bilgilerini girmeniz gerekmektedir.)

Getting [@NetflixES](http://twitter.com/NetflixES "Twitter profile for @NetflixES")'s recent tweets..  
Last 78 tweets from 80 are in 'es' class  
Getting [@netflix](http://twitter.com/netflix "Twitter profile for @netflix")'s recent tweets..  
Last 116 tweets from 121 are in 'en' class  
Getting [@netflixturkiye](http://twitter.com/netflixturkiye "Twitter profile for @netflixturkiye")'s recent tweets..  
Last 53 tweets from 56 are in 'tr' class

Sonuçlar istediğimiz türde çıkıyor, büyük bir oranda doğru tahmin edilmiş. [tweet.txt](https://github.com/lyzerk/medium/blob/master/MLNet/MulticlassLanguageClassifier/CSharp/tweet.txt) dosyasından benim makaleyi yazarken ki sonuçlarıma bakabiliriz. Dosyayı incelediğimizde en çok fark İngilizce olanda var, bakıldığında ispanyolca tweetler atıldığını görebiliyoruz. Ayrıca bir kaç kelimeyi de tanıyamadığını gözlemleyebiliyoruz. Bunun için eğitim havuzumuzu genişletmemizde fayda var.

#### Sonuç

Bu yöntem ile metinleri belirli özniteliklere göre sınıflandırabilirsiniz. Son olarak bu makaledeki kaynak koda aşağıdan ulaşabilirsiniz.

[**lyzerk/medium**  
_Medium's story work repository. Contribute to lyzerk/medium development by creating an account on GitHub._github.com](https://github.com/lyzerk/medium/tree/master/MLNet/MulticlassLanguageClassifier "https://github.com/lyzerk/medium/tree/master/MLNet/MulticlassLanguageClassifier")[](https://github.com/lyzerk/medium/tree/master/MLNet/MulticlassLanguageClassifier)

#### Kaynaklar

[http://www.diva-portal.org/smash/get/diva2:839705/FULLTEXT01.pdf](http://www.diva-portal.org/smash/get/diva2:839705/FULLTEXT01.pdf)

[**Micro Average vs Macro average Performance in a Multiclass classification setting**  
_Thanks for contributing an answer to Data Science Stack Exchange! Please be sure to answer the question. Provide…_datascience.stackexchange.com](https://datascience.stackexchange.com/questions/15989/micro-average-vs-macro-average-performance-in-a-multiclass-classification-settin/16001 "https://datascience.stackexchange.com/questions/15989/micro-average-vs-macro-average-performance-in-a-multiclass-classification-settin/16001")[](https://datascience.stackexchange.com/questions/15989/micro-average-vs-macro-average-performance-in-a-multiclass-classification-settin/16001)

[**ML.NET Content Guide**  
_Learn how to build custom AI solutions and integrate them into your .NET applications using ML.NET._docs.microsoft.com](https://docs.microsoft.com/en-us/dotnet/machine-learning/ "https://docs.microsoft.com/en-us/dotnet/machine-learning/")[](https://docs.microsoft.com/en-us/dotnet/machine-learning/)