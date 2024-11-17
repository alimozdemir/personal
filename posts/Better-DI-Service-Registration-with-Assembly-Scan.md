---
layout: doc
title: "Better DI Service Registration with Assembly Scan"
description: "Today, I will talk about a better way to register services for Microsoft’s DI container. Let’s have a look at the standard way of service registration."
date: "2020-05-30T19:16:17.609Z"
categories: "ASP.NET"
keywords: "dotnet,dependency injection,services"
thumbnail: '/img/1__e7BcghEYOwey5qOKNBcGaA.jpeg'
---

# Better DI Service Registration with Assembly Scan

Today, I will talk about a better way to register services for Microsoft’s DI container. Let’s have a look at the standard way of service registration.

```csharp
public void ConfigureServices(IServiceCollection services)
{
...
    services.AddTransient<ITestTransientService, TestTransientService>();
    services.AddScoped<ITestScopedService, TestScopedService>();
    services.AddSingleton<ITestSingletonService, TestSingletonService>();
...
}
```

There exists three types of object lifetime. I’m not going to explain all of them, since they are already well documented at [Microsoft Docs](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/dependency-injection?view=aspnetcore-3.1).

For small scale applications the above usage is very acceptable. However, managing a large scale applications might require different solutions.

![The blog picture](/img/1__e7BcghEYOwey5qOKNBcGaA.jpeg)

Now, I will show you 3 different solutions that you might like to use. First, I will consider all lifetimes separately. All three solutions require a NuGet package called [Scrutor](https://www.nuget.org/packages/Scrutor).

```shell
dotnet add package Scrutor
```

This package allows you to scan assemblies and register the services with implementations.

## Solution 1

We will create three different empty interfaces which mark the implementations for lifetime registration.

```csharp
public interface ITransient { }

public interface IScoped { }

public interface ISingleton { }

public interface ITransientService
{
    string GetValue();
}

public interface IScopedService
{
    string GetValue();
}

public interface ISingletonService
{
    string GetValue();
}

public class TransientService : ITransientService, ITransient
{
    private string guid = Guid.NewGuid().ToString();
    public string GetValue()
    {
        return guid;
    }
}

public class ScopedService : IScopedService, IScoped
{
    private string guid = Guid.NewGuid().ToString();
    public string GetValue()
    {
        return guid;
    }
}

public class SingletonService : ISingletonService, ISingleton
{
    private string guid = Guid.NewGuid().ToString();
    public string GetValue()
    {
        return guid;
    }
}
```

`ITransient`, `IScoped` and `ISingleton` interfaces will represent each one of the lifetimes. Next thing is `Startup.cs` file where magic happens.

```csharp
public void ConfigureServices(IServiceCollection services)
{
...
    services.Scan(i =>
        i.FromCallingAssembly()
        .AddClasses(c => c.AssignableTo<ITransient>())
        .AsImplementedInterfaces()
        .WithTransientLifetime()

        .AddClasses(c => c.AssignableTo<IScoped>())
        .AsImplementedInterfaces()
        .WithScopedLifetime()

        .AddClasses(c => c.AssignableTo<ISingleton>())
        .AsImplementedInterfaces()
        .WithSingletonLifetime()
        );
...
}
```

The following code will scan the current assembly with respect to given lifetime interfaces and register them into DI container.

## Solution 2

We can create attributes just like interfaces and use them similar to the first solution.

```csharp
public class TransientAttribute : Attribute
{
    public TransientAttribute()
    {
    }
}

public class ScopedAttribute : Attribute
{
    public ScopedAttribute()
    {
    }
}

public class SingletonAttribute : Attribute
{
    public SingletonAttribute()
    {
    }
}

[Transient]
public class TransientAttrService : ITransientService
{
    private string guid = Guid.NewGuid().ToString();
    public string GetValue()
    {
        return guid + " by Attribute";
    }
}

[Scoped]
public class ScopedAttrService : IScopedService
{
    private string guid = Guid.NewGuid().ToString();
    public string GetValue()
    {
        return guid + " by Attribute";
    }
}

[Singleton]
public class SingletonAttrService : ISingletonService
{
    private string guid = Guid.NewGuid().ToString();
    public string GetValue()
    {
        return guid + " by Attribute";
    }
}
```

We can register the attributes with `WithAttribute<T>` in `Startup.cs` file.

```csharp
public void ConfigureServices(IServiceCollection services)
{
...
   services.Scan(i => 
        i.FromCallingAssembly()
        .AddClasses(c => c.WithAttribute<TransientAttribute>())
        .AsImplementedInterfaces()
        .WithTransientLifetime()
        
        .AddClasses(c => c.WithAttribute<ScopedAttribute>())
        .AsImplementedInterfaces()
        .WithScopedLifetime()
        
        .AddClasses(c => c.WithAttribute<SingletonAttribute>())
        .AsImplementedInterfaces()
        .WithSingletonLifetime()
    );
...
}
```

Now we can use these attributes in the service implementations.

## Solution 3

So far, we handled the lifetimes separately. Let’s create a common attribute which contains a lifetime value and then decorate services with that attribute.

```csharp
public class InjectableAttribute : Attribute
{
    public ServiceLifetime Lifetime { get; }
    public InjectableAttribute(ServiceLifetime lifeTime = ServiceLifetime.Transient)
    {
        Lifetime = lifeTime;
    }
}

[Injectable(ServiceLifetime.Transient)]
public class TransientInjectableService : ITransientService
{
    private string guid = Guid.NewGuid().ToString();
    public string GetValue()
    {
        return guid + " by Injectable";
    }
}

[Injectable(ServiceLifetime.Scoped)]
public class ScopedInjectableService : IScopedService
{
    private string guid = Guid.NewGuid().ToString();
    public string GetValue()
    {
        return guid + " by Injectable";
    }
}

[Injectable(ServiceLifetime.Singleton)]
public class SingletonInjectableService : ISingletonService
{
    private string guid = Guid.NewGuid().ToString();
    public string GetValue()
    {
        return guid + " by Injectable";
    }
}
```

This looks better because now we can handle all lifetimes using the `ServiceLifetime` value provided by Microsoft’s library. Now, in order to scan services, I have created an extension method that iterates through all lifetime types.

```csharp
public static class ScrutorExtensions
{
    public static IImplementationTypeSelector InjectableAttributes(this IImplementationTypeSelector selector)
    {
        var lifeTimes = Enum.GetValues(typeof(ServiceLifetime)).Cast<ServiceLifetime>();

        foreach (var item in lifeTimes)
            selector = selector.InjectableAttribute(item);

        return selector;
    }

    public static IImplementationTypeSelector InjectableAttribute(this IImplementationTypeSelector selector, ServiceLifetime lifeTime)
    {
        return selector.AddClasses(c => c.WithAttribute<InjectableAttribute>(i => i.Lifetime == lifeTime))
            .AsImplementedInterfaces()
            .WithLifetime(lifeTime);
    }
}
```

Calling the extension method on `Startup.cs` . You can use either of them.

```csharp
public void ConfigureServices(IServiceCollection services)
{
    ...
    services.Scan(i =>
        i.FromCallingAssembly()
        .InjectableAttributes()
    );

    /* Or */
    services.Scan(i =>
        i.FromCallingAssembly()
        .InjectableAttribute(ServiceLifetime.Transient)
        .InjectableAttribute(ServiceLifetime.Scoped)
        .InjectableAttribute(ServiceLifetime.Singleton)
    );
    ...
}
```

## Run the examples

You can switch the startup settings and run the following controller.

```csharp
[ApiController]
[Route("[controller]")]
public class ServiceController : ControllerBase
{
    private readonly ITransientService _transientService;
    private readonly IScopedService _scopedService;
    private readonly ISingletonService _singletonService;

    public ServiceController(ITransientService transientService, IScopedService scopedService, ISingletonService singletonService)
    {
        _transientService = transientService;
        _scopedService = scopedService;
        _singletonService = singletonService;
    }

    [HttpGet("Transient")]
    public string Transient()
    {
        return _transientService.GetValue();
    }

    [HttpGet("Scoped")]
    public string Scoped()
    {
        return _scopedService.GetValue();
    }

    [HttpGet("Singleton")]
    public string Singleton()
    {
        return _singletonService.GetValue();
    }
}
```

Last solution is my favorite. It uses the ServiceLifetime as a parameter and you don’t need to repeat yourself for every single lifetime.

## Assembly

Examples above use `FromCallingAssembly` at the beginning of each scan, which would register services only in that specific ASP.NET Core Application. If you have separated your services from Application layer into a class library, you might want to use an entry point for that class library. For example, you can create a dummy class `ServiceEntryPoint` in that library and call `FromAssemblyOf<ServiceEntryPoint>()` then continue applying the rest of the settings.

## Bonus

In order to make things more easier, I would like to draw your attention to the power of reflection. Let’s say you have services that ends with postfix e.g `CountryBusinessService` , `OrderBusinessService` , `XBusinessService` . You can register them however you want, such as the example below.

```csharp
public void ConfigureServices(IServiceCollection services)
{
    ...
    services.Scan(i =>
        i.FromCallingAssembly()
        .AddClasses(c => c.Where(i => i.IsClass && i.Name.EndsWith("BusinessService")))
        .AsImplementedInterfaces()
        .WithTransientLifetime()
    );
    ...
}
```


## \[ServiceProvider\]

Scrutor has an attribute which works similar to the third solution. However, I could not find the documentation about how to use it. Therefore, I will not include it here.

Thanks for reading, you can reach out the source code from [here](https://github.com/alimozdemir/medium/tree/master/DIScan/attrService) !