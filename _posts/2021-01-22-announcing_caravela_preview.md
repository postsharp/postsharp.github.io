---
layout: post 
comments: true
title: "Announcing PostSharp \"Caravela\""
date: 2021-01-22 00:00:00 +02:00
categories: [Announcement]
permalink: /post/announcing-caravela-preview.html
author: "Gael Fraiteur"
tag: featured
published: false
---
Today we're excited to make a one-in-ten-years annoucement: we're releasing the first public
preview of PostSharp "Caravela", a Roslyn-based framework for code transformation and aspect-oriented 
programming. 

We intend PostSharp "Caravela" to become the successor of the MSIL-based PostSharp Framework
and PostSharp SDK.

PostSharp "Caravela" builds on 15 years of experience in code transformation and aspect-oriented programming,
but has been designed from scratch for C# 9 and modern development pipelines. It has a radically different
approach than PostSharp.

Today, we're demonstrating two components of PostSharp "Caravela":

*  [Caravela.Framework](https://github.com/postsharp/Caravela/blob/master/Caravela.Framework.md) is a high-level aspect framework comparable to PostSharp Framework or AspectJ. This
  component is in a very early preview and is not considered to be of any commercial use yet.
*  [Caravela.Framework.Sdk](https://github.com/postsharp/Caravela/blob/master/Caravela.Framework.Sdk.md) is a low-level extensibility point to the Roslyn compiler, similar to source
  generators, but allowing for arbitrary code modifications (instead of just additions of partial classes).
  This component can be compared to PostSharp SDK or Fody, but using the clean Roslyn code model instead of the
  arcane MSIL one. This component is already very usable and useful today and is not expected to change much
  in the future.

In this blog post:

- [Caravela.Framework: a high-level aspect framework](#caravelaframework-a-high-level-aspect-framework)
  - [Example: logging](#example-logging)
- [Caravela.Framework.Sdk: hack the compiler](#caravelaframeworksdk-hack-the-compiler)
  - [Example: CancellationToken](#example-cancellationtoken)
- [Benefits of PostSharp "Caravela" over PostSharp MSIL](#benefits-of-postsharp-caravela-over-postsharp-msil)
- [Benefits of PostSharp "Caravela" over Roslyn source generators](#benefits-of-postsharp-caravela-over-roslyn-source-generators)
- [Most Anticipated Questions](#most-anticipated-questions)
  - [How long will the MSIL-based PostSharp be maintained?](#how-long-will-the-msil-based-postsharp-be-maintained)
  - [Will PostSharp "Caravela" be compatible with PostSharp 6.*?](#will-postsharp-caravela-be-compatible-with-postsharp-6)
  - [What will happen with PostSharp Patterns?](#what-will-happen-with-postsharp-patterns)
  - [How will PostSharp "Caravela" be licensed and priced?](#how-will-postsharp-caravela-be-licensed-and-priced)
- [Summary](#summary)


## Caravela.Framework: a high-level aspect framework

 [Caravela.Framework](https://github.com/postsharp/Caravela/blob/master/Caravela.Framework.md) is a code transformation
 and aspect-oriented programming  based on templates written in pure C#.

These templates make it easy to write code that combines compile-time information (such as names and types of parameters of a method) and run-time information (such as parameter values) in a natural way, without having to learn another language or having to combine C# with some special templating language.

Instead of a thousand words, let's look at this example:

### Example: logging

[&#x25b6; Try in your browser](https://try.postsharp.net/#log)

Here is the aspect code. It represents the code transformation.
```cs
public class LogAttribute : OverrideMethodAspect
{
    public override object Template()
    {
        Console.WriteLine(target.Method.ToDisplayString() + " started.");

        try
        {
            dynamic result = proceed();

            Console.WriteLine(target.Method.ToDisplayString() + " succeeded.");
            return result;
        }
        catch (Exception e)
        {
            Console.WriteLine(target.Method.ToDisplayString() + " failed: " + e.Message);

            throw;
        }
    }
}
```

Let's apply the `[Log]` aspect to the following method:
```cs
[Log]
static int Add(int a, int b)
{
    if ( a == 0 ) throw new ArgumentOutOfRangeException(nameof(a));
    return a + b;
}
```

The following method gets actually compiled instead of your source code:
```cs
[Log]
static int Add(int a, int b)
{
    Console.WriteLine("Program.Add(int, int) started.");
    try
    {
        int result;
        if (a == 0)
            throw new ArgumentOutOfRangeException(nameof(a));
        result = a + b;
        Console.WriteLine("Program.Add(int, int) succeeded.");
        return (int)result;
    }
    catch (Exception e)
    {
        Console.WriteLine("Program.Add(int, int) failed: " + e.Message);
        throw;
    }
}
```

> With Caravela, you can see and debug the C# code being actually compiled. For details, see
> [Debugging code with Caravela](https://github.com/postsharp/Caravela#debugging-code-with-caravela).

## Caravela.Framework.Sdk: hack the compiler

At PostSharp we are not fans of hacking because it turns out to be a hassle to maintain in the long term
(and our frameworks are designed to make your code more maintainable), but sometimes there may be good reasons to
overcome the limitations of the language.

[Caravela.Framework.Sdk](https://github.com/postsharp/Caravela/blob/master/Caravela.Framework.Sdk.md)
offers direct access to Caravela's underlying code-modifying capabilities through Roslyn-based APIs. Aspect weavers
written with Caravela SDK can perform arbitrary transformations of the project and syntax tree being compiled.

### Example: CancellationToken

[&#x25b6; Try in your browser](https://try.postsharp.net/#autocancellationtoken)

The next example demonstrates an aspect that adds a `CancellationToken` to your methods declarations
and method calls where it is missing.

Because the code of an SDK-based aspect weaver is naturally more complex and would not easily fit in a blog post,
please go to [GitHub](https://github.com/postsharp/Caravela.Open.AutoCancellationToken) if you want to see the 
source code of the aspect weaver.

Here is some example input code:

```cs
[AutoCancellationToken]
class C
{
    public static async Task MakeRequests()
    {
        var client = new FakeHttpClient();
        await MakeRequest(client);
    }

    private static async Task MakeRequest(FakeHttpClient client) 
    => await client.GetAsync("https://httpbin.org/delay/1");
}
```

What actually compiles is this. You can see that the aspect added  `CancellationToken` parameters and
arguments as needed.

```cs
[AutoCancellationToken]
class C
{
    public static async Task MakeRequests(System.Threading.CancellationToken cancellationToken = default)
    {
        var client = new FakeHttpClient();
        await MakeRequest(client, cancellationToken);
    }
 
    private static async Task MakeRequest(FakeHttpClient client, 
            System.Threading.CancellationToken cancellationToken = default) 
            => await client.GetAsync("https://httpbin.org/delay/1", cancellationToken);
}
```


## Benefits of PostSharp "Caravela" over PostSharp MSIL

PostSharp "Caravela" was designed from scratch. It is based on best lessons learned from PostSharp MSIL 
during the last 15 years, and addresses the main obstacles that are now hindering PostSharp MSIL.

You will enjoy the following benefits with Caravela compared to PostSharp:

* **Faster builds**: Caravela runs directly inside the compiler process (it is a fork of Roslyn), 
  does not require an external process,  and is therefore much faster;

* **More powerful transformations**: The templating technology used by Caravela allows for more control over code 
  than what is possible with PostSharp MSIL.

* **Better multi-platform support**: Caravela does not load the whole project being built in the compiler process, 
  therefore it avoids the  cross-compilation issues that have plagued PostSharp for many years;

* **Better design-time experience**: You will see introduced members and interfaces in Intellisence because Caravela
  will do that at design time and not at post-compilation time. No need for weird casts.

* **Better run-time performance**: Because of code generation improvements, you can create aspects that execute 
  much faster.
  
* **Better debugging experience**:  You can switch from source code view to transformed code view and debug the code exactly as it is executed.


## Benefits of PostSharp "Caravela" over Roslyn source generators

Unlike Roslyn source generators, PostSharp "Caravela":

 * can replace or enhance hand-written code (Roslyn source generators are additive only: you just can add partial classes);
 * allows you to write aspects (or code transformations):
     * in your main project (instead of a separate project),
     * using the C# language, with Intellisense and code validation (instead of building a string);
 
 * is therefore a real and complete framework for _aspect-oriented programming_ in C#, with the same level of
   functionality that exists in other languages (such as AspectJ for Java) -- which has never been the intent
   of Roslyn source generators.



## Most Anticipated Questions

### How long will the MSIL-based PostSharp be maintained?
  
Our current release plan with the MSIL-based PostSharp is:

* 6.9 (Q1 2021): addressing performance issues in PostSharp Tools for Visual Studio.
* 6.10 LTS (Q3 2021): support for .NET 6.

PostSharp 6.10 LTS will be our last supported version of the MSIL-based stack and we intend to support it
until the end of 2022. We will work with our customers to ensure the smoothest possible transition.

### Will PostSharp "Caravela" be compatible with PostSharp 6.*?

How compatible do we intend to be with PostSharp MSIL? How much code will you need to rewrite?

It has been 12 years since the last major breaking change in PostSharp. Do you remember the .NET landscape in 2008?
Clearly, we cannot build a new platform by keeping compatibility with designs that were optimal 12 years ago. However, we understand that PostSharp is used by thousands and we want to find a compromise between modernity and backward compatibility.

We have already taken the following compromise:

* your _aspect code_ (typically less than a dozen of classes) will need to be totally rewritten,
* your _business code_ should not be affected.

### What will happen with PostSharp Patterns?

We intend to port PostSharp Patterns to PostSharp "Caravela" in a way that maximizes backward compatibility,
but we may also take the the opportunity to make a few long-due breaking changes.

### How will PostSharp "Caravela" be licensed and priced?

We don't know yet. The preview releases are being licensed under the terms of the Evaluation License of PostSharp.

## Summary

PostSharp "Caravela" is the future of aspect-oriented programming and metaprogramming in .NET. It will take us a long
time to get there, but the possibilities are amazing and the pass much less rocky than 10 years ago.

For more information, please look at the home of PostSharp "Caravela" on [GitHub](https://github.com/postsharp/Caravela).

If you have any feedback or question regarding Caravela, 
please [open an issue](https://github.com/postsharp/Caravela/issues/new), [start a discussion](https://github.com/postsharp/Caravela/discussions/new), or contact us directly at hello@postsharp.net.

