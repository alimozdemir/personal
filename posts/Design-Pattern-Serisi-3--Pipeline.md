---
title: "Design Pattern Serisi 3: Pipeline"
description: "Temiz ve yalın kod yazmak yazılım dünyasında olmazsa olmaz şeylerin başında geliyor. Bunu sağlamak için bir çok yol var bizde bunlardan birine değineceğiz."
date: "2019-07-12T13:41:04.561Z"
categories: "Design Pattern"
keywords: "dotnet,design patterns,tasarim kalibi,pipeline"
thumbnail: "/img/1____rmi8y7yxQSL8dVXnVA__4A.png"

---

Temiz ve yalın kod yazmak yazılım dünyasında olmazsa olmaz şeylerin başında geliyor. Bunu sağlamak için bir çok yol var bizde bunlardan birine değineceğiz.

Bu yaklaşım birden fazla yerde kullanılıyor, örneğin ASP.NET Core üzerinde http istekleri bir pipeline (veri hattı) ile işlenmekte ve bu işlenme sırasında aralara iyi bir şekilde müdahale edilebilmektedir. Ayrıca, ML.NET’de bu yaklaşım üzerine kurulmuştur. Benim şahsi kanaatim, bu yapıyı birden fazla şekilde hayata geçirebilirsiniz, o yüzden doğaçlama yapmaktan çekinmeyin. Fazla sözü uzatmadan örneğimize geçelim.

Benim yapacağım örnekte yapı 3 farklı bölümden oluşmaktadır. Bunlardan ilki işlerin türeyeceği interface, işlerin daha kolay anlaşılmasını ve unit test yazarken bize kolaylık sağlayacak `IPipeObject`.

```csharp
public interface IPipeObject
{
  IPipeObject NextPipe { get; set; }
  void Next(object state);
  void Invoke(object state);
}
```

İçerisinde bulunan şeylere gelirsek, yapılacak işi `Invoke` methodu yapacak.`Next` ve `NextPipe` ise bir sonraki işe geçmemizde yardımcı olacak. Burada dikkat edilmesi gereken nokta `Next` ve `Invoke` methodlarının bir state objesi almış olduğu, bu obje sayesinde iki iş (pipe) arasında veri taşınmaktadır.

Bir diğeri ise, bu interface sınıfının bir parçasının implement’e edilmiş halinin bulunduğu `PipeObject` .

```csharp
public abstract class PipeObject : IPipeObject
{
  public IPipeObject NextPipe { get; set; }

  public void Next(object state)
  {
    this.NextPipe?.Invoke(state);
  }

  public abstract void Invoke(object state);
}
```

Bu sınıfta ise, bir sonra ki işi çağırmamızı sağlayacak olan `Next` methodunun uygulanışını yapıyoruz. Yukarıda dediğim gibi bu işi birden fazla şekilde yapabiliriz, örneğin `Next` methodunu kaldırıp, `NextPipe` üzerindende gidilip bir sonraki iş çağrılabilir.

Son ana sınıfımız ise, iş hattımızı başlatacak ve gerekli bilgileri barındıracak sınıf `Pipeline`.

```csharp
public class Pipeline
{
    private IPipeObject _pipeStart, _pipeEnd;

    public Pipeline Append(IPipeObject pipe)
    {
        if (_pipeStart == null)
            _pipeStart = pipe;

        if (_pipeEnd != null)
            _pipeEnd.NextPipe = pipe;

        _pipeEnd = pipe;
        return this;
    }
    public void Start(object state = null)
    {
        _pipeStart.Invoke(state);
    }
}
```

Sınıf veri hattının başlangıç ve bitiş noktasını tutmakta, bunlar bizim bir sonraki işi, eklenen işe bağlarken yardımcı olacak. `Append` method’u eğer veri hattında hiç bir iş yoksa, veri hattının başlangıcını belirlemekte. Ve eğer, ikinci iş ve sonraki işler ekleniyorsa, kuyruk şeklinde işleri birbirine bağlamaktadır. `_pipeEnd` değişkeni sürekli en son eklenen işi işaret etmektedir. Bu şekilde eklenen tüm işler birbirine bağlanmaktadır. `Start` methodu ile birlikte de iş hattımızı bir değer ile başlatabilmekteyiz.

Ana hatlar tamamlandıysa, şimdi örnek bir veri hattı oluşturabiliriz. Örneğimiz girilen cümleyi belirli işlemlerden geçirerek ekrana yazdırmak olacak. Bunun için aşağıdaki grafiği inceleyebiliriz.

![Örnek Pipeline 1](/img/1____rmi8y7yxQSL8dVXnVA__4A.png)
Örnek Pipeline 1

Aşamalar,

*   Küçük harflere çevir `Lower`
*   Kelimelere böl `Split`
*   Boşluklardan arındır `IgnoreWhiteSpaces`
*   Ekrana yazdır `Outputer`

```csharp
class Lower : PipeObject
{
    public override void Invoke(object state)
    {
        var str = (string)state;

        this.Next(str.ToLower());
    }
}

class Split : PipeObject
{
    public override void Invoke(object state)
    {
        var str = (string)state;

        var split = str.Split();

        foreach (var item in split)
        {
            this.Next(item);
        }
    }
}

class IgnoreWhiteSpaces : PipeObject
{
    public override void Invoke(object state)
    {
        var str = (string)state;

        if (!string.IsNullOrWhiteSpace(str))
            this.Next(str);
    }
}

class ConsoleOutput : PipeObject
{
    public override void Invoke(object state)
    {
        var item = (string)state;

        Console.WriteLine(item);
    }
}
```

Lafı uzatmamak için bu işlerin hepsini tek gist’te göstereceğim,`Invoke` methodlarına bakarsak her yapılan iş çok basit ve temiz bir şekilde yapıldığını görebiliriz. Ayrıca,`Next` methodu ile birlikte veriyi bir sonraki veri hattına gönderiyoruz. Şimdi kodu çalıştırıp sonuçları görebiliriz.

```csharp
class Program
{
    static void Main(string[] args)
    {
        Pipeline pipeline = new Pipeline();

        pipeline.Append(new Lower())
            .Append(new Split())
            .Append(new IgnoreWhiteSpaces())
            .Append(new ConsoleOutput());

        string line = "   Lorem    ipsum dolor sit amet, consectetur adipiscing   elit.  ";

        pipeline.Start(line);
    }
}
```

Sonuç

![](/img/1__eePVFdv5U5OL9DB769FLWg.png)

#### Tests

Bu kadar gelmişken unit test yazmadan olmaz. Hemen xUnit üzerinden tüm sınıflarımız için testlerimizi yazıyoruz. Burada sadece önemli testleri göstereceğim.

```csharp
[Fact]
public void AppendPipe_PointNextPipe()
{
    // This test verifies that pipeobjects are connected with each other
    var mock1 = new Mock<IPipeObject>();
    var mock2 = new Mock<IPipeObject>();
    var mock3 = new Mock<IPipeObject>();
    var mock4 = new Mock<IPipeObject>();
    var pipeline = new Pipeline();

    pipeline.Append(mock1.Object)
        .Append(mock2.Object)
        .Append(mock3.Object)
        .Append(mock4.Object);

    mock1.VerifySet(i => i.NextPipe = mock2.Object);
    mock2.VerifySet(i => i.NextPipe = mock3.Object);
    mock3.VerifySet(i => i.NextPipe = mock4.Object);

    Assert.Equal(mock1.Object, pipeline.Head);
    Assert.Equal(mock4.Object, pipeline.Tail);
}
```

Pipeline sınıfındaki `Append` methodu doğru çalışmasını kontrol etmemiz için yukarıdaki test’i yazıyoruz. Önceden de belirttiğim gibi interface bize unit test yazarken yardımcı olacak demiştim, 4 adet `IPipeObject` mock’luyoruz. Ve her birini `Append` ederek `NextPipe` değişkenlerinin birbirlerine ardışık olarak atanıp atanmadıklarını kontrol ediyorum. Buna ilaveten veri hattının başlangıç ve bitiş noktasını da kontrol ediyorum.

Asıl amacımız olan veri hattındaki işlerin testlerini test etmemiz mühim. Veri hattına giren ve çıkan veriyi kolayca kontrol edebilmekteyiz.

```csharp

[Fact]
public void LowerPipe_InputOutput_VerifyNextInvoke()
{
    var mock = new Mock<IPipeObject>();
    var lower = new Lower();
    // Set a mock object to the next pipe
    lower.NextPipe = mock.Object;

    string input = "HelLo";
    // Do the work
    lower.Invoke(input);

    //Output
    string expected = input.ToLower();
    
    // Check if the next pipe's invoke method is called with right parameter
    mock.Verify(i => i.Invoke(expected));

    mock.VerifyNoOtherCalls();
}
```

Yukarıda tanımlamış olduğumuz `PipeObject` lerin her birinin testini aşağıda görebilirsiniz.

```csharp
[Fact]
public void SplitPipe_InputOutput_VerifyNextInvoke()
{
    var mock = new Mock<IPipeObject>();
    var split = new Split();

    split.NextPipe = mock.Object;
    string input = "a sentence with split requires";
    split.Invoke(input);

    var expected = input.Split();
    mock.Verify(i => i.Invoke(expected[0]));
    mock.Verify(i => i.Invoke(expected[1]));
    mock.Verify(i => i.Invoke(expected[2]));
    mock.Verify(i => i.Invoke(expected[3]));
    mock.Verify(i => i.Invoke(expected[4]));

    mock.VerifyNoOtherCalls();
}

[Fact]
public void IgnoreWhiteSpacesPipe_Input_VerifyNextInvoke()
{
    var mock = new Mock<IPipeObject>();
    var whiteSpaces = new IgnoreWhiteSpaces();

    whiteSpaces.NextPipe = mock.Object;
    string input = "1";
    whiteSpaces.Invoke(input);

    mock.Verify(i => i.Invoke(input));

    mock.VerifyNoOtherCalls();
}

[Fact]
public void IgnoreWhiteSpacesPipe_Input_VerifyNoNextInvoke()
{
    var mock = new Mock<IPipeObject>();
    var whiteSpaces = new IgnoreWhiteSpaces();

    whiteSpaces.NextPipe = mock.Object;
    string input = "   ";
    whiteSpaces.Invoke(input);

    mock.Verify(i => i.Invoke(input), Times.Never);

    mock.VerifyNoOtherCalls();
}
```

#### Sonuç

Bu yapı ile birlikte daha temiz ve düzenli kod yazabilmenin bir yolunu göstermiş olduk. Yukarıdaki kodların proje haline aşağıdan erişebilirsiniz.

[**lyzerk/medium**  
_Medium's story work repository. Contribute to lyzerk/medium development by creating an account on GitHub._github.com](https://github.com/lyzerk/medium/tree/master/DesignPatternPipeline "https://github.com/lyzerk/medium/tree/master/DesignPatternPipeline")[](https://github.com/lyzerk/medium/tree/master/DesignPatternPipeline)

#### Referanslar

[**ASP.NET Core Middleware**  
_Learn about ASP.NET Core middleware and the request pipeline._docs.microsoft.com](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/middleware/?view=aspnetcore-2.2 "https://docs.microsoft.com/en-us/aspnet/core/fundamentals/middleware/?view=aspnetcore-2.2")[](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/middleware/?view=aspnetcore-2.2)

[**What is ML.NET and how does it work? - ML.NET**  
_ML.NET gives you the ability to add machine learning to .NET applications. With this capability, you can make automatic…_docs.microsoft.com](https://docs.microsoft.com/en-us/dotnet/machine-learning/how-does-mldotnet-work "https://docs.microsoft.com/en-us/dotnet/machine-learning/how-does-mldotnet-work")[](https://docs.microsoft.com/en-us/dotnet/machine-learning/how-does-mldotnet-work)