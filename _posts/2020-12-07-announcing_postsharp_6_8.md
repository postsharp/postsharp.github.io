---
layout: post 
comments: true
title: "Announcing PostSharp 6.8 RC: Support for .NET 5, C# 9 and improvements in logging"
date: 2020-12-07 14:00:00 +02:00
categories: [Announcement]
permalink: /post/postsharp-6-8-support-for-net-5-and-csharp-9.html
author: "Lejla Rasic"
image: /assets/images/blog/2020-12-07-distributed-logging/PS-6-8-RC.png
---

We are happy to announce the release of PostSharp 6.8 RC. Included in this release are support for .NET 5 and C# 9 as well as significant improvements in logging. This version is available for [download](https://www.postsharp.net/download) on our website.

## Support for .NET 5 and C# 9

We now fully support .NET 5. Additionally, we have tested PostSharp with C# 9 and made a few corrections to support new features like function pointers.

## Logging

PostSharp 6.8 includes several improvements in logging:

- [Per-request logging](https://blog.postsharp.net/post/per-request-logging.html)

PostSharp Logging makes it very easy to create highly-detailed logs, but quite often too much is too much. Often, you need basic logging for 99.9% of your requests and super-detailed logging for 0.1%. And when your app runs in production, you don&#39;t want to redeploy it just to change the level of logging. This is now possible thanks to a file like this:

```xml
<logging>
    <verbosity level='warning'/>
    <transactions>
        <policy type='AspNetCoreRequest'
            if='t.Request.Path == "/"'
            sample='OnceEveryXSeconds(10, t.Request.Path)'>
            <verbosity>
                <source level='debug'/>
            </verbosity>
        </policy>
    </transactions>
</logging>

```

You can store this file in a cloud drive and configure your application to reload it periodically. Read more in this [blog post](https://blog.postsharp.net/post/per-request-logging.html).

- [Distributed logging](https://blog.postsharp.net/post/distributed-logging.html)

Producing a highly detailed log of a distributed .NET application has become much simpler with PostSharp 6.8. With distributed application, it may be challenging to understand the execution logs unless you have the right logging settings and infrastructure in place. You can [read here](https://blog.postsharp.net/post/distributed-logging.html) in details how you can now properly configure PostSharp Logging, Serilog and Elasticsearch for this scenario.

## Usage measurement for per-usage licensing

Since 6.6 version, we have introduced [per-usage licensing](https://blog.postsharp.net/post/postsharp-per-repo-subscriptions.html), a pricing model where you are not charged per daily unique active user but per amount of source code in which you use PostSharp. If you would like to use this licensing instead of the traditional per-developer licensing, it is now possible to know exactly how many lines of code you would be consuming with a per-usage subscription even if you don&#39;t have one yet. For details, see [Per-Usage Licenses](https://doc.postsharp.net/6.8/per-repo-licenses).

# Summary

In PostSharp 6.8 we implemented support for C# 9 and .NET 5, and you can now use PostSharp safely with these new technologies. In addition, 6.8 includes several important improvements in logging such as [per-request logging](https://blog.postsharp.net/post/per-request-logging.html) and [distributed logging](https://blog.postsharp.net/post/distributed-logging.html).

We would recommend upgrading to 6.8 now as in our [latest announcement](https://blog.postsharp.net/post/updating-to-vs-168-breaks-build.html) we warned about the possibility of PostSharp 6.5 – 6.7 failing your build after updating Visual Studio to version 16.8. Read more about the issue and fixes [here.](https://blog.postsharp.net/post/updating-to-vs-168-breaks-build.html)

As always, it is a good time to update your VS extension and NuGet packages and report any problem via our [support forum](https://support.postsharp.net/).

Happy PostSharping!

