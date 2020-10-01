---
layout: post 
comments: true
title: "Blazor support in PostSharp 6.7"
date: 2020-10-01 12:40:00 +02:00
categories: [Announcement]
permalink: /post/blazor-support-6.7.html
author: "Alexander D."
image: /assets/images/blog/2020-10-01-blazor_support_6_7/blazor-support.jpg
---
Today we would like to announce that the preview of Blazor support is now available in PostSharp 6.7. Blazor is a framework from Microsoft for client-side web development using .NET and C# instead of JavaScript. If you want to learn more about the framework, visit [Blazor.net](https://blazor.net).

Because PostSharp works on the IL level and conforms to the CLI specification, there’s usually little development work required on our side when adding support for a new platform. However, a lot of effort goes into work on our build configuration and automation system, to make sure that we can successfully execute all of our test suites on the target platform (and in some cases on physical devices). This was also the case with Blazor. We even had to build our own test runner based on Xunit that executes the tests within the web browser.

Overall, we’re very happy with the results of our tests: you can use PostSharp Framework and selected Patterns libraries in your Blazor applications today. Please read below for more detailed information about supported use cases.

## What is supported
First of all, PostSharp supports Blazor as a runtime platform only via .NET Standard. You can use PostSharp in your .NET Standard libraries and then reference these libraries in your Blazor application project. Adding PostSharp directly to a Blazor application project is not supported.

Second, some of the Patterns libraries are not applicable to the Blazor platform and therefore are not supported. See the table below for the list of the PostSharp packages that support Blazor.

| Package                          | Supported
|----------------------------------|----------
| PostSharp                        | Yes
| PostSharp.Patterns.Common        | Yes
| PostSharp.Patterns.Aggregation   | Yes
| PostSharp.Patterns.Model         | Yes
| PostSharp.Patterns.Diagnostics   | Yes (backends that support NetStandard)
| PostSharp.Patterns.Threading     | N/A
| PostSharp.Patterns.Xaml          | N/A
| PostSharp.Patterns.Caching       | Yes (IMemoryCache backend)

## Configuring the Blazor linker
By default all Blazor applications use a linker in the Release build configuration. The purpose of the linker is to discard unused code and reduce the size of the application. Linking is based on static analysis and it cannot correctly detect all the code used by PostSharp.

To prevent the linker from removing the required code you need a custom linker configuration in your project. The configuration procedure is described on the Microsoft Docs page: [Configure the Linker for ASP.NET Core Blazor](https://docs.microsoft.com/en-us/aspnet/core/blazor/host-and-deploy/configure-linker). Please use the following code as your linker configuration file: 

```xml
<linker>
  <assembly fullname="netstandard">
    <type fullname="*">
    </type>
  </assembly>
</linker>
```


# Example
Let's look at a simple Blazor application that uses PostSharp Aspect Framework. The full source code of this example is published in our [samples browser](https://samples.postsharp.net/f/PostSharp.Samples.Blazor.AutoRetry/). The project is based on the standard Visual Studio template "Blazor WebAssembly App".

In this application we have the `WeatherService` class with the `GetCurrentForecast()` method that downloads weather forecast data from a server.
For the purpose of the example 50% of the calls to our method fail with an exception:

```csharp
public async Task<WeatherForecast[]> GetCurrentForecast()
{
  // Fail every other request.
  if (++counter % 2 == 1)
  {
    throw new WebException("Service unavailable.");
  }

  return await this.httpClient.GetFromJsonAsync<WeatherForecast[]>("sample-data/weather.json");
}
```

To make our application more resilient to server failures, we can retry the call with a short delay when the connection fails.

Using PostSharp to automate the implementation of the retry pattern we create a custom aspect [`AutoRetryAttribute`](https://samples.postsharp.net/f/PostSharp.Samples.Blazor.AutoRetry/Aspects/AutoRetryAttribute.cs.html) and apply it to all our service classes.

```csharp
[AutoRetry]
public class WeatherService
{
  // ...
}
```

Finally, we also need to add a custom linker configuration file ([`LinkerConfig.xml`](https://samples.postsharp.net/f/PostSharp.Samples.Blazor.AutoRetry/LinkerConfig.xml.html)) to our project as described above.

To see our custom aspect in action, build and run the sample application. Then click the "Fetch data" link in the left navigation bar. The data will load successfully (possibly with a few seconds' delay).

You can also find the following log message in the web browser console:

```
Method failed with exception WebException 'Service unavailable.'. Sleeping 3 s and retrying. This was our attempt #1.
```

## Summary
You can start using PostSharp 6.7 in your Blazor applications today.

Please note that Blazor support is still in preview status and some of the listed packages may have unresolved compatibility issues with Blazor.

We’re working on fixing any bugs we can find ourselves and will be happy to receive any feedback you can provide us.