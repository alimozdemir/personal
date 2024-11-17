---
title: "ASP.NET Core: Concatenating JSON endpoints"
description: "Most commonly faced scenario about API design is you want to serialize a POCO class or a different type of objects to JSON with direct serializer. Then get the serialized value and use it. If you are handling big objects/data/files, then you have to be careful with what you do. Otherwise, it can have devastating impacts on the performance."
date: '2021-03-06T10:00:00.515Z'
thumbnail: '/img/concatenate/jeff-dewitt-stream.jpg'
categories: "ASP.NET"
keywords: "aspnetcore,json.net,stream,pipeline,httpclient"
---

# ASP.NET Core: Concatenating JSON endpoints

> TLDR; We have redirected an http client response into ASP.NET Core response with the desired structure.

Most commonly faced scenario about API design is you want to serialize a POCO class or a different type of objects to JSON with direct serializer. Then get the serialized value and use it. If you are handling big objects/data/files, then you have to be careful with what you do. Otherwise, it can have devastating impacts on the performance.

---

<img src="/img/concatenate/jeff-dewitt-stream.jpg" class="image-center" alt="Photo by Jeff DeWitt on Unsplash" />

Assume that you have multiple endpoints which returns JSON results and you are trying to concatenate them into a single structure. In that case, you can read the endpoints and allocate them into memory. Then manipulate them according to your wishes.

## Data preparation and tests

Before everything I would like to explain the demo code. So, I have several endpoints from [JSONPlaceholder](https://jsonplaceholder.typicode.com/). And, I would like to collect them into a dictionary with their key value. I implemented the base code with async/await parallelism. **So, no matter what, we are getting the data without blocking each other. Let's see the base code**.

```csharp
public Dictionary<int, string> Sources { get; set; } = new Dictionary<int, string>()
{
    { 0, "albums" },
    { 1, "todos" },
    { 2, "comments" },
    { 3, "photos" },
};

public async Task<ConcatenateModel<JRaw>> FetchData(Func<string, Task<JRaw>> funcPointer)
{
    List<Task> tasks = new List<Task>();

    ConcatenateModel<JRaw> result = new ConcatenateModel<JRaw>() { Data = new ConcurrentDictionary<int, JRaw>() };

    async Task Fetch(KeyValuePair<int, string> source)
    {
        var fetchResult = await funcPointer(source.Value);
        result.Data.AddOrUpdate(source.Key, fetchResult, (key, oldValue) => fetchResult);
    }

    foreach (var item in Sources)
    {
        tasks.Add(Fetch(item));
    }

    await Task.WhenAll(tasks);

    return result;
}
```

The Json.NET is one of the most advanced JSON libraries in .NET world. The library contains a `JRaw` type that you can use it for already serialized strings. 

> **Meaning that, don't serialize that value, it is already serialized.**

`funcPointer` implementation is making the request and returns a `JRaw` object. `FetchData` returns that desired structure.

```csharp
public async Task<JRaw> GetAsRaw(string route)
{
    var response = await httpClient.GetAsync(route);
    var stringData = await response.Content.ReadAsStringAsync();

    return new JRaw(stringData);
}

[HttpGet]
public async Task<ConcatenateModel<JRaw>> Get()
{
    return await FetchData(this.GetA  sRaw);
}
```

When we call the method, the result is shown below.

<img src="/img/concatenate/result.png" class="image-center" alt="Article desired structure" />

So, we have implemented a reliable solution for the case. The method concatenates multiple JSON results with respect to their keys and returns an object. For such a case, performance matters. The endpoints could return large responses. 

First, I would like to disable server garbage collection (Please see notes at end of the article). Performance test of the action could be prepared with JMeter. So, I have setup a JMeter thread group with **5** users x **200** loop count x **random timer**.

Requests are completed in 00:03:34 with average 750ms. Aside from the request completion time, CPU and memory usage is also important.

<img src="/img/concatenate/benchmark1.png" class="image-center" alt="Benchmark 1" />

Too much GC triggers and memory usage is between **140MB**~**170MB**.

## Improving Performance

The `GetAsRaw` method reads the entire result from the request. Then pass it into the result model. ASP.NET Core handles the rest. The problem here we are reading the whole result then allocate it into memory. 

As most of you know, you can complete your http request when the headers are fetched. So, you don't have to wait for the whole request to be completed.  If we enable such a feature, we can't use `JRaw` with a string, it should switch to `Stream`.

```csharp
public async Task<JRaw> GetAsStream(string route)
{
    var hrm = new HttpRequestMessage(HttpMethod.Get, route);
    var response = await httpClient.SendAsync(hrm, HttpCompletionOption.ResponseHeadersRead);

    var stream = await response.Content.ReadAsStreamAsync();

    return new JRaw(stream);
}

[HttpGet]
public async Task<ConcatenateModel<JRaw>> Get()
{
    return await FetchData(this.GetAsStream);
}
```
Json.NET directly calls `ToString` method for any object. So, in this case we need to consume that stream and write it into the result set without extra memory allocation.

```csharp
public class StreamConverter : JsonConverter<Stream>
{
    public override Stream ReadJson(JsonReader reader, Type objectType, [AllowNull] Stream existingValue, bool hasExistingValue, JsonSerializer serializer)
    {
        throw new NotImplementedException();
    }

    public override void WriteJson(JsonWriter writer, [AllowNull] Stream value, JsonSerializer serializer)
    {
        PipeReader reader = PipeReader.Create(value);
        
        while (true)
        {
            // read sync, if JsonConverter supports async WriteJson in future, we should replace it.
            var read = reader.ReadAsync().Result;

            if (read.IsCompleted)
                break;

            // get buffer
            var buffer = read.Buffer;

            // if it does not have a length, just dont write any value and skip this iteration.
            if (buffer.Length == 0)
                continue;

            // maybe in future, writeraw supports byte[], then we shouldn't use GetString
            var raw = Encoding.UTF8.GetString(buffer.ToArray());
            writer.WriteRaw(raw);

            // advance to next buffer
            reader.AdvanceTo(buffer.End);
        }

        // final step
        // if you don't write a raw value, the converter will write a null value.
        string? empty = null;
        writer.WriteRawValue(empty);
    }
}
```

Above `JsonConverter` will consume the given stream and write it into result set without allocation. (*Pipeline rocks*)

Also, we have to introduce `StreamConverter` to the controllers.

```csharp
services.AddControllers().AddNewtonsoftJson((n) =>
{
    n.SerializerSettings.Converters.Add(new StreamConverter());
});
```

I have implemented the second solution as v2.0 and when we invoke the solution the result is the same.

## Let's check the performance

I have applied the same JMeter thread group for v2.0. The requests are completed in 00:03:33 with average 743ms.

<img src="/img/concatenate/benchmark2.png" class="image-center" alt="Benchmark 2" />

Less GC triggers than original solution and memory usage decreased between **70MB**~**100MB**.

## Conclusion

This article is based on an unique case. Most of the time we don't use JRaw and Stream objects for endpoints. However, when we need to implement such a scenario, every single byte becomes important. **Basically, we have redirected the http client response into ASP.NET Core response with the desired structure.**

## Notes

Since the first solution allocate the string object in Large Object Heap (LOH) the memory usage got high. Therefore, second solution is using 4k buffers and allocate at GC0-GC1.

Json.NET is a very good library for such an advanced cases. Unfortunately, it does not have async support.

I have disabled server garbage collection for the tests. When it is enabled, the first solution still triggers GC more. The optimized solution trigger GC more less. Also, CPU usage is more stable with the optimized solution.

![Compare](/img/concatenate/compare.png)

Average request time. First solution: **751 ms**, optimized solution: **707 ms**.

You can reach the source code from [Github](https://github.com/lyzerk/medium/tree/master/StreamSerializeAPI).
