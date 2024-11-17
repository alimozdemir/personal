---
title: "deget/ddown; a downloader cli/api for dotnet"
description: "Hello everyone, I would like to introduce my first global tool for dotnet core ecosystem. This is one of my side projects that I have completed in my free time. It is a downloader just like ‘wget’ command in unix. It has partitioning, pause and resume features. Also, it is not only a CLI tool, but has a nuget package that you can include to your projects for downloading files."
date: "2019-01-14T09:10:19.332Z"
categories: "Tool"
keywords: "dotnet,tool,downloader,wget"
thumbnail: "/img/1__uCwhJpWZUQVkkXTvVr__m2A.png"
---


![The blog image](/img/1__uCwhJpWZUQVkkXTvVr__m2A.png)

Hello everyone, I would like to introduce my first global tool for dotnet core ecosystem. This is one of my side projects that I have completed in my free time. It is a downloader just like ‘wget’ command in unix. It has partitioning, pause and resume features. Also, it is not only a CLI tool, but has a nuget package that you can include to your projects for downloading files.

<!--more-->
Install command
```
dotnet tool install -g deget  
dotnet add package DDown

Example CLI command

deget https://github.com/OpenShot/openshot-qt/releases/download/v2.4.1/OpenShot-v2.4.1-x86\_64.dmg
```

I have started this project almost a year ago; My curiosity started with “can I do something like ‘free download manager’ in command line just like ‘wget’ command in unix”. I started digging into HTTP protocol documentation. And, I found “Range” option which I didn’t know before. With this option I can divide the file and download it with chucks.

So, the main idea behind the tool is to request the file information with only header option. After that, calculate the partitions and start download as a stream. I kept the partitions and the history files in user’s LocalApplicationData. Maybe, it can change in future.

Let’s see results.

Here is an example run command with four partitions.

```
deget [https://github.com/OpenShot/openshot-qt/releases/download/v2.4.1/OpenShot-v2.4.1-x86\_64.dmg](https://github.com/OpenShot/openshot-qt/releases/download/v2.4.1/OpenShot-v2.4.1-x86_64.dmg) -p 4
```

![deget example output](/img/1__Ehwm4wP05VIXHYL9cOReig.png)
deget example output

I think, one of the most useful thing is that CLI downloads the file into current folder in which the command runs. But, if you want to change the download location you can just use -o flag. Also, if you want to download the file into user’s downloads folder you can just use -d flag. For more options,

```
\-p, — partition (Default: 0) Set partition count. Default zero means system’s processor count

\-o, — output Default value is current folder that command runs.

\-r, — override (Default: false) Override the lastest download file with same name. Otherwise it will download the file with numbers (e.g. File (1).exe, File (2).exe).

\-b, — buffersize (Default: 8192) Set buffer size.

\-t, — timeout (Default: 10000) Set timeout parameter in miliseconds.

\-d, — downloadFolder (Default: false) The file download location set to User’s download folder.

— help Display this help screen.

— version Display version information.

value pos. 0 Required. Link to download
```

DDown, API is ready to go, you can easily start with following lines for adding file download feature to your project. And, you can customize your options with DDown.Options class. For more information you can take a look at [github](https://github.com/lyzerk/DDown).

```csharp
using DDown;

var downloader = new Downloader(link);
var status = await downloader.PrepareAsync(); // status contain information about file. (e.g. Length, IsRangeSupported, PartitionCount)

await downloader.StartAsync(); 

if (!downloader.Canceled)
{
    // this method will marge partitions
    await downloader.MergeAsync();
}
```

Thank you for reading.