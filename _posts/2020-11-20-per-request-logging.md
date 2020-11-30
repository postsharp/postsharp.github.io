---
layout: post 
comments: true
title: "Noisy logs? Improve your signal-to-noise ratio with per-request logging and sampling"
date: 2020-11-22 12:50:00 +02:00
categories: [Features]
permalink: /post/per-request-logging.html
author: "Gael Fraiteur"
image: /assets/images/blog/2020-11-30-per-request-logging/per-request logging-B.P-Sq.png
---

PostSharp Logging makes it so simple to add logging to your application that you can easily end up capturing gigabytes 
of data every minute, taking a big overhead on run-time performance, network bandwidth, and storage. 
But let's face it, most of this data won't ever be useful. Starting from v6.8, PostSharp Logging allows you
to define precisely which requests should be logged in HD, and which not.

<!--more-->

For instance, if you are running a web application, it is probably useless to log every single request with the 
highest level of detail, especially for types of requests that are served 100 times per second.  Therefore, it is 
important to be able to decide, at run time, which requests need to be logged. You may choose to disable logging by 
default and to enable logging only for select requests only.

We call that *per-request* or, more generally, *per-transaction* logging.

It has been possible to do per-request logging with PostSharp for a long time, but with PostSharp 6.8, it becomes
really easy.

In this article, I will assume I have some ASP.NET Core (or ASP.NET 5) application and I want to add logging
to it as an afterthought. 

You can download the source code of this example on [GitHub](https://github.com/postsharp/PostSharp.Samples/tree/master/Diagnostics/PostSharp.Samples.Logging.PerRequest).

## Step 1. Add PostSharp Logging to your app

1. Add the `PostSharp.Patterns.Diagnostics` package to the projects that you want to log.

2. Add the following custom attributes to your code. This will add logging to everything (really, every single
   method) but property getters or setters. You will likely need to tune this code to improve the signal-noise ratio.

    ```cs
    using PostSharp.Patterns.Diagnostics;

    // Add logging to everything
    [assembly:Log(AttributePriority = 0)]

    // Remove logging from property getters and setters
    [assembly:Log(AttributePriority = 1, 
        AttributeExclude = true, AttributeTargetMembers = "regex:get_.*|set_.")]

    ```

3. In your `Program.Main`, initialize PostSharp Logging. In this example we will direct the output to the
  system console, but you can use virtually any logging framework like log4net, Serilog or Microsoft's
  abstractions. See the [documentation](https://doc.postsharp.net/backends) for details.


    ```cs
    namespace PostSharp.Samples.Logging.PerRequest
    {
      public class Program
      {
        public static void Main(string[] args)
        {
          // Initializes PostSharp Logging. You can plug your own framework here.
          LoggingServices.DefaultBackend = new ConsoleLoggingBackend();

          CreateHostBuilder(args).Build().Run();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder =>
                {
                  webBuilder.UseStartup<Startup>();
                });
      }
    }
    ```

4. Start your web app from the command line using `dotnet run`, do a few requests from your browser,
   and you will see log records appearing:

      ```text
      Debug     | Trace  | Program.CreateHostBuilder([]) | Starting.
      Debug     | Trace  | Program.CreateHostBuilder([]) | Succeeded: returnValue = {Microsoft.Extensions.Hosting.HostBuilder}.
      Debug     | Trace  | Startup..ctor({Microsoft.Extensions.Configuration.ConfigurationRoot}) | Starting.
      Debug     | Trace  | Startup..ctor({Microsoft.Extensions.Configuration.ConfigurationRoot}) | Succeeded.
      Debug     | Trace  | Startup.ConfigureServices([ {ServiceType: Microsoft.Extensions.Hosting.IHostingEnvironment Lifetime: Singleton ImplementationInstance: Microsoft.Extensions.Hosting.Internal.HostingEnvironment}, {ServiceType: Microsoft.Extensions.Hosting.IHostEnvironment Lifetime: Singleton ImplementationInstance: Microsoft.Extensions.Hosting.Internal.HostingEnvironment}, {ServiceType: Microsoft.Extensions.Hosting.HostBuilderContext Lifetime: Singleton ImplementationInstance: Microsoft.Extensions.Hosting.HostBuilderContext}, {ServiceType: Microsoft.Extensions.Configuration.IConfiguration Lifetime: Singleton ImplementationFactory: Microsoft.Extensions.Configuration.IConfiguration <CreateServiceProvider>b__26_0(System.IServiceProvider)}, {ServiceType: Microsoft.Extensions.Hosting.IApplicationLifetime Lifetime: Singleton ImplementationFactory: Microsoft.Extensions.Hosting.IApplicationLifetime <CreateServiceProvider>b__26_1(System.IServiceProvider)}, and 64 more ]) | Starting.
      Debug     | Trace  | Startup.ConfigureServices([ {ServiceType: Microsoft.Extensions.Hosting.IHostingEnvironment Lifetime: Singleton ImplementationInstance: Microsoft.Extensions.Hosting.Internal.HostingEnvironment}, {ServiceType: Microsoft.Extensions.Hosting.IHostEnvironment Lifetime: Singleton ImplementationInstance: Microsoft.Extensions.Hosting.Internal.HostingEnvironment}, {ServiceType: Microsoft.Extensions.Hosting.HostBuilderContext Lifetime: Singleton ImplementationInstance: Microsoft.Extensions.Hosting.HostBuilderContext}, {ServiceType: Microsoft.Extensions.Configuration.IConfiguration Lifetime: Singleton ImplementationFactory: Microsoft.Extensions.Configuration.IConfiguration <CreateServiceProvider>b__26_0(System.IServiceProvider)}, {ServiceType: Microsoft.Extensions.Hosting.IApplicationLifetime Lifetime: Singleton ImplementationFactory: Microsoft.Extensions.Hosting.IApplicationLifetime <CreateServiceProvider>b__26_1(System.IServiceProvider)}, and 64 more ]) | Succeeded.
      Debug     | Trace  | Startup.Configure({Microsoft.AspNetCore.Builder.ApplicationBuilder}, {Microsoft.AspNetCore.Hosting.HostingEnvironment}) | Starting.
      Debug     | Trace  | Startup.Configure({Microsoft.AspNetCore.Builder.ApplicationBuilder}, {Microsoft.AspNetCore.Hosting.HostingEnvironment}) | Succeeded.
      info: Microsoft.Hosting.Lifetime[0]
            Now listening on: https://localhost:5001
      info: Microsoft.Hosting.Lifetime[0]
            Now listening on: http://localhost:5000
      info: Microsoft.Hosting.Lifetime[0]
            Application started. Press Ctrl+C to shut down.
      info: Microsoft.Hosting.Lifetime[0]
            Hosting environment: Development
      info: Microsoft.Hosting.Lifetime[0]
            Content root path: C:\src\PostSharp.Samples\Diagnostics\PostSharp.Samples.Logging.PerRequest
      Debug     | Custom | AspNetCoreLogging | GET / | Starting.
      Debug     | Trace  | IndexModel..ctor({Microsoft.Extensions.Logging.Logger`1[PostSharp.Samples.Logging.PerRequest.Pages.IndexModel]}) | Starting.
      Debug     | Trace  | IndexModel..ctor({Microsoft.Extensions.Logging.Logger`1[PostSharp.Samples.Logging.PerRequest.Pages.IndexModel]}) | Succeeded.
      Debug     | Trace  | IndexModel.OnGet() | Starting.
      Debug     | Trace  | IndexModel.OnGet() | Succeeded.
      Debug     | Trace  | CommonCode.HelloWorld() | Starting.
      Debug     | Custom |   CommonCode | It seems logging is enabled.
      Debug     | Trace  | CommonCode.HelloWorld() | Succeeded.
      Debug     | Custom | AspNetCoreLogging | GET / | Success: StatusCode = 200.
      ```

So far so good, but you will soon discover that the amount of information is overwhelming.

## Step 2. Configure verbosity using a configuration file

To avoid being submerged in an ocean of logs, we now want to limit the logging only interesting requests. 
Imagine this scenario:

* By default, only warnings and errors will be logged.
* For the Privacy page, we know we have more problems and they are difficult to reproduce (please excuse this
  unlikely scenario but this is just an illustration), so we want to log with high verbosity all requests
  from this page.
* We also have some problems on the Home page, but the traffic is too heavy to log every single request,
  so we just want to log one request every 10 seconds.

Let's implement these rules in our app.

1. Create a file `postsharp-logging.config` with the following content:

```cs
<?xml version="1.0" encoding="utf-8" ?>
<logging>
	<verbosity level='warning'/>
	<transactions>
		<policy type='AspNetCoreRequest'
            if='t.Request.Path == "/Privacy"'>
			<verbosity>
				<source level='debug'/>
			</verbosity>
		</policy>
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

2. Add the packages `PostSharp.Patterns.Diagnostics.AspNetCore` and `PostSharp.Patterns.Diagnostics.Configuration`
   to your top-level project (it is not necessary to add it to all projects in your solution).

3. In your `Program.Main`, add a call to `AspNetCoreLogging.Initialize()`. This initializes the interception
   of incoming web requests in ASP.NET Core.

4. Also in your `Program.Main`, configure the logging back-end with the `ConfigureFromXml` method.

This will give you the following code:

```cs
public static void Main(string[] args)
{
  
  AspNetCoreLogging.Initialize();
  LoggingServices.DefaultBackend = new ConsoleLoggingBackend();

  LoggingServices.DefaultBackend.ConfigureFromXml(XDocument.Load("postsharp-logging.config"));

  CreateHostBuilder(args).Build().Run();
}

```
  
Now if you run your application in a console and test it from a browser, you will see the logging is
no longer so verbose, but it follows the rules we defined.


### Step 3. Modify the verbosity on the fly

Now suppose your application has been deployed to production for a while and you're starting to notice
frequent errors for some specific query string. You want to gather more detailed logs about these
requests, but without redeploying your app.

To get prepared for this scenario, you need to store your logging configuration not within your application, 
but in a cloud storage service (or any HTTP server).

In this example we will use Google Drive. With the Share option of Google Drive, create a _public_ link to this file,
 e.g. a link that everyone can see (but not edit!). For instance: 

```
https://drive.google.com/file/d/1L50ddULX1ZXHscNN0CjYvjrwHRqd8Lqm/view?usp=sharing
```

 In this link, `1L50ddULX1ZXHscNN0CjYvjrwHRqd8Lqm` is the file identifier. Append it to `https://drive.google.com/uc?export=download&id=`,
 for instance:
 
 ```
 https://drive.google.com/uc?export=download&id=1L50ddULX1ZXHscNN0CjYvjrwHRqd8Lqm
 ```

 Then use this link to configure PostSharp Logging and specify a reload period:

```cs
   LoggingServices.DefaultBackend.ConfigureFromXmlWithAutoReloadAsync(
       new Uri("https://drive.google.com/uc?export=download&id=1L50ddULX1ZXHscNN0CjYvjrwHRqd8Lqm"), 
       TimeSpan.FromSeconds(60) );
```

You can now see in your log that PostSharp Logging periodically fetches the configuration:

```text
LoggingConfigurationManager | Configuring {PostSharp.Patterns.Diagnostics.Backends.Console.ConsoleLoggingBackend} from {https://drive.google.com/uc?export=download&id=1L50ddULX1ZXHscNN0CjYvjrwHRqd8Lqm} | Starting.
LoggingConfigurationManager | Configuring {PostSharp.Patterns.Diagnostics.Backends.Console.ConsoleLoggingBackend} from {https://drive.google.com/uc?export=download&id=1L50ddULX1ZXHscNN0CjYvjrwHRqd8Lqm} | No change.
```

You can edit the configuration file online with Google Drive text editor, and the changes will be taken into account
the next time the configuration is fetched.

### What can possibly go wrong?

When you modify a configuration, you will need to monitor your log for a few minutes to make sure you didn't
do a mistake. If the configuration file is incorrect, your application will continue to work as usually, but
the verbosity configuration file will be partially or totally ignored.

Look in your logs for exceptions like this:

```text
TransactionPolicy | Cannot compile the expression OnceEveryXSeconds(10, t.Request.Path)x. The policy will be disabled. Exception = {DynamicExpresso.Exceptions.ParseException}.
 > DynamicExpresso.Exceptions.ParseException: Syntax error (at index 37).
 >    at DynamicExpresso.Parsing.Parser.ValidateToken(TokenId t, String errorMessage)
 >    at DynamicExpresso.Parsing.Parser.Parse()
 >    at DynamicExpresso.Interpreter.ParseAsLambda(String expressionText, Type expressionType, Parameter[] parameters)
 >    at DynamicExpresso.Interpreter.Parse(String expressionText, Type expressionType, Parameter[] parameters)
 >    at DynamicExpresso.Interpreter.Parse(String expressionText, Parameter[] parameters)
 >    at PostSharp.Patterns.Diagnostics.Transactions.ExpressionCompiler.CompilePredicate[T](String expression, Boolean defaultValue, Boolean isSamplingExpression)
 ```

The second thing you need to pay attention to is the security of the configuration file. Don't let unauthorized people
edit it. Eventually, this file allows them execute code within your application, and you cannot exclude that DynamicExpresso
does not have a security gap. 


### Custom transactions

If your application also processes transactions (such as messages from a queue or message bus, or files from a directory),
but is not based on ASP.NET Core, you can still use dynamic configuration but it takes a little more effort to
prepare your code for it. See the documentation (TODO LINK) for details.


### Summary

PostSharp Logging makes it very easy to create highly-detailed log, but quite often too much is too much. More
often than not, you need basic logging for 99.9% of your requests and super-detailed logging for 0.1%. And
when you app runs in production, you don't want to redeploy it just to change the level of logging.

With PostSharp Logging 6.8, it is now a question of minutes to implement this scenario. You can store your logging 
configuration in an online drive and configure your application to reload it periodically.


Happy PostSharping!
 