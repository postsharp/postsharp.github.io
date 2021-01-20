---
layout: post 
comments: true
title: "Action required: updating to Visual Studio 16.8 may break your build with PostSharp 6.5-6.7"
date: 2020-11-19 14:00:00 +02:00
categories: [Announcement]
permalink: /post/updating-to-vs-168-breaks-build.html
author: "Gael Fraiteur"
image: /assets/images/blog/2020-11-19-breaking-build/PostSharp.jpg
---

We want to notify you that PostSharp may fail your builds after updating Visual Studio to version 16.8. This happens because .NET 5.0 SDK is installed together
with this new version and takes precedence over previous versions of .NET Core SDK. The solution is to pin your repo to .NET Core 3.1 SDK by editing your `global.json` file.

<!--more-->


We apologize for inconvenience. We regret that we failed to identify it before the new release of Visual Studio.
 
## Who is affected?

This problem affects users of PostSharp 6.5, 6.6 or 6.7 updating Visual Studio to version 16.8 and then building a .NET Core or .NET Standard project.


## What will happen?

You will get a warning about unsupported .NET SDK version and subsequent build failure.

## Why does it happen?

Because the Visual Studio Installer installs .NET 5.0 SDK, which becomes the default SDK for all projects or repoes that are not pinned to a specific SDK version. Versions of PostSharp prior to 6.8 do not support .NET 5.0 SDK, try to build anyway, but fail.

## What can you do?

To resolve this you have following options:

### 1. Edit your global.json file  (Recommended Option)

Install the latest version of [.NET Core 3.1 SDK](https://dotnet.microsoft.com/download/dotnet-core/3.1) and override the SDK version in the [global.json](https://docs.microsoft.com/en-us/dotnet/core/tools/global-json) file in the root of your repository: 

```json
{
  "sdk": {
    "version": "3.1.404",
    "rollForward": "latestPatch"
  }
}
```

You should also consider staying on Visual Studio 16.7 servicing baseline unless you upgrade PostSharp to version 6.8 (see below).
   
### 2. Update to PostSharp 6.8

Upgrade to PostSharp 6.8, which supports VS 16.8 and .NET 5 SDK and is currently in preview. We are expecting to publish an RC next week. Note that updating PostSharp requires an up-to-date support subscription.


