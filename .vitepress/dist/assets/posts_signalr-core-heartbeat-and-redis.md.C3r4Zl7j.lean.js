import{_ as i,c as a,a3 as e,o as n}from"./chunks/framework.Ao2Tp7LI.js";const t="/img/1__2oXntW9P1OF0zLUAsHe3Mw.png",g=JSON.parse('{"title":"SignalR Core: Heartbeat and Redis","description":"Realtime applications are hard to design in .NET world, we have SignalR Core which gives us a painless interface for developing such applications. SignalR Core is a very new library, here I will be discussing a problem case which came with the latest versions.","frontmatter":{"layout":"doc","title":"SignalR Core: Heartbeat and Redis","description":"Realtime applications are hard to design in .NET world, we have SignalR Core which gives us a painless interface for developing such applications. SignalR Core is a very new library, here I will be discussing a problem case which came with the latest versions.","date":"2019-12-23T09:51:18.869Z","categories":"ASP.NET,Redis,SignalR","keywords":"dotnet,aspnetcore,signalr","thumbnail":"/img/1__2oXntW9P1OF0zLUAsHe3Mw.png"},"headers":[],"relativePath":"posts/signalr-core-heartbeat-and-redis.md","filePath":"posts/signalr-core-heartbeat-and-redis.md"}'),l={name:"posts/signalr-core-heartbeat-and-redis.md"};function h(p,s,r,o,k,d){return n(),a("div",null,s[0]||(s[0]=[e(`<h1 id="signalr-core-heartbeat-and-redis" tabindex="-1">SignalR Core: Heartbeat and Redis <a class="header-anchor" href="#signalr-core-heartbeat-and-redis" aria-label="Permalink to &quot;SignalR Core: Heartbeat and Redis&quot;">​</a></h1><p>Realtime applications are hard to design in .NET world, we have SignalR Core which gives us a painless interface for developing such applications. SignalR Core is a very new library, here I will be discussing a problem case which came with the latest versions.</p><p>The story come up with a problem that I faced. I have been storing the client information on Redis. My application records client information with <code>OnConnectedAsync</code> method and remove it with <code>OnDisconnectedAsync</code> method. Moreover, we have an object called _clientList for inserting and removing clients, and for updating a clients information.</p><div class="language-csharp vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">csharp</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">public</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> async</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> Task</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> OnConnectedAsync</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">()  </span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">{  </span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">    ..</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">.  </span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    _clientList.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">CreateUser</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(Context.ConnectionId);  </span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">    ..</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">.  </span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">public</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> async</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> Task</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> OnDisconnectedAsync</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">Exception</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> ex</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">)  </span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">{  </span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">    ..</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">.  </span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    _clientList.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">RemoveUser</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(Context.ConnectionId);  </span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">    ..</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">.  </span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span></code></pre></div><p>This seems good enough for cases without a failure. However, we have to consider the worst case. <code>_clientList</code> must be reliable for the reading the data. Which means, we should be able to see the most up-to-date status information for the online users.</p><p><strong>Further note</strong>; the story’s code does not include a Redis implementation.</p><h2 id="scenario-1" tabindex="-1">Scenario 1 <a class="header-anchor" href="#scenario-1" aria-label="Permalink to &quot;Scenario 1&quot;">​</a></h2><p>Redis has crashed and a new connection has establisted. <code>_clientList.CreateUser</code> method will also crash. And, we can’t see the new client on the Redis.</p><h2 id="scenario-2" tabindex="-1">Scenario 2 <a class="header-anchor" href="#scenario-2" aria-label="Permalink to &quot;Scenario 2&quot;">​</a></h2><p>Redis was working without problem and then it crashed or some network problem have occurred between server and redis. So, what will happen this in case ?</p><p>You guessed it right, the <code>_clientList.RemoveUser</code> will fail too. And our reliable data won’t be reliable anymore.</p><p>You have to cover these scenarios for better realtime applications. Let’s start.</p><h2 id="solutions" tabindex="-1">Solutions <a class="header-anchor" href="#solutions" aria-label="Permalink to &quot;Solutions&quot;">​</a></h2><p><strong><em>Scenario 1</em></strong> has a basic solution. You can ignore the new connections while Redis is down. Which means, you don’t allow new connections. In order to accomplish this, basically call the <code>Context.Abort()</code></p><div class="language-csharp vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">csharp</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">public</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> async</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> Task</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> OnConnectedAsync</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">()  </span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">{</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">    try</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> {  </span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">       ..</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">.  </span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">       _clientList.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">CreateUser</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(Context.ConnectionId);  </span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">       ..</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">.  </span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    }  </span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">    catch</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">Exception</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> ex</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">) {  </span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">       // put your logger logic here  </span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">       Context.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">Abort</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">();</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    }  </span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span></code></pre></div><p>After that, you can show such a message to user ‘Server is offline’. Problem solved for reliable data. Next step would be to solve the problem in Redis.</p><blockquote><p><strong>For advanced usage</strong>, this is not a proper solution. You have to make sure that Redis is always online, or have a backup plan in order to prevent server uptime loss.</p></blockquote><p><strong><em>Scenario 2</em></strong>, the main point of this story. Data stuck on the Redis. And, we can’t rely the data anymore. SignalR sending ping to the clients for testing their connections. It called as Heartbeat.</p><p>Old SignalR was using an extra interface to control existing connections. <code>ITransportHeartbeat</code>, it has collection of existing connections, so we can remove stuck data with iteration. I won’t delve into details here, you can refere the David Flow’s code <a href="https://github.com/DamianEdwards/NDCLondon2013/blob/master/UserPresence/PresenceMonitor.cs" target="_blank" rel="noreferrer">here</a>. However, taking all connections and processing them might cause some performance issues. In order to solve this, SignalR takes a different approach by implementing a new method between its ping/pong cycles on its own Backend.</p><p>ASP.NET Core has Connection Features. And, it includes <code>IConnectionHeartbeatFeature</code> interface. You must use the following code inside of a hub. Let&#39;s see the code.</p><div class="language-csharp vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">csharp</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">private</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> void</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> Heartbeat</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">()  </span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">{  </span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">     var</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> heartbeat</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> =</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> Context.Features.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">Get</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">&lt;</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">IConnectionHeartbeatFeature</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">&gt;();</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">     heartbeat.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">OnHeartbeat</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">state</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> =&gt;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> {  </span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        (</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">HttpContext</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> context</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> ,</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">string</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> connectionId</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">) </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> ((</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">HttpContext</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,   </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">string</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">))state;  </span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">         var</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> ClientList</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> =</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> context.RequestServices.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">GetService</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">&lt;</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">IClientList</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">&gt;();  </span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">         ClientList.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">LatestPing</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(connectionId);  </span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    }, (Context.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">GetHttpContext</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(), Context.ConnectionId));  </span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span></code></pre></div><p>Call the Heartbeat method on <code>OnConnectedAsync</code>. Also, if you want to use a service from DI, You have to request with <code>context.RequestServices.GetService</code> . Then, we just update the client’s LatestPing parameter. This property will be updated on Redis.</p><p>To verify, the results check the <code>http://localhost:5000/api/clients</code></p><p><img src="`+t+'" alt="Result"> Result</p><p>So, now we know latest client ping time. We can loop through the redis and if we didn’t receive a ping at least <strong>5 min</strong>. from a client, we can remove it. The control time should be depend on your <strong>reconnecting</strong> time span settings. Because a re-connection might have happened after a natural disconnection case.</p><h2 id="conclusion" tabindex="-1">Conclusion <a class="header-anchor" href="#conclusion" aria-label="Permalink to &quot;Conclusion&quot;">​</a></h2><p>To sum up, we can use the latest ping time in order to deal with many cases. Of course, SignalR Core itself needs more features for edge cases. On the other hand, this solution is not perfect. Depending on the system design, a completely different service approach might be required.</p><p>You can check the code on <a href="https://github.com/alimozdemir/medium/tree/master/SignalR/Heartbeat" target="_blank" rel="noreferrer">github</a>. I have used, the ChatSample from SignalR_samples repository. And it is just a demo.</p>',28)]))}const E=i(l,[["render",h]]);export{g as __pageData,E as default};
