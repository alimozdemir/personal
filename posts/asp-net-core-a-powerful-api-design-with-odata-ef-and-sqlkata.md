---
layout: doc
title: "ASP.NET Core: A powerful API Design with OData, EF and SQLKata"
description: "Rather than reinventing the wheel, you may need a fast and reliable solution in a short time span. In this case, your framework should be able to support all your requirements. ASP.NET Core is doing that very well."
date: "2020-06-09T17:45:46.515Z"
categories: "ASP.NET"
keywords: "aspnetcore,odata,entityframework,dotnet,sqlkata"
thumbnail: '/img/1__qHnlXoKJKnQHTj6QcoN1nw.jpeg'
---

# ASP.NET Core: A powerful API Design with OData, EF and SQLKata

Rather than reinventing the wheel, you may need a fast and reliable solution in a short time span. In this case, your framework should be able to support all your requirements. ASP.NET Core is doing that very well.

> I will cover everything under REST API design.

## API Design

### Select

Let’s first speak about what we know about the performance of an API design. Assume that we have entities over 1M+ rows in a database system. You can’t show that much data directly with an UI, you have the split into pages. In other words, we can say `pagination`. I may apply a “skip and take” methodology and show paged data.

```csharp
[HttpGet]
public IEnumerable<Entity> Get(int skip = 0, int take = 10)
{
    return _db.Entities.Skip(skip).Take(take).ToList();
}
```

This would be enough for basics. The things are starting to get more complex when you need more functionality. The given example could expanded with search, order, select and group functions, etc. So you have to implement each one of them and consider all possibilities. It would be a waste of time and increases the likelihood of errors. **OData** answers your call here. It presents a good API support for such needs and works with **Entity Framework** for query builder.

### Patch/Put/Post/Delete

REST & Entity Framework & OData can handle these actions painlessly.

```csharp
[HttpPost]
public async Task<IActionResult> Post(Entity model)
{
    _db.Entities.Add(model);
    await _db.SaveChangesAsync();
    return Created(model);
}

[HttpPatch]
public async Task<IActionResult> Patch([FromODataUri] int key, Delta<Entity> model)
{
    var entity = await _db.Entities.FindAsync(key);
    model.Patch(entity);
    _db.SaveChanges();
    return Updated(entity);
}

[HttpPut]
public async Task<IActionResult> Put([FromODataUri] int key, Entity entity)
{
    _db.Entry(entity).State = EntityState.Modified;
    await _db.SaveChangesAsync();
    return Updated(entity);
}

[HttpDelete]
public async Task<IActionResult> Delete([FromODataUri] int key)
{
    var entity = await _db.Entities.FindAsync(key);
    _db.Entities.Remove(entity);
    await _db.SaveChangesAsync();
    return StatusCode((int)HttpStatusCode.NoContent);
}
```

I didn’t include the validations. You can see a full example from [Microsoft’s site](https://docs.microsoft.com/tr-tr/aspnet/web-api/overview/odata-support-in-aspnet-web-api/odata-v4/create-an-odata-v4-endpoint). So far so good, we handled CRUD operations and exposed an API.

## Projection

The whole scenario is based on an entity on a database system which means it is can be a table, a document, etc. However, you may want to use OData features with a projection. In other words, you have a View on SQL that joins multiple tables and collects bunch of data.

> You might say, each entity should be separate and live apart. In this case, you might think like your database system is old, big and growth uncontrolled. Thus, SQL View could help with your needs.

Therefore, CRUD operations couldn’t work and you have to handle the operations manually with respect to the columns.

### Scenario

Assume that, you have a song database. It has a restriction system for countries. And, you want to design a webpage that allows you to control the songs status over the countries with a checkbox.

```sql
CREATE VIEW vw_Songs
AS
    SELECT s.Id, s.Title, MIN(ISNULL(cs.[Status], 0) + 0) CountryStatus
    FROM Song AS s
        LEFT JOIN dbo.Country_Songs AS cs ON cs.SongId = s.Id
    GROUP BY s.Id, s.Title
```

`CountryStatus` will present the collective status of the countries. If all countries are true then `CountryStatus` will ‘true’ otherwise it is ‘false’.

The structure is completed for the selection of the songs. Assume that, we are using an advanced data grid which supports OData such as **DevExtreme**, **Telerik,** etc. The user want to change the status of a song on all countries. And, the grid shows the songs with a checkbox. Hereafter, you have to handle the editing operations manually. Since Entity Framework does not support bulk changes, we need to use an extension package like [EntityFramework Plus](https://entityframework-plus.net).

### Patch

The patch method provides a `Delta<T>` object which stores the changes. We can handle the request;

```csharp
[HttpPatch]
public async Task<IActionResult> Patch([FromODataUri] int key, Delta<vw_Song> model)
{
    var instance = model.GetInstance();
    var changedProps = model.GetChangedPropertyNames();
    if (changedProps.Contains("Status"))
    {
        await _db.Country_Songs.Where(i => i.SongId == instance.Id)
            .UpdateAsync(i => new Country_Songs() { Status = instance.Status });
    }

    return Updated(instance);
}
```

The plus package produces the following sql.

```sql
UPDATE A 
SET A.[Status] = @zzz_BatchUpdate_0
FROM [Country_Songs] AS A
INNER JOIN ( SELECT [c].[SongId], [c].[CountryId], [c].[Status]
FROM [Country_Songs] AS [c]
WHERE [c].[SongId] = @zzz_BatchUpdate_1
           ) AS B ON A.[SongId] = B.[SongId]
AND A.[CountryId] = B.[CountryId]
```

I don’t think this one is a good update statement. The join statement is not necessary because it updates all rows with respect to an ID. My computer runs it in around **1.5** seconds. It works but it’s slow. In a future they could fix it. I will not go into Entity Framework Plus package details.

## SqlKata

<img src="/img/1__qHnlXoKJKnQHTj6QcoN1nw.jpeg" class="image-center" alt="The blog picture" />

Since, the selection part is customized I would like to go with my own queries for customization and performance matters. SqlKata is a good query builder that allows you to compile your queries according to different database systems.

```csharp
[HttpPatch]
public async Task Patch([FromODataUri] int key, Delta<vw_Song> delta)
{
    var changedProps = delta.GetChangedPropertyNames();
    var instance = delta.GetInstance();
    var updateDict = new Dictionary<string, object>();

    if (changedProps.Contains("Status"))
    {
        updateDict.Add("Status", instance.Status);
    }

    var q = new SqlKata.Query("Country_Songs")
        .Where("SongId", key)
        .AsUpdate(updateDict);

    var result = _compiler.Compile(q);

    await _db.Database.ExecuteSqlRawAsync(result.Sql, result.Bindings);
}
```

SqlKata produces the following sql

```sql
UPDATE [Country_Songs] SET [Status] = @p0 WHERE [SongId] = @p1
```

This was what I expected. My computer runs the patch action between **30ms**~**100ms**.

## Conclusion

OData presents powerful features depending on your needs. The standard procedure is not always available for you and you have to improvise for each case. As a result, you have a **powerful**, **fast** and **RESTful API** concept.

See you on the next story !
