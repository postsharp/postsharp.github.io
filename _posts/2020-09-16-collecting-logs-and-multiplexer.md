---
layout: post 
comments: true
title: "Collecting logs and multiplexing"
permalink: /post/collecting-logs-and-multiplexing.html
author: "Petr H."
published: false
---
In PostSharp 6.7, we are releasing two new features for PostSharp Logging: log collecting and the multiplexer logging backend. Log collecting allows you to reuse your existing logging code with PostSharp. And with the multiplexer backend, you can send your logging output to two or more targets (such as console and a third-party logging framework) at the same time.

In this article, I will describe how to best use both of these new features.

## Collecting logs

With log collecting, you can use your existing logging statements in greater harmony with PostSharp's automatic logging.

### What happens without log collecting?
Suppose, for example, that your codebase is using [NLog](https://nlog-project.org/) to log events. Previously, you could add PostSharp `[Log]` attributes and have both your NLog loggers and PostSharp `[Log]` attributes send events to the same NLog targets. Your system looked like this:

<img src="/assets/images/blog/2020-09-16-collecting-logs-and-multiplexer/LogCollecting_WithoutSvg.svg" width="100%" />

But the resulting output wasn't perfect. If your code was this:

```c#
[Log]
public void MyMethod1()
{
    logger.Info( "Manual." );
}
```
Then your output looked like this:
```text
DEBUG|MyNamespace1.MyClass1|MyClass1.MyMethod1()|Starting.
INFO |MyNamespace1.MyClass1|Manual.
DEBUG|MyNamespace1.MyClass1|MyClass1.MyMethod1()|Succeeded.
```

Notice two inconveniences: First, the text "Manual." isn't indented to the right, despite the fact that it's inside the MyMethod1 method. Second, the information that the lines come from "MyClass1" is duplicated in the PostSharp `[Log]` entries.

Both problems have the same root cause: that PostSharp doesn't ever process the manual logging line. The call to `Info` above is not intercepted by PostSharp so PostSharp can't add the information it has about the class and about indentation. This means that your NLog formatting string needs to include the class information, and we get the ugly duplication.

There was a way around this issue: using [manual logging events of PostSharp](https://doc.postsharp.net/manual-logging) but compared to the abilities of other logging frameworks, PostSharp manual event creation might not be as easy to use, and of course, switching to it would require that you rewrite your logging code.

### How log collecting can help

But with log collecting, you can set up your system differently:

<img src="/assets/images/blog/2020-09-16-collecting-logs-and-multiplexer/LogCollecting_WithSvg.svg" width="100%" />

Collecting logs means that when you use NLog statements, the logging events go to PostSharp instead of NLog targets. PostSharp can then enrich those logging events with its own data and send them to final NLog targets as though you used PostSharp manual logging API.
 
 For NLog specifically, you accomplish this by using `NLogCollectingTarget`, our custom NLog target.
 
 When you use log collecting, you can remove the logger name from your NLog formatting string and end up with a cleaner output from the same code, like this:
 
 ```text
DEBUG|MyClass1.MyMethod1()|Starting.
INFO |  MyNamespace1.MyClass1|Manual.
DEBUG|MyClass1.MyMethod1()|Succeeded.
```

Note that indentation works now and that there is no duplication of logger names.

### How to use log collecting

If you already use a combination of manual logging and PostSharp logging, and your manual logging is written in a logging framework we support, you may benefit from log collecting.

Here's how you use it:

1. Upgrade your PostSharp NuGet packages to the most recent 6.7 version (minimum 6.7.8).
2. Set up log collecting for your logging framework by following our documentation. We can do log collecting for [Serilog](https://doc.postsharp.net/6.7/serilog), [NLog](https://doc.postsharp.net/6.7/nlog), [Log4Net](https://doc.postsharp.net/6.7/log4net), [Trace](https://doc.postsharp.net/6.7/logging-trace), [TraceSource](https://doc.postsharp.net/6.7/logging-tracesource) and [ASP.NET](https://doc.postsharp.net/6.7/logging-aspnetcore).
3. You can now use `[Log]` attributes [according to our documentation](https://doc.postsharp.net/add-logging) and the logging features of your logging framework, at the same time, and still have a clean output.

## Multiplexing

The multiplexer is a new [logging backend](https://doc.postsharp.net/6.7/add-logging#s2) that sends PostSharp logging output to two or more other logging backends.

For example, you can send all of your logging to Serilog, logging from user-relevant classes to console, and logging of errors or critical errors to a Loupe server. Multiplexing is like having two or more sinks/appenders/targets/providers in other logging frameworks. 

Each "child backend" of a multiplexer may be for a different logging framework or you may have two backends for the same logging framework, but with different configuration. Both are useful in different scenarios. 

The child backends are normal PostSharp Logging backends and you can still configure their options and verbosity as normal. Multiplexing works with all PostSharp Logging backends, including any backends you create yourself.

Let's look at the code for the example I gave above. You want:

* all log events to be sent to Serilog;
* all events from classes in the FeedbackToUser namespace to be sent to Console;
* all errors to be sent to Loupe.

You can do this by creating and configuring each backend separately, and then adding them all to the multiplexer backend, and setting the multiplexer as the default backend:

```c#
SerilogLoggingBackend serilog = new SerilogLoggingBackend(...serilog configuration...);
serilog.DefaultVerbosity.SetMinimalLevel(LogLevel.Trace); // log everything

ConsoleLoggingBackend console = new ConsoleLoggingBackend();
console.DefaultVerbosity.SetMinimalLevel(LogLevel.None); // don't log stuff in general
console.DefaultVerbosity.SetMinimalLevelForNamespace(LogLevel.Trace, "MyApp1.FeedbackToUser"); // but log stuff in this namespace

Log.StartSession();
LoupeLoggingBackend loupe = new LoupeLoggingBackend();
loupe.DefaultVerbosity.SetMinimalLevel(LogLevel.Error); // only send Error and Critical events

MultiplexerBackend multiplexer = new MultiplexerBackend(serilog, console, loupe);
LoggingServices.DefaultBackend = multiplexer; // send our logging events to all three backends
```

You can learn more about [multiplexing in PostSharp in our documentation](https://doc.postsharp.net/6.7/multiplexer).

## Conclusion
Logging code can be pervasive and difficult to change once in your codebase, but with log collecting, you don't need to change it when you adopt PostSharp. You can supplement your existing logging with PostSharp automatic logging and they will work perfectly together.

The multiplexer enables several new scenarios, including sending your logging output to targets in different logging frameworks at the same time. 

You can learn more about these new features, [log collecting](https://doc.postsharp.net/6.7/log-collecting) and [the multiplexer](https://doc.postsharp.net/6.7/multiplexer), in our documentation.

 
