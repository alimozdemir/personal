---
layout: doc
title: "Design Pattern Serisi 1: Singleton"
description: "Herkese merhaba, öncelikle neden başlıkta ingilizce terimler kullandığıma değinmek istiyorum. Yazılım dünyasında ağırlıklı dilin ingilizce olduğu ve bu tür terimlerin türkçe karşılığı bana çok anlamlı gelmediği için bu şekilde başlık atma gereği duydum. Design Pattern için Tasarım Deseni çevirisi yapılabilir. Belki TDK buna farklı bir isim verirse daha güzel olabilir ancak ben yine de bu tür ünlü terimleri ingilizce bırakarak makale serime devam etmek istiyorum."
date: "2018-09-03T06:56:15.319Z"
categories: "Design Pattern"
keywords: "dotnet,design patterns,tasarim kalibi,singleton"
thumbnail: "/img/1__b1Z3NB5cxQL5preMW4nCiw.png"
---

# Design Pattern Serisi 1: Singleton

Herkese merhaba, öncelikle neden başlıkta ingilizce terimler kullandığıma değinmek istiyorum. Yazılım dünyasında ağırlıklı dilin ingilizce olduğu ve bu tür terimlerin türkçe karşılığı bana çok anlamlı gelmediği için bu şekilde başlık atma gereği duydum. Design Pattern için Tasarım Deseni çevirisi yapılabilir. Belki TDK buna farklı bir isim verirse daha güzel olabilir ancak ben yine de bu tür ünlü terimleri ingilizce bırakarak makale serime devam etmek istiyorum.

Makale serimi C# üzerinde uygulayacağım. Ve .NET Core platformu üzerinden göstereceğim. Burada gerçekleştirilmiş tüm kodlara bu linkten [Github](https://github.com/lyzerk/medium/tree/master/DesignPatternSingleton) ulaşabilirsiniz.

## Singleton Pattern

![Singleton Pattern Class Diagram](/img/1__b1Z3NB5cxQL5preMW4nCiw.png)
Singleton Pattern Class Diagram

Bu design pattern en basit olanlarından biridir. Varsayalımki projenizde öyle bir sınıfa ihtiyaç var ki sadece sizin tarafınızda oluşturulup tek bir noktadan kullanılmasını istiyorsunuz. Bu durumda bu design pattern devreye giriyor ve küçük nüanslarla bizi büyük dertlerden kurtarabiliyor. Elde etmek istediğimiz yapı sol taraftaki Class Diagram’ında gösterilmektedir. Öncelikle ilk aşamadan başlayarak örnek sınıfımızı oluşturup gösterelim. Daha sonra bu sınıfı adım adım nasıl Singleton Pattern yapacağımızı görelim.

```csharp
public class ActionHistory_V1 : IActionHistory
{
    private Stack<string> _history { get; set; }

    public ActionHistory_V1()
    {
        if (File.Exists("actions.txt"))
        {
            var lines = File.ReadAllLines("actions.txt");

            _history = new Stack<string>(lines.ToList());
        }
        else
            _history = new Stack<string>();
    }
    public void AddAction(string action)
    {
        _history.Push(action);
    }
    public void Save()
    {
        File.WriteAllLines("actions.txt", _history);
    }
    public string RetriveLastAction()
    {
        return _history.FirstOrDefault();
    }
    public List<string> RetriveAllActions()
    {
        return _history.ToList();
    }
}
```

Uygulamanın ilk versiyonu

Aksiyon geçmişini hafızada tutan ve gerektiği zaman kaydedebilen bir sınıf oluşturdum. Böyle bir sınıfın bir projede tek bir elden kullanılması doğru bir yaklaşım sağlayacaktır. Yukarıdaki hali ile kullanmak istersek sadece yeni bir instance açmamız bize kullanımını sağlayacaktır. Ancak, bu sınıf birden fazla oluşturulursa her bir instance kendine ait `Stack<string>` tutacaktır ve ona göre dosyaya kaydetme işlemi yapacaktır ancak biz bunu istemiyoruz.

Öncelikle, Singleton Pattern’ın en can alıcı kısmı constructor kısmının erişebilirlik düzeyini `public` den `private` yapmamız gerekmekte. Bu sayede bu sınıfı kendi içi dışında hiç bir yerde oluşturamayacağız. Oluşturmaya çalıştığımızda da bu hata ile karşılaşacağız.

> ActionHistory\_V1.ActionHistory\_V1()’ is inaccessible due to its protection level

Bu yaklaşım ile bu sınıfı sadece tek bir yerde yani kendi içinde oluşturabileceğiz. Sınıfı bu şekilde düzenleyebiliriz.

```csharp
public class ActionHistory_V2 : IActionHistory
{
    private static readonly ActionHistory_V2 instance = new ActionHistory_V2();
    public static ActionHistory_V2 Instance { get; } = instance;

    private ActionHistory_V2()
    {
        ....
    }
    
    ....
}
```

Uygulamanın ikinci versiyonu

Bu şekilde projede aşağıdaki şekilde kullanımı sağlanacaktır. Sınıf içerisinde buluna Instance özelliğine erişerek sınıfı elde etmemiz yetecektir. Daha sonrasında sınıfı istediğimiz şekilde kullanmamız için hazır.

IActionHistory history = ActionHistory\_V2.Instance;  
history.AddAction(“delete”);  
var lastAction = history.RetrieveLastAction();

Ancak burada da bir sorun ile karşılaşıyoruz, o da bu oluşturduğumuz sınıf daha ağır yüklü bi sınıf olabilir o yüzden programın başlangıcında oluşturulması (static olarak tanımladığımız ve oluşturduğumuz için program açıldığında sınıfı oluşturacaktır.), programın açılış süresini etkileyebilir. Bunun için `Instance` özelliği (property) ilk istenildiğinde oluşturulması akılcı bir çözüm olabilir. Daha bitmedi ! burada aynı anda birden fazla erişim yapılırsa instance birden fazla oluşturulabilir, o yüzden bu kısmın `Critical Section`olarak dikkate alınması gerekmektedir. Bu yüzden o kod bloğunu `lock` keywordu ile kilitleyip `thread-safe` yapabiliriz. Ancak ben sizi bunlarla uğraştırmayacağım.

.NET de bulunan `Lazy<T>` yapısını kullanarak, bu objenin hem istenildiği zamanda hem de `thread-safe` olarak oluşturulmasını sağlayacağız.

```csharp
public class ActionHistory_V3 : IActionHistory
{
    private static Lazy<ActionHistory_V3> instance =
                    new Lazy<ActionHistory_V3>(() => new ActionHistory_V3());
    public static ActionHistory_V3 Instance { get; } = instance.Value;

    private ActionHistory_V3()
    {
        ....
    }
    
    ....
}
```

Uygulamanın son versiyonu

Bu çözüm ile birlikte ilk kullanım sırasında, gerektiğinde sınıfı oluşturacak ve programın açılış hızında yavaşlama sağlamayacaktır. Yine de bu yaklaşımda her sınıfa göre değişebilir. Siz kendi sınıfınızın amacına ve özelliklerine göre ayrı bir şekilde tasarım yapmanız gerekebilir. Bu yüzden bu tür yaklaşımlarda kurallara uymak yerine kuralları esneterek kendinize göre bir çözüm üretmeniz gerekecektir.

Yukarıdaki kodların tamamlanmış haline [buradan](https://github.com/lyzerk/medium/tree/master/DesignPatternSingleton) erişebilirsiniz. Bir sonraki yazıda görüşmek üzere.

## Kaynaklar

[**Design Patterns Singleton Pattern**  
_Design Patterns Singleton Pattern - Learning java design patterns in simple and easy steps : A beginner's tutorial…_www.tutorialspoint.com](https://www.tutorialspoint.com/design_pattern/singleton_pattern.htm "https://www.tutorialspoint.com/design_pattern/singleton_pattern.htm")[](https://www.tutorialspoint.com/design_pattern/singleton_pattern.htm)

[**Singleton pattern - Wikipedia**  
_In software engineering, the singleton pattern is a software design pattern that restricts the instantiation of a class…_en.wikipedia.org](https://en.wikipedia.org/wiki/Singleton_pattern "https://en.wikipedia.org/wiki/Singleton_pattern")[](https://en.wikipedia.org/wiki/Singleton_pattern)