---
title: "Design Pattern Serisi 2: Object Pool"
description: "Merhaba, bu seferki yazımda bir başka design pattern anlatacağım. Projelerimizde sınıfların oluşturulması bazen pahalıya patlayabiliyor. Bellekten gereksiz yer ayırma (allocation) durumunda performans sorunları ortaya çıkabiliyor. Bu tür performans sorunlarını çözmek için sınıfların yeniden oluşturulmasını engellemek bir çözüm olabilir. Bunun için Object Pool Design Pattern bulunmakta. Ayrıca, .NET Framework SQL Connection üzerinde bu Design Pattern kullanılmaktadır."
date: "2018-09-05T12:01:55.277Z"
categories: "Design Pattern"
keywords: "dotnet,design patterns,tasarim kalibi,object pool"
thumbnail: "/img/1__odCuMsqO33z35l6yN0aURw.png"
---

# Design Pattern Serisi 2: Object Pool

Merhaba, bu seferki yazımda bir başka design pattern anlatacağım. Projelerimizde sınıfların oluşturulması bazen pahalıya patlayabiliyor. Bellekten gereksiz yer ayırma (allocation) durumunda performans sorunları ortaya çıkabiliyor. Bu tür performans sorunlarını çözmek için sınıfların yeniden oluşturulmasını engellemek bir çözüm olabilir. Bunun için Object Pool Design Pattern bulunmakta. Ayrıca, .NET Framework SQL Connection üzerinde bu Design Pattern kullanılmaktadır.


Serinin bir önceki yazısında anlattığım Singleton Pattern’i burada kullanmamız gerekecek çünkü Object Pool tek elden yönetilmesi ve kullanılması gerekmektedir. Ayrıca, kullanılmasını veya üretilmesini istediğimiz sınıfın abstract olarak tanımlayıp sadece Object Pool assembly’si tarafından üretilmesini sağlayacağız. Ayrıca, kaynak kodları makalenin sonunda bulunmaktadır.

![The blog image](/img/1__odCuMsqO33z35l6yN0aURw.png)

Öncelikle yapımızın UML Class Diagram halini göstermek istiyorum. Buradaki amacımız Client sınıfına doğrudan erişimi kapatıp, bu sınıfa ait tek elden türetilmiş bir Client sınıfı elde etmek istiyoruz. Olayın amacını daha detaylı anlatmak gerekirse, `AcquireObject()` metotu ile oluşturulmasını beklediğimiz objenin oluşturulmasını yada bize hazırda olan objeyi vermesini bekliyoruz. Burada bir istisna bulunmakta, eğer havuz boş ise ve oluşturulması gereken obje sayısı sınıra ulaşılmış ise havuzdan null pointer dönmektedir. Ancak bu kısım için Exception atılması da sağlanabilir. `ReleaseObject()` metotu ile kullanmış olduğumuz objeyi geri iade ediyoruz. Burada dikkat edilmesi gereken en önemli nokta alınan objenin kullanıldıktan sonra havuza geri verilmesi, eğer geri verilmezse havuzda eksik objeler bulunacak. Ve sistem eksik bir şekilde çalışmasına devam edecek. Eğer havuzun limiti size yetmiyorsa `IncreaseSize()` metotu ile havuzu büyütebiliriz. Temel olarak ulaşmak istediğimiz yapı bu, artık bu diyagramı koda dökebiliriz.

## Gerçekleme (Implementation)

Önceki makalede yaptığım gibi burada da C# dilinde devam edip .NET Core üzerinden gerçekleyeceğiz.

```csharp
public abstract class Client
{
    public abstract void Connect();
}
internal class RequestClient : Client
{
    public override void Connect()
    {
        Console.WriteLine("Connecting to something with RequestClient...");
    }
}
```

Client sınıfımızın yapısından bahsederek başlamak istiyorum. Tasarladığınız sistemde `ClientPool`, `Client` ve `RequestClient` sınıfları ayrı bi DLL içerisinde bulunduğunu varsayalım. Client sınıfı `abstract` olarak yazıldığı için kendi başına varlığını sürdüremeyecektir, bu nedenle RequestClient sınıfı Client sınıfından türetilmiştir. Buradaki dikkat edilmesi gereken nokta RequestClient sınıfının `internal` anahtar sözcüğü ile tanımlanmış olması. Bu nedenle o DLL dışında hiç bir yerde üretilmeyeceğini ve erişilemeyeceğini garanti ediyoruz.

```csharp
public class ClientPool
{
    private static Lazy<ClientPool> instance
        = new Lazy<ClientPool>(() => new ClientPool());
    public static ClientPool Instance { get; } = instance.Value;
    public int Size { get { return _currentSize; } }
    public int TotalObject { get { return _counter; } }

    private const int defaultSize = 5;
    private ConcurrentBag<Client> _bag = new ConcurrentBag<Client>();
    private volatile int _currentSize;
    private volatile int _counter;
    private object _lockObject = new object();

    private ClientPool()
        : this(defaultSize)
    {
    }
    private ClientPool(int size)
    {
        _currentSize = size;
    }

    public Client AcquireObject()
    {
        if (!_bag.TryTake(out Client item))
        {
            lock (_lockObject)
            {
                if (item == null)
                {
                    if (_counter >= _currentSize)
                        // or throw an exception, or wait for an object to return.
                        return null;

                    item = new RequestClient();

                    // it could be Interlocked.Increment(_counter). Since, we have locked the section, I don't think we need that.
                    _counter++;

                }
            }

        }

        return item;
    }

    public void ReleaseObject(Client item)
    {
        _bag.Add(item);
    }
    public void IncreaseSize()
    {
        lock (_lockObject)
        {
            _currentSize++;
        }
    }
}
```

Sıra geldi ana sınıfımıza, öncelikle sınıfımız thread-safe Singleton Pattern’i sağlamaktadır. Bu sayede proje üzerinde sadece tek bir ClientPool sınıfı kullanabilir halde olacağız. Sınıfımızda maksimum üretilebilecek Client sayısını ayarlamamız için `_currentSize` değişkeni bulunmaktadır. Görüldüğü üzere havuzun başlangıç boyutunu 5 olarak belirledim ancak tabii ki bu değişebilir. Ayrıca, sınıf tamamen thread-safe olarak kodlanmıştır. Bunu sağlamak için [ConcurrentBag\<T\>](https://docs.microsoft.com/en-us/dotnet/api/system.collections.concurrent.concurrentbag-1?view=netframework-4.7.2) adlı .NET sınıfı ile birlikte AcquireObject ve IncreaseSize metotlarını lock kullanarak thread-safe yapmış bulunuyoruz.

AcquireObject metotunu anlatarak devam edeceğim, öncelikle bag listemizden obje almaya çalışıyoruz `_bag.TryTake(out Client item)` kodu ile aldığımız objenin durumunu kontrol ediyoruz eğer obje doğru ise objemizi dönderiyoruz eğer obje yok ise havuzun durumuna bakarak yeni bir obje oluşturuyoruz yada null pointer dönderiyoruz.

ReleaseObject metotu ile de almış olduğumuz objeleri sisteme geri iade ederek yeniden kullanıma sunuyoruz. Geri bırakılmadığı taktirde, kaynakların doğru kullanımı gerçekleşemeyecektir.

IncreaseSize metotu havuzun boyutunu büyütmek için kullanılmaktadır. Tabii ki sisteminizin gerekliliklerine göre bu metot değiştirilebilir yada varyasyonları eklenebilir.

Örnek kullanım görelim.

```csharp
static void BasicExample()
{
    Console.WriteLine("Havuzun boyutu {0}", ClientPool.Instance.Size);

    Console.WriteLine("Client sınıfı ediniyoruz.");
    var client1 = ClientPool.Instance.AcquireObject();

    client1.Connect();

    Console.WriteLine("Client'ı geri bırakıyoruz");
    if (client1 != null)
        ClientPool.Instance.ReleaseObject(client1);

    var clients = new List<Client>();
    for (int i = 0; i < ClientPool.Instance.Size; i++)
    {
        clients.Add(ClientPool.Instance.AcquireObject());
    }

    Console.WriteLine("Uygun olan tüm Client nesneleri listeye eklendi.");

    var nullClient = ClientPool.Instance.AcquireObject();

    if (nullClient == null)
        Console.WriteLine("Daha fazla Client sınıfı bulunmamaktadır.");

    Console.WriteLine("Havuzun boyutunu arttırıyoruz");
    ClientPool.Instance.IncreaseSize();

    Console.WriteLine("Yeni bir Client sınıfı ediniyoruz.");
    var newClient = ClientPool.Instance.AcquireObject();
    
    newClient.Connect();

    Console.WriteLine("Edindiğimiz sınıfı geri veriyoruz.");
    if (newClient != null)
        ClientPool.Instance.ReleaseObject(newClient);

    Console.WriteLine("Listedeki tüm Client sınıflarını geri bırakıyoruz.");

    foreach (var item in clients)
        ClientPool.Instance.ReleaseObject(item);
}
```

Yukarıdaki kodun çıktısı aşağıdaki gibidir.

Havuzun boyutu 5  
Client sınıfı ediniyoruz.  
Connecting to something with RequestClient...  
Client'ı geri bırakıyoruz  
Uygun olan tüm Client nesneleri listeye eklendi.  
Daha fazla Client sınıfı bulunmamaktadır.  
Havuzun boyutunu arttırıyoruz  
Yeni bir Client sınıfı ediniyoruz.  
Connecting to something with RequestClient...  
Edindiğimiz sınıfı geri veriyoruz.  
Listedeki tüm Client sınıflarını geri bırakıyoruz.

## Sonuç

Object Pool Design Pattern’ı gerçekledik. Bu gerçekleme sırasında hazırlamış olduğunuz Client ve RequestClient sınıflarını sadece bulunduğu DLL üzerinde üretilmesini sağladık. Bu yaklaşım ile RequestClient sınıfımızı kısıtlayarak özelleştirmelere kapattık. Ayrıca, ClientPool sınıfının tüm metotlarını thread-safe yaparak daha tutarlı bir yapı elde ettik.

Değinmek istediğim bir başka nokta ise, bu gerçeklemede havuza boyut verdik ama sizin durumlarınızda bu boyut yerine zaman kısıtlaması kullanabilirsiniz. Örneğin obje 1 dakika kullanılmazsa belleğe geri verilmesi gibi. Veyahut, bu sınırlamaları komple kaldırıp gerektiğinde yeni obje oluşturmasını ya da var olanı yeniden kullanım için vermesini sağlayabilirsiniz. (Kaynaklardaki Microsoft’un örneği bu şekildedir.)

Kaynak kodlarına [buradan](https://github.com/lyzerk/medium/tree/master/DesignPatternObjectPool) ulaşabilirsiniz. Bir sonraki yazıda görüşmek üzere.

## Kaynaklar

[**Object pool pattern - Wikipedia**  
_The object pool design pattern creates a set of objects that may be reused. When a new object is needed, it is…_en.wikipedia.org](https://en.wikipedia.org/wiki/Object_pool_pattern "https://en.wikipedia.org/wiki/Object_pool_pattern")[](https://en.wikipedia.org/wiki/Object_pool_pattern)

[**Design Patterns and Refactoring**  
_Design Patterns and Refactoring articles and guides. Design Patterns video tutorials for newbies. Simple descriptions…_sourcemaking.com](https://sourcemaking.com/design_patterns/object_pool "https://sourcemaking.com/design_patterns/object_pool")[](https://sourcemaking.com/design_patterns/object_pool)

[**How to: Create an Object Pool by Using a ConcurrentBag**  
_This example shows how to use a concurrent bag to implement an object pool. Object pools can improve application…_docs.microsoft.com](https://docs.microsoft.com/en-us/dotnet/standard/collections/thread-safe/how-to-create-an-object-pool "https://docs.microsoft.com/en-us/dotnet/standard/collections/thread-safe/how-to-create-an-object-pool")[](https://docs.microsoft.com/en-us/dotnet/standard/collections/thread-safe/how-to-create-an-object-pool)

[**Object Pool Pattern | Object Oriented Design**  
_Intent - reuse and share objects that are expensive to create._www.oodesign.com](https://www.oodesign.com/object-pool-pattern.html "https://www.oodesign.com/object-pool-pattern.html")[](https://www.oodesign.com/object-pool-pattern.html)