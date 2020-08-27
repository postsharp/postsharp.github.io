---
layout: post 
comments: true
title: "Finding slow methods with PostSharp Logging and Microsoft Log Parser"
date: 2020-08-26 09:40:00 +02:00
categories: [Guest article]
permalink: /post/finding-slow-methods-with-postsharp-logging-and-microsoft-log-parser.html
author: "Marko Pađen"
image: /assets/images/blog/2020-08-26-finding_slow_methods_with_postsharp_logging_and_microsoft_log_parser/Finding-Slow-Methods.jpg
---
[Marko Pađen](https://www.linkedin.com/in/marko-pa%C4%91en/), a full-stack freelance software engineer with 20 years of experience, wrote about his experience with PostSharp Logging. Read more about his take on logging and finding slow methods with PostSharp Logging and Microsoft Log Parser.


Logging is boring. Combing through the log files to find the problem source is not a thrill either. There are many logging frameworks and log parsers available which make your life easier, but you still have to do a lot of manual work. PostSharp reduces boilerplate code in general, and the developers put a lot of focus on logging.

There are many features I found interesting in this extension but in this article I will focus on a specific problem: how to identify slow methods and log their arguments..

Entire code explained here can be found on my fork of the [Logging tutorial](https://github.com/notmarkopadjen/PostSharp.Tutorials).

## Problem definition

My friend has a service, and clients are complaining it’s running slow. They did not provide any additional info (shocker). To make things worse, my friend did some basic logging, but nothing that could help us diagnose the issue. The service is being hosted on-premise, so no cloud request analysis (like Application Insights) is available. Luckily, release cycle is very fast, so we can implement any code change we want. For the sake of simplicity, that project is the [logging tutorial](https://github.com/postsharp/PostSharp.Tutorials/tree/master/Logging/PostSharp.Tutorials.Logging) provided by PostSharp.

## Ideas

As we don’t know upfront what we need and what we don’t need, it would be useful to create logs on two verbosity levels: trace and warnings. Warnings will log our method execution overtime so we can identify the issue, and trace logs would provide any additional information. Then we can examine log files with ***Microsoft Log Parser 2.2*** and hopefully identify the issue.

## Implementation

PostSharp can connect to many logging backends. The one suitable for us is NLog, because it easily provides multiple log targets. We will set it up by following [official documentation](https://doc.postsharp.net/nlog).

We need to add NLog backend reference:
```xml
<PackageReference Include="PostSharp.Patterns.Diagnostics.NLog" Version="6.6.12" />
```
Please make sure your `Diagnostics.NLog` package has the same version as the `Diagnostics`:

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>netcoreapp3.1</TargetFramework>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="PostSharp.Patterns.Diagnostics" Version="6.6.12" />
    <PackageReference Include="PostSharp.Patterns.Diagnostics.NLog" Version="6.6.12" />
  </ItemGroup>

</Project>
```
We will also change console logging backend to NLog file targets in `Program` class:

```csharp
static void Main(string[] args)
{
	var nlogConfig = new LoggingConfiguration();

	var traceTarget = new FileTarget("file-trace")
	{
		FileName = "trace.log",
		KeepFileOpen = true,
		ConcurrentWrites = false,
		Header = new SimpleLayout("Time|Level|Class|Method|Info")
	};
	nlogConfig.AddTarget(traceTarget);
	nlogConfig.LoggingRules.Add(new LoggingRule("*", NLog.LogLevel.Trace, traceTarget));

	var warnTarget = new FileTarget("file-warn")
	{
		FileName = "warn.log",
		KeepFileOpen = true,
		ConcurrentWrites = false,
		Header = new SimpleLayout("Time|Level|Class|Method|Info")
	};
	nlogConfig.AddTarget(warnTarget);
	nlogConfig.LoggingRules.Add(new LoggingRule("*", NLog.LogLevel.Warn, warnTarget));

	LogManager.EnableLogging();

	LoggingServices.DefaultBackend = new NLogLoggingBackend(new LogFactory(nlogConfig));

	RequestProcessor requestProcessor = new RequestProcessor();
	requestProcessor.ProcessRequests("requestsQueue");
}
```
As per already provided `postsharp.config`, this will log all methods except getters and setters with execution time threshold of 200ms:

```xml
<Project xmlns="http://schemas.postsharp.org/1.0/configuration">
	
<Multicast xmlns:d="clr-namespace:PostSharp.Patterns.Diagnostics;assembly:PostSharp.Patterns.Diagnostics">
	<!-- Adds logging to every method -->
	<d:Log/>
	<!-- Remove logging from property getters and setters -->
	<d:Log AttributeExclude="true" AttributeTargetMembers="regex:get_*|set_*"/>
</Multicast>
	
	<Logging xmlns="clr-namespace:PostSharp.Patterns.Diagnostics;assembly:PostSharp.Patterns.Diagnostics">
		<Profiles>
			<LoggingProfile Name="Default"  IncludeExecutionTime="True" ExecutionTimeThreshold="200">
				<DefaultOptions>
					<LoggingOptions IncludeParameterName="True"/>
				</DefaultOptions>
			</LoggingProfile>
		</Profiles>
	</Logging>
</Project>
```
By running the application now, you will get two log files:

```
> ls *.log


    Directory: C:\sources\PostSharp.Tutorials\Logging\PostSharp.Tutorials.Logging\bin\Debug\netcoreapp3.1


Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----         8/2/2020   1:54 PM          12500 trace.log
-a----         8/2/2020   1:54 PM           2255 warn.log
```
## Log analysis

We will use Microsoft Log Parser 2.2 to search through these files. First file we focus on is `warn.log`.
By specifying NLog file header (`Header = new SimpleLayout("Time|Level|Class|Method|Info")`) we have made SQL queries possible on warn.log.
Asking help for the specific file will provide you fields (column names) among other things:

```
> logparser -h -i:TSV warn.log -iSeparator:"|"

Input format: TSV (TSV Format)
Parses text files containing tab- or space- separated values

FROM syntax:

 <filename> [, <filename> ...] |
 http://<url> |
 STDIN
 Path(s) to TSV file(s)

...

Fields:

  Filename (S)         RowNumber (I)         Time (T)         Level (S)
  Class (S)            Method (S)            Info (S)

...

```
Output also provides column type, which is very useful on querying. Knowing this, we can execute a query which gives as all methods that took more than threshold value to execute:

```
> logparser "SELECT Time, EXTRACT_EXTENSION(Class) as Class, EXTRACT_EXTENSION(Method) as Method, Info FROM warn.log WHERE Info LIKE '%Overtime%'"  -i:TSV -iSeparator:"|"
Time                Class            Method                                                     Info
------------------- ---------------- ---------------------------------------------------------- -----------------------------------------------------------------------------
2020-08-02 13:54:14 RequestProcessor ProcessVacationRequest(vacationRequest = {Request Id=145}) Overtime: executionTime = 222.70 ms, threshold = 200 ms.
2020-08-02 13:54:14 RequestProcessor ProcessRequest(request = {Request Id=145})                 Overtime: executionTime = 226.14 ms, threshold = 200 ms.
2020-08-02 13:54:15 CrmClient        GetPendingRequests(queue = "requestsQueue")                Overtime: returnValue = false, executionTime = 495.33 ms, threshold = 200 ms.
2020-08-02 13:54:15 RequestProcessor ProcessRequests(queuePath = "requestsQueue")               Overtime: executionTime = 501.58 ms, threshold = 200 ms.

Statistics:
-----------
Elements processed: 10
Elements output:    4
Execution time:     0.01 seconds

```

If we need more information, we can query traces for the specific request ID:

```
> logparser "SELECT Time, EXTRACT_EXTENSION(Class) as Class, EXTRACT_EXTENSION(Method) as Method, Info FROM trace.log WHERE Method LIKE '%{Request Id=145}%'"  -i:TSV -iSeparator:"|"
Time                Class            Method                                                     Info
------------------- ---------------- ---------------------------------------------------------- --------------------------------------------------------
2020-08-02 13:54:14 RequestProcessor ProcessRequest(request = {Request Id=145})                 Starting.
2020-08-02 13:54:14 RequestProcessor ProcessVacationRequest(vacationRequest = {Request Id=145}) Starting.
2020-08-02 13:54:14 CrmClient        Update(entity = {Request Id=145})                          Starting.
2020-08-02 13:54:14 CrmClient        Update(entity = {Request Id=145})                          Succeeded: executionTime = 60.87 ms.
2020-08-02 13:54:14 RequestProcessor ProcessVacationRequest(vacationRequest = {Request Id=145}) Overtime: executionTime = 222.70 ms, threshold = 200 ms.
2020-08-02 13:54:14 RequestProcessor ProcessRequest(request = {Request Id=145})                 Overtime: executionTime = 226.14 ms, threshold = 200 ms.

Statistics:
-----------
Elements processed: 72
Elements output:    6
Execution time:     0.01 seconds
```

Here we see that our problem is most probably `ProcessRequest` while processing request 145, so we have something to focus on.

## Other automated logging benefits

There are a few other things I liked about PostSharp Logging:

### Clean code

First one is very obvious: you don’t have to write code yourself, plus you get a cleaner code. You will remove all those `.Warn("About some potential issue!")` and `.Error(ex, $"Something happened with {request}!")` and make more space for a real business-related code. That code you wrote is probably just repeating the previous line in a log-ready way. Additionally, while changing the actual code, you may forget to change the logging part as well, making log files incomplete or incorrect.

### Performance

Next, manual logging will slow your application down. It may be just a couple of stack calls, string concatenations, but on time-sensitive systems it can make a big difference. Especially if you have many trace logs which are almost never activated on productive systems. Those logs have a lot of string concatenations by their nature, and they will fill your memory unless you use lazy string concatenation. PostSharp will not even insert those methods in build unless it's required, thus saving execution time.

### Framework-agnostic

By separating logging from your application logically, you also create a bridge to a logging framework. This would mean that you may easily change logging framework later, for example if you decide to move from on-premise to cloud, or you start some logging ETL process. You may find more information on the backend logging configuration [documentation page](https://doc.postsharp.net/backends).

## Conclusion

I personally find AOP patterns useful. There are many debates about whether or not hiding the code from developer may be counterproductive, especially if this code is easily replaced with OOP code.
In the case of logging, this is not true. Logging aspect actually injects logging code at build time, like if you would have written it, thus saving you a lot of time and improving log quality.  



## Biography

*Marko Pađen is a full-stack (back-end, front-end, DevOps, testing) freelance software engineer with 20 years of experience.*

*He can do stuff with (large-scale) software: architecture, design, implement (code), test, document, build, release.*

*You can connect with Marko via his [LinkedIn profile](https://www.linkedin.com/in/marko-pa%C4%91en/) or get in touch via his [website](https://marko.padjen.dev/).*