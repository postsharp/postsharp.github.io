---
layout: post 
comments: true
title: "Announcing PostSharp 6.7 RC: Support for Blazor and Xamarin, and better integration with other logging frameworks "
date: 2020-10-13 11:30:00 +02:00
categories: [Announcement]
permalink: /post/postsharp-6-7-rc-blazor-xamrin-support-and-enhanced-logging-features.html
author: "Lejla Rasic"
image: /assets/images/blog/2020-10-13-6-7-RC-announcement/6-7-RC-square.jpg
---
We are happy to announce that PostSharp 6.7 RC is available today. Included in this release are support for Xamarin and Blazor as well as introduction of two new features for PostSharp Logging: collecting logs from other logging frameworks into PostSharp Logging, and writing from [PostSharp Logging](https://www.postsharp.net/logging) into multiple target frameworks. This version is available for download on our website.

## Blazor support  

Starting from version 6.7 you can now use PostSharp Framework and selected Patterns libraries in your Blazor applications.  

Worth mentioning is that PostSharp supports Blazor as runtime platform only via .NET Standard. You can use PostSharp in your .NET Standard libraries and then reference these libraries in your Blazor application project. Adding PostSharp directly to a Blazor application project is not supported. 

If you would like to look at a sample Blazor application that uses PostSharp Aspect Framework, you can find the full source code of an example published in our [samples browser](https://github.com/postsharp/PostSharp.Samples/tree/master/Blazor/PostSharp.Samples.Blazor.AutoRetry).  

Find further details about Blazor support on our blog post [here](https://blog.postsharp.net/post/blazor-support-6.7.html).  

## Xamarin support  

As we have already announced in [PostSharp 6.7 preview blog post](https://blog.postsharp.net/post/postsharp-6-7-preview-support-for-xamarin-and-net-5.html), we are excited for bringing back Xamarin support. Just like with Blazor support, you will be able to use PostSharp in .NET Standard projects that can then be referenced in your Xamarin application project. The support includes creating custom aspects as well as using PostSharp Pattern Libraries. 

Note that with Xamarin, we still just support .NET Standard libraries, so you cannot use PostSharp on a project that is built for Xamarin. 

## Better integration with other logging frameworks  

In PostSharp 6.7, we have released two new features for PostSharp Logging: log collecting and the multiplexer logging backend.  

Log collecting allows you to reuse your existing logging code with PostSharp. And with the multiplexer backend, you can send your logging output to two or more targets (such as console and a third-party logging framework) at the same time. 

This means that there is no need to replace your existing logging code when adopting PostSharp to your projects. PostSharp can now collect your existing manual logging from any framework. The multiplexer enables several new scenarios, including sending your logging output to targets in different logging frameworks at the same time. 

For more details, see [this blog post](https://blog.postsharp.net/post/collecting-logs-and-multiplexing.html) explaining all you need to know about the new features. 

## Summary

With PostSharp 6.7 we’re bringing back support to Xamarin and introducing support for Blazor. For those using PostSharp Logging, we’re introducing 2 new exciting features: log collecting and multiplexer logging backend. You can now collect your existing manual logging from (almost) any framework and in addition you can send your logging output to targets in different logging frameworks at the same time. 

Blazor and Xamarin support comes with few limitations which you can read more about in [Blazor blog post](https://blog.postsharp.net/post/blazor-support-6.7.html) and in [6.7 preview announcement](https://blog.postsharp.net/post/postsharp-6-7-preview-support-for-xamarin-and-net-5.html). 

As always, it is a good time to update your VS extension and NuGet packages, and report any problem via our [support forum](https://support.postsharp.net/).  

Happy PostSharping! 

 
