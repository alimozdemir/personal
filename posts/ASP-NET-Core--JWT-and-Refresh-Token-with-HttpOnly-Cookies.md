---
title: "ASP.NET Core: JWT and Refresh Token with HttpOnly Cookies"
description: "I would like to talk about the SPA client authentication. Most of the blog implementations are stores the token into localStorage, sessionStorage or in-memory storage (redux/vuex/ngrx). It depends on your needs.  For instance, you don't need high security with your In-House applications. For other cases, you need to increase your security. Today, I will try to explain that with my best."
date: "2020-09-13T17:00:00.515Z"
thumbnail: '/img/cookie_monster.jpg'
categories: "ASP.NET"
keywords: "aspnetcore,jwt,entityframework,identity,cookie"
---

# ASP.NET Core: JWT and Refresh Token with HttpOnly Cookies

I would like to talk about the SPA client authentication. Most of the blog implementations are stores the token into localStorage, sessionStorage or in-memory storage (redux/vuex/ngrx). It depends on your needs.  For instance, you don't need high security with your In-House applications. For other cases, you need to increase your security. Today, I will try to explain that with my best.

> Rather than show all the implementations, the post will be clear and simple. You can find the source code at end of the post.

## Where should I put my token and other values ?

![The blog picture](/img/cookie_monster.jpg)

As I mentioned before, localStorage, sessionStorage and in-memory storages are candidates for this kind of questions. In web, also we have "cookies". Best part of the cookies are you can manage them from server-side. For example, when a user logged in, you can put the user sensitive content into her/his cookies without handle it from client-side scripts.

Firstly, I would like show difference between handling other storages and cookies. The below code shows a simple comparison with `axios`.

```javascript
async loginRaw(username, password) {
  const response = await axios.post('login', {
    username,
    password
  });

  if (response.status === 200) {
    const token = response.data;
    sessionStorage.setItem('token', token)
    this.history.push('/');
  }
}

async loginCookie(username, password) {
  const response = await axios.post('login', {
    username,
    password
  });

  if (response.status === 200) {
    // the response already set the token into browser's cookie.
    this.history.push('/');
  }
}
```

Secondly, Let's give some details about the implementation. I will use three cookie property with login. Just focus on `X-Access-Token`.

```csharp
[HttpPost("login")]
public async Task<IActionResult> LoginApi([FromBody] LoginModel model)
{
    if (ModelState.IsValid)
    {
        var signIn = await _signInManager.PasswordSignInAsync(model.Username, model.Password, false, false);

        if (signIn.Succeeded)
        {
            var user = await _userManager.FindByEmailAsync(model.Username);
            var token = _jwtCreator.Generate(user.Email, user.Id);

            user.RefreshToken = Guid.NewGuid().ToString();

            await _userManager.UpdateAsync(user);

            Response.Cookies.Append("X-Access-Token", token, new CookieOptions() { HttpOnly = true, SameSite = SameSiteMode.Strict });
            Response.Cookies.Append("X-Username", user.UserName, new CookieOptions() { HttpOnly = true, SameSite = SameSiteMode.Strict });
            Response.Cookies.Append("X-Refresh-Token", user.RefreshToken, new CookieOptions() { HttpOnly = true, SameSite = SameSiteMode.Strict });

            return Ok();
        }
        else
        {
            return BadRequest(new { signIn.IsLockedOut, signIn.IsNotAllowed, signIn.RequiresTwoFactor });
        }
    }
    else
        return BadRequest(ModelState);
}
```

And finally, ASP.NET Core still waits the token from Authorization Header. Therefore, we have to set the token from the cookies. Startup.cs:

```csharp
services.AddAuthentication(i =>
{
  ...
})
    .AddJwtBearer(options =>
    {
        ...
        options.Events.OnMessageReceived = context => {

            if (context.Request.Cookies.ContainsKey("X-Access-Token"))
            {
                context.Token = context.Request.Cookies["X-Access-Token"];
            }

            return Task.CompletedTask;
        };
        ...
    })

```

### HttpOnly and SameSite
Only the cookies without HttpOnly flag are accessible from client-side script. Therefore, you just making things hard for the other people. Also, you will be  avoided from `XSS` and `XSRF` attacks with `HttpOnly` and `SameSite=Strict` properties.

## How should I send the token ?
Other storages are accessible from the client-side hence you just write an interceptor and write the token into `Authorization` Header. After that the server-side handles the authentication.

```javascript
axios.interceptors.request.use(request => {
    const token = sessionStorage.getItem('token');
    if (auth !== undefined && auth)
      request.headers.common['Authorization'] = 'Bearer ' + token;

    return request;
})
```
As I mentioned above, after cookie with HttpOnly flag you couldn't access the token on client-side. `XMLHttpRequest` will access those cookies for us. Whenever there is a request the `XMLHttpRequest` sends all the cookies to the server-side.

> Note: If your Authentication Server is separated  from your website. You can change the SameSite property on cookies. After that `XMLHttpRequest` or `Axios` with `withCredentials` property will do the work.

## Refresh Token

JWT Token should have a short  lifetime. In that case, you should empower your configurations with the refresh token. The definition as follows

> Refresh tokens are credentials used to obtain access tokens. Refresh tokens are issued to the client by the authorization server and are used to obtain a new access token when the current access token becomes invalid or expires, or to obtain additional access tokens with identical or narrower scope (access tokens may have a shorter lifetime and fewer permissions than authorized by the resource owner). (https://tools.ietf.org/html/rfc6749#section-1.5)

Once a refresh token is used then it should be disposed. Even if the refresh token is exposed it could be used only once. Then when the user login again the stolen refresh token will be invalid.

I will give an example about how you can handle the refresh token. You can call this endpoint from your client-side.

```csharp
[HttpGet("refresh")]
public async Task<IActionResult> Refresh()
{
    if (!(Request.Cookies.TryGetValue("X-Username", out var userName) && Request.Cookies.TryGetValue("X-Refresh-Token", out var refreshToken)))
        return BadRequest();

    var user = _userManager.Users.FirstOrDefault(i => i.UserName == userName && i.RefreshToken == refreshToken);

    if (user == null)
        return BadRequest();

    var token = _jwtCreator.Generate(user.Email, user.Id);

    user.RefreshToken = Guid.NewGuid().ToString();

    await _userManager.UpdateAsync(user);

    Response.Cookies.Append("X-Access-Token", token, new CookieOptions() { HttpOnly = true, SameSite = SameSiteMode.Strict });
    Response.Cookies.Append("X-Username", user.UserName, new CookieOptions() { HttpOnly = true, SameSite = SameSiteMode.Strict });
    Response.Cookies.Append("X-Refresh-Token", user.RefreshToken, new CookieOptions() { HttpOnly = true, SameSite = SameSiteMode.Strict });

    return Ok();
}
```

## Conclusion
Tokens are not completely safe, but we can increase the security with couple of measures. So  cookies are a very well storage for the tokens. And, refresh token will prevent the user from re-login. You can reach the source code from [Github](https://github.com/lyzerk/medium/tree/master/AuthJWTRefresh).

Have a nice day !