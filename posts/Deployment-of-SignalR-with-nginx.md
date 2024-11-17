---
layout: doc
title: "Deployment of SignalR with nginx"
description:  'WebSocket does not working with keep-alive. In our project, SignalR Hub is mapped to “/api/chat”. So, we have to add a new location and set the connection header as “upgrade”'
date: "2017-12-19T21:52:17.860Z"
categories: "SignalR"
keywords: "aspnetcore,signalr,websocket,nginx"
thumbnail: '/img/1__cNrB6kBkpwQMuPp8rnaXIw.png'
---

# Deployment of SignalR with nginx

![Logos](/img/1__cNrB6kBkpwQMuPp8rnaXIw.png)

At the beginning of the semester, I took software engineering course which has a term project. It requires us to do real-time web application. After discussion with team members, we chose ASP.NET Core with SignalR. While I was writing this story, SignalR is on alpha stage (1.0.0-alpha2). Therefore, it has issues. Such as, the documentation is incomplete, some of the features are under development and there is no information about unit testing or functionality testing etc. Of course, somehow you can achieve those things, no doubt, but you have to work hard. In this story, I will mention about deployment of SignalR with nginx.

## Problem

Two months after we completed the project with a few shortcomings such as [link](https://twitter.com/almozdmr/status/940992242449309703). Then, we had to deploy the project. I followed [this](https://docs.microsoft.com/en-us/aspnet/core/publishing/linuxproduction?tabs=aspnetcore2x) documentation, app was working but the SignalR part was giving me this error

> Error during WebSocket handshake: Unexpected response code: 204

## Solution

If we look behind of the problem, it is based on headers of connection.

> If you need to create a WebSocket connection from scratch, you’ll have to handle the handshaking process yourself. After creating the initial HTTP/1.1 session, you need to request the upgrade by adding to a standard request the [Upgrade](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Upgrade "The documentation about this has not yet been written; please consider contributing!") and [Connection](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Connection "The Connection general header controls whether or not the network connection stays open after the current transaction finishes. If the value sent is keep-alive, the connection is persistent and not closed, allowing for subsequent requests to the same server to be done.") headers, as follows: Connection: Upgrade Upgrade: websocket

Source [Mozilla](https://developer.mozilla.org/en-US/docs/Web/HTTP/Protocol_upgrade_mechanism#Upgrading_to_a_WebSocket_connection)

The deployment documentation sets the connection header as _keep-alive_. And, WebSocket does not working with _keep-alive_. In our project, SignalR Hub is mapped to “/api/chat”. So, we have to add a new location and set the connection header as “_upgrade_”

This configuration solves the problem. Also, our term project github page is shown below.

[**alimozdemir/ChannelX**  
_ChannelX Project for the Software Engineering Course 411E_github.com](https://github.com/alimozdemir/ChannelX "https://github.com/alimozdemir/ChannelX")[](https://github.com/alimozdemir/ChannelX)

Thats all, thanks !