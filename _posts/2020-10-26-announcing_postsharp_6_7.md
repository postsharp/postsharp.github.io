---
layout: post 
comments: true
title: "Announcing PostSharp 6.7: Support for Blazor and Xamarin, and better integration with other logging frameworks "
date: 2020-10-26 17:55:00 +02:00
categories: [Announcement]
permalink: /post/postsharp-6-7-blazor-xamarin-support-and-enhanced-logging-features.html
author: "Lejla Rasic"
image: /assets/images/blog/2020-10-26-6-7-announcement/6.7.jpg
tag: featured
---
Just 2 weeks after releasing [PostSharp 6.7 RC](https://blog.postsharp.net/post/postsharp-6-7-rc-blazor-xamarin-support-and-enhanced-logging-features.html), we are happy to announce the general availability of PostSharp 6.7. This version is available for [download](https://www.postsharp.net/download) on our website.

Starting from 6.7 release, the support for [Xamarin](https://blog.postsharp.net/post/postsharp-6-7-rc-blazor-xamarin-support-and-enhanced-logging-features.html) is back and we have introduced the support for [Blazor](https://blog.postsharp.net/post/blazor-support-6.7.html). In addition, we are excited to announce the release of two new features for PostSharp Logging: log collecting and the multiplexer logging backend. What this means is that [PostSharp Logging](https://www.postsharp.net/logging) now allows for collecting logs from other logging frameworks into PostSharp Logging, and writing from PostSharp Logging into multiple target frameworks.  

Here is the summary of all new features in PostSharp 6.7: 

- **Blazor support**  

You can now use PostSharp Framework and selected Patterns libraries in your Blazor applications. Note that adding PostSharp directly to a Blazor application project is not supported. Read more [here](https://blog.postsharp.net/post/blazor-support-6.7.html). 

- **Xamarin support**

You will be able to use PostSharp in .NET Standard projects that can then be referenced in your Xamarin application project. Note that with Xamarin, we still just support .NET Standard libraries, so you cannot use PostSharp on the Xamarin-targeting project itself. Read more [here](https://blog.postsharp.net/post/postsharp-6-7-rc-blazor-xamarin-support-and-enhanced-logging-features.html).  

- **Better integration with other logging frameworks**  

There is no need to replace your existing logging code when adopting PostSharp to your projects and the multiplexer features now enables several new scenarios, including sending your logging output to targets in different logging frameworks at the same time. Read more [here](https://blog.postsharp.net/post/collecting-logs-and-multiplexing.html).  

<p>&nbsp;</p>

For more details, please read the [6.7 RC announcement](https://blog.postsharp.net/post/postsharp-6-7-rc-blazor-xamarin-support-and-enhanced-logging-features.html).  

Happy PostSharping!