---
layout: post 
comments: true
title: "Intercepting methods"
permalink: /post/intercepting-methods.html
author: "Petr H."
published: false
excerpt_separator: <!--more-->
---
**Method interception** is a technique where you annotate a method and then when it's called, an interceptor is executed _instead of_ the method body. PostSharp Community allows you to add such interceptors to your code.

<!--more-->

Let's examine method interception by going through some examples from my own use:

## [Retry] 

Suppose you have a method that tries to write a transaction to a highly contested database. Sometimes, the transaction fails and throws an exception but in that case you want to try it again, since it will likely succeed when run a second time. Without method interception, you could do it like this:

```c#
void SaveToDatabase(File file) {
  while(true) {
    try 
    {
     // Execute transaction...
    }
    catch (TransactionRolledBackException)
    {
      // Let's try again.
      continue;
    }
  }
}
```
This works fine but you probably have more than one such method. Also, the retry functionality is probably more complicated: there may be a maximum number of retries, a timeout, or logging of failures. So you'll want to factor the retry code out.

Here's how you do it with PostSharp interception. First, you create the interception aspects:
```c#
[Serializable]
public class RetryAttribute : MethodInterceptionAspect 
{
   public override void OnInvoke(MethodInterceptionArgs args) 
   {
       while(true) {
         try 
         {
           args.Proceed();
         }
         catch (TransactionRolledBackException)
         {
           // Let's try again.
           continue;
         }
      }
   }
}
```
Here, `args.Proceed()` means "call the original method".

Then, you apply the Retry method interception aspect to your main code:
```c#
[Retry]
void SaveToDatabase(File file) {
     // Execute transaction...
}
```
Now, during compilation, PostSharp rewrites your `SaveToDatabase` method so that its method body only calls the interception aspect, and the original method body is called only when the interception aspect calls `args.Proceed`.

We have [a more advanced retry sample](https://samples.postsharp.net/f/PostSharp.Samples.AutoRetry/) as well.
## [Cache]
I said that the original method body is called only when the aspect calls `args.Proceed`. That also means the original method body might not get called at all. 

You could create an aspect like this:
```c#
[Serializable]
public class CacheAttribute : MethodInterceptionAspect 
{
   private bool cached;
   private object knownResult;
   
   public override void OnInvoke(MethodInterceptionArgs args) 
   {
       if (cached) 
       {
         args.ReturnValue = knownResult;
       }
       else 
       {
         args.Proceed();
         knownResult = args.ReturnValue;
         cached = true;
       }
   }
}
```
If you then annotate a method with `[Cache]`, the method body will only run once. Subsequent calls will only return the cached `knownResult` value.  

This example doesn't take into account that you might want to call the method body again if the method was called on a different object, with different parameters or if enough time already elapsed.

We have [a more advanced caching sample](https://samples.postsharp.net/f/PostSharp.Samples.CustomCaching/) as well.
## [RunsOnCustomThread]
Xunit normally runs tests on thread pool threads. But, in some unit tests for the PostSharp Threading library, I need to make sure that the unit test runs on a non-thread-pool thread.

Method interception could help here as well, with this aspect:
```c#
[Serializable]
public class RunOnCustomThreadAttribute : MethodInterceptionAspect
{
    public override void OnInvoke( MethodInterceptionArgs args )
    {
        Exception caughtException = null;
        Thread t = new Thread( () =>
                               {
                                   try
                                   {
                                       args.Proceed();
                                   }
                                   catch ( Exception ex )
                                   {
                                       caughtException = ex;
                                   }
                               });
        t.Start();
        t.Join();
        if ( caughtException != null )
        {
            throw caughtException;
        }
    }
}
```
Then, by writing unit tests like this:
```c#
[Fact, RunOnCustomThread]
public void TestThreadPoolOperation()
{
    // unit test here
}
```
I had a guarantee that the unit test will run on its own thread.
## Works on all methods
PostSharp interception aspects work on all kinds of methods: you can intercept both instance and static methods, and both public and private methods. You don't need interfaces and the methods don't need to be virtual.

That's because PostSharp does interception by rewriting the method bodies of the existing methods rather than by subclassing and creating overrides. 

## Conclusion
With method interception aspects, you can add cross-cutting functionality to your methods with attributes. This keeps your code clean and avoids code duplication. This functionality is now part of PostSharp Community Edition, which is available for free.

For more information, see [our documentation](https://doc.postsharp.net/method-interception) or [sample code](https://doc.postsharp.net/method-interception).
