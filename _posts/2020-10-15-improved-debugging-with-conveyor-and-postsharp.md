﻿---
layout: post
comments: true
title: "Debugging from devices with Conveyor and PostSharp Logging"
date: 2020-10-16 10:00:00 +02:00
categories: [Logging]
permalink: /post/improved-debugging-with-conveyor-and-postsharp-logging.html
author: "Petr Hudecek and Jim Wright"
image: /assets/images/blog/2020-10-15-improved-debugging-with-conveyor-and-postsharp-logging/partner-conveyor.jpg
---
If you're developing a web application, there are times you want to test and debug it from devices other than your development machine: from a phone that's not connected to the local network,  for instance, or from an online service if you're building a webhook. In this article, we'll show how you can do that -- even if the website is not yet deployed -- and also how you can find errors in your code in such a situation with detailed automatic logging. 

We will be using Conveyor, a tool that [builds a tunnel between your local machine and the Internet](https://conveyor.cloud?utm_source=postsharp&utm_medium=referral&utm_campaign=partner-postsharp ) and PostSharp Logging, which [adds highly detailed logging to your .NET projects with zero impact on source code](https://www.postsharp.net/logging).

## Example application
We'll start with an example ASP.NET application: a time tracker that allows users to register time spent working. [You can download the code from GitHub](https://github.com/keyoti/Conveyor-Examples/tree/master/PostSharp-Conveyor-Example-Timesheet).

In the app, we have a “clock in” form where you fill in your hours:

<img src="/assets/images/blog/2020-09-25-conveyor/ClockInScreenshot.PNG" />

But we also added another feature: if you access the site from a mobile device, the form has an extra field, “location”, so that you register from where you are working. So now we want to test that the extra field indeed displays for mobile devices and that it works.

## Debugging over net
To do that, we'll need a mobile device to connect to the server. This would be easy if the server was publicly accessible but during development, it's probably running on an IIS Express local server that only accepts connections from localhost.

We'll use Conveyor, a free Visual Studio extension, to connect to that server anyway.

Download and install [the Conveyor extension](https://marketplace.visualstudio.com/items?itemName=vs-publisher-1448185.ConveyorbyKeyoti) and then run the example application from Visual Studio. Conveyor will show you an address-and-port at which you can access the application from other devices on the LAN:

<img src="/assets/images/blog/2020-09-25-conveyor/ConveyorForm.PNG" width="100%" />

Alternatively (eg. if your test phone isn't on the same LAN), you can also tunnel the connection through a Conveyor server over the internet ([here's an explanation](https://conveyor.cloud/Help/Setup_remote_connection_Visual_Studio_IIS_Express?utm_source=postsharp&utm_medium=referral&utm_campaign=partner-postsharp)). To do this, click “Access Over Internet” and follow the prompts which include registering on the Conveyor website.

Eventually, you will get a URL that you can connect to from your phone or tablet, wherever they are.

You connect… and see that the webpage looks just the same as on desktop. The Location field is not there:

<img src="/assets/images/blog/2020-09-25-conveyor/MobileScreenshot.PNG" width="100%" />

There's probably a bug.

## Detailed logging
You can think of several places where the bug might be hiding. The HTML or CSS might be bad, the rendering of HTML might have failed, device detection might not have worked right. There are, of course, several ways to tackle this, but in this article, we'll go with analyzing logs.

Now, our application doesn't currently log anything, and we don't want to spend time adding logging everywhere so we'll go with an automatic solution: PostSharp Logging.

Add the following NuGet packages to your project:
- PostSharp.Patterns.Diagnostics
- PostSharp.Patterns.Diagnostics.Serilog
- Serilog.Sinks.File

Then, at the entry point of the application (in our case, that's *Application_Start* in `Global.asax`), add the following code:

```c#
// Configure Serilog to send logging events to a file:
const string template = "{Timestamp:yyyy-MM-dd HH:mm:ss} [{Level:u3}] {Indent:l}{Message}{NewLine}{Exception}";
Log.Logger = new LoggerConfiguration()
.MinimumLevel.Debug()
.WriteTo.File(@"C:\Logs\log.log", outputTemplate: template)
.CreateLogger();

// Configure PostSharp to send automatic logging to Serilog:
LoggingServices.DefaultBackend = new SerilogLoggingBackend(Log.Logger);
```

Then, add automatic logging to all methods in your application by adding this line at the beginning of any one file in your project:
```c#
// Apply logging to all methods and properties:
[assembly: Log]
```
In a real-life project, you will soon figure out that this is way too verbose. You can [select which methods, classes or namespaces to trace](https://doc.postsharp.net/attribute-multicasting) with multicasting.

Finally, you will need to get a license for PostSharp Logging, either [a free trial](https://www.postsharp.net/download) or [a free Community edition with some limitations](https://www.postsharp.net/get/community). You can install the license either by installing the [PostSharp Visual Studio extension](https://marketplace.visualstudio.com/items?itemName=PostSharpTechnologies.PostSharp) or by [adding the license to your source code](https://doc.postsharp.net/deploying-keys).

Let's now run the program again from Visual Studio, connect to the page from a phone and look in the log file. Here's what we find:

```text
2020-09-24 11:41:47 [DBG] HomeController.ClockIn() | Starting.
2020-09-24 11:41:47 [DBG]   UserDevice..ctor("Mozilla/5.0 (Linux; Android 9; SM-A530F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.101 Mobile Safari/537.36") | Starting.
2020-09-24 11:41:47 [DBG]     UserDevice.DetermineDeviceFormat("Mozilla/5.0 (Linux; Android 9; SM-A530F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.101 Mobile Safari/537.36") | Starting.
2020-09-24 11:41:47 [DBG] HomeController.Index() | Succeeded: returnValue = {System.Web.Mvc.ViewResult}.
2020-09-24 11:41:47 [DBG]     UserDevice.DetermineDeviceFormat("Mozilla/5.0 (Linux; Android 9; SM-A530F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.101 Mobile Safari/537.36") | Succeeded: returnValue = {Desktop}.
2020-09-24 11:41:47 [DBG]     UserDevice.set_Format({Desktop}) | Starting.
2020-09-24 11:41:47 [DBG]     UserDevice.set_Format({Desktop}) | Succeeded.
2020-09-24 11:41:47 [DBG]   UserDevice..ctor("Mozilla/5.0 (Linux; Android 9; SM-A530F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.101 Mobile Safari/537.36") | Succeeded.
2020-09-24 11:41:47 [DBG]   UserDevice.get_Format() | Starting.
2020-09-24 11:41:47 [DBG]   UserDevice.get_Format() | Succeeded: returnValue = {Desktop}.
2020-09-24 11:41:47 [DBG] HomeController.ClockIn() | Succeeded: returnValue = {System.Web.Mvc.ViewResult}.
```

The log file traces how the web request proceeded. The most suspicious line is this:

```text
UserDevice.DetermineDeviceFormat("Mozilla/5.0 (Linux; Android 9; SM-A530F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.101 Mobile Safari/537.36") | Succeeded: returnValue = {Desktop}.
```
It seems the application has a method named DetermineDeviceFormat that accepts a user-agent string and, in this case, returned a value named “Desktop”.

This is a good clue: it is likely that the bug is in identifying whether a device is mobile or desktop and that the body of the method DetermineDeviceFormat is at fault. Sure enough, when we look inside, we find that the method tests the user string for the word “android” rather than “Android” and so fails to identify that the client is mobile.

## Conclusion
In this article, we presented two ways to improve your debugging experience: with Conveyor, you gain the ability to access your local development server from other devices, or even from the internet, and with PostSharp Logging, you can add useful detailed and automatic logging.

You can learn more about [Conveyor](https://conveyor.cloud?utm_source=postsharp&utm_medium=referral&utm_campaign=partner-postsharp ) and about [PostSharp Logging](https://www.postsharp.net/logging) at their respective websites, and you can download [our example project from GitHub](https://github.com/keyoti/Conveyor-Examples/tree/master/PostSharp-Conveyor-Example-Timesheet).
