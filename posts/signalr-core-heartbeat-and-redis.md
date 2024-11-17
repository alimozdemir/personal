---
layout: doc
title: 'SignalR Core: Heartbeat and Redis'
description: "Realtime applications are hard to design in .NET world, we have SignalR Core which gives us a painless interface for developing such applications. SignalR Core is a very new library, here I will be discussing a problem case which came with the latest versions."
date: "2019-12-23T09:51:18.869Z"
categories: "ASP.NET,Redis,SignalR"
keywords: "dotnet,aspnetcore,signalr"
thumbnail: '/img/1__2oXntW9P1OF0zLUAsHe3Mw.png'
---

# SignalR Core: Heartbeat and Redis

Realtime applications are hard to design in .NET world, we have SignalR Core which gives us a painless interface for developing such applications. SignalR Core is a very new library, here I will be discussing a problem case which came with the latest versions.

The story come up with a problem that I faced. I have been storing the client information on Redis. My application records client information with `OnConnectedAsync` method and remove it with `OnDisconnectedAsync` method. Moreover, we have an object called \_clientList for inserting and removing clients, and for updating a clients information.

```csharp
public async Task OnConnectedAsync()  
{  
    ...  
    _clientList.CreateUser(Context.ConnectionId);  
    ...  
}

public async Task OnDisconnectedAsync(Exception ex)  
{  
    ...  
    _clientList.RemoveUser(Context.ConnectionId);  
    ...  
}
```

This seems good enough for cases without a failure. However, we have to consider the worst case. `_clientList` must be reliable for the reading the data. Which means, we should be able to see the most up-to-date status information for the online users.

**Further note**; the story’s code does not include a Redis implementation.

## Scenario 1

Redis has crashed and a new connection has establisted. `_clientList.CreateUser` method will also crash. And, we can’t see the new client on the Redis.

## Scenario 2

Redis was working without problem and then it crashed or some network problem have occurred between server and redis. So, what will happen this in case ?

You guessed it right, the `_clientList.RemoveUser` will fail too. And our reliable data won’t be reliable anymore.

You have to cover these scenarios for better realtime applications. Let’s start.

## Solutions

**_Scenario 1_** has a basic solution. You can ignore the new connections while Redis is down. Which means, you don’t allow new connections. In order to accomplish this, basically call the `Context.Abort()`

```csharp
public async Task OnConnectedAsync()  
{

    try {  
       ...  
       _clientList.CreateUser(Context.ConnectionId);  
       ...  
    }  
    catch (Exception ex) {  
       // put your logger logic here  
       Context.Abort();

    }  
}
```

After that, you can show such a message to user ‘Server is offline’. Problem solved for reliable data. Next step would be to solve the problem in Redis.

> **For advanced usage**, this is not a proper solution. You have to make sure that Redis is always online, or have a backup plan in order to prevent server uptime loss.

**_Scenario 2_**, the main point of this story. Data stuck on the Redis. And, we can’t rely the data anymore. SignalR sending ping to the clients for testing their connections. It called as Heartbeat.

Old SignalR was using an extra interface to control existing connections. `ITransportHeartbeat`, it has collection of existing connections, so we can remove stuck data with iteration. I won’t delve into details here, you can refere the David Flow’s code [here](https://github.com/DamianEdwards/NDCLondon2013/blob/master/UserPresence/PresenceMonitor.cs). However, taking all connections and processing them might cause some performance issues. In order to solve this, SignalR takes a different approach by implementing a new method between its ping/pong cycles on its own Backend.

ASP.NET Core has Connection Features. And, it includes `IConnectionHeartbeatFeature` interface. You must use the following code inside of a hub. Let's see the code.

```csharp
private void Heartbeat()  
{  
     var heartbeat = Context.Features.Get<IConnectionHeartbeatFeature>();

     heartbeat.OnHeartbeat(state => {  
        (HttpContext context ,string connectionId) = ((HttpContext,   string))state;  
         var ClientList = context.RequestServices.GetService<IClientList>();  
         ClientList.LatestPing(connectionId);  
    }, (Context.GetHttpContext(), Context.ConnectionId));  
}
```

Call the Heartbeat method on `OnConnectedAsync`. Also, if you want to use a service from DI, You have to request with `context.RequestServices.GetService` . Then, we just update the client’s LatestPing parameter. This property will be updated on Redis.

To verify, the results check the [http://localhost:5000/api/clients](http://localhost:5000/api/clients)

![Result](/img/1__2oXntW9P1OF0zLUAsHe3Mw.png)
Result

So, now we know latest client ping time. We can loop through the redis and if we didn’t receive a ping at least **5 min**. from a client, we can remove it. The control time should be depend on your **reconnecting** time span settings. Because a re-connection might have happened after a natural disconnection case.

## Conclusion

To sum up, we can use the latest ping time in order to deal with many cases. Of course, SignalR Core itself needs more features for edge cases. On the other hand, this solution is not perfect. Depending on the system design, a completely different service approach might be required.

You can check the code on [github](https://github.com/lyzerk/medium/tree/master/SignalR/Heartbeat). I have used, the ChatSample from SignalR\_samples repository. And it is just a demo.